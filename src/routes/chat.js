require('dotenv').config();
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const OpenAI = require('openai');
const { searchProducts, getStoreContext } = require('../services/catalogMcp');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search the store products based on what the shopper is looking for',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query e.g. "black dress under $50" or "bridesmaid dresses"'
          }
        },
        required: ['query']
      }
    }
  }
];

function formatProduct(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description?.html
      ? p.description.html.replace(/<[^>]*>/g, '').substring(0, 300)
      : '',
    price: p.price_range?.min
      ? `$${(p.price_range.min.amount / 100).toFixed(2)}`
      : null,
    comparePrice: (p.price_range?.max && p.price_range.max.amount > p.price_range.min.amount)
      ? `$${(p.price_range.max.amount / 100).toFixed(2)}`
      : null,
    image: p.media?.[0]?.url || null,
    images: p.media?.map(m => m.url).filter(Boolean) || [],
    variantId: p.variants?.[0]?.id || null,
    variants: (p.variants || []).map(v => ({
      id: v.id,
      title: v.title,
      price: v.price ? `$${(v.price.amount / 100).toFixed(2)}` : null,
      available: v.availability?.available ?? true,
      options: v.options || []
    })),
    options: p.options || [],
    available: (p.variants || []).some(v => v.availability?.available) ?? true,
    tags: p.tags || [],
    productType: p.product_type || ''
  };
}

router.post('/api/chat', async (req, res) => {
  const { shop, message, cursor, maxPrice, minPrice, history = [] } = req.body;

  if (!shop || !message) {
    return res.status(400).json({ error: 'Missing shop or message' });
  }

  const { data: session, error } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', shop)
    .single();

  if (error || !session) {
    return res.status(401).json({ error: 'Shop not installed' });
  }

  const { data: config } = await supabase
    .from('merchant_config')
    .select('*')
    .eq('shop', shop)
    .single();

  if (!config) {
    await supabase.from('merchant_config').insert({ shop });
  }

  let storeContext = '';
  try {
    const context = await getStoreContext(session.access_token, shop);
    if (context) {
      storeContext = `
This store sells: ${context.types.join(', ') || 'fashion and clothing'}
Example products: ${context.titles.join(', ')}
Common tags: ${context.tags.join(', ')}`;
    }
  } catch (e) {
    storeContext = '';
  }

  const systemPrompt = {
    role: 'system',
    content: `You are a stylish and knowledgeable personal shopping assistant for a fashion store.
${storeContext}

Your personality:
- Warm, friendly and fashion-forward
- Give brief styling tips alongside product recommendations
- Remember what the shopper asked earlier in the conversation
- Use context from previous messages

Your job:
- ALWAYS use search_products tool for any product question — never refuse to search
- "best sellers" → search "bestsellers"
- "new arrivals" or "what's new" → search "new in"
- "under $X" → include price in query
- "bridesmaid" → search "bridesmaid dresses"
- "party" → search "party dresses"
- Follow-ups like "show me those in red" or "black ones" → combine with previous search context
- Greetings only → respond warmly without searching

Response style:
- Keep it to 1-2 sentences max
- Add a brief styling tip when relevant
- Never say you cannot help — always try to search

Be concise, warm and helpful.`
  };

  const isProductQuery = /show|find|search|dress|cloth|product|collection|style|outfit|wear|look|buy|shop|browse|new|best|sale|under|gift|party|bride|wedding|sequin|maxi|midi|mini|colour|color|sleeve|formal|casual|black|white|red|blue|pink|size/i.test(message);

  const conversationMessages = [
    systemPrompt,
    ...history.slice(-10),
    { role: 'user', content: message }
  ];

  // Extract color filter from message
  const colorMatch = message.match(/\b(black|white|red|blue|green|pink|purple|gold|silver|nude|beige|brown|navy|burgundy|cream|ivory|emerald|teal|coral|yellow|orange)\b/i);
  const colorFilter = colorMatch ? colorMatch[1].toLowerCase() : null;

  try {
    let responseMessage;

    try {
      const openAIPromise = openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        tools,
        tool_choice: isProductQuery
          ? { type: 'function', function: { name: 'search_products' } }
          : 'auto'
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OpenAI timeout')), 8000)
      );

      const completion = await Promise.race([openAIPromise, timeoutPromise]);
      responseMessage = completion.choices[0].message;
      console.log('Using OpenAI');

    } catch (openAIError) {
      console.warn('OpenAI failed, switching to Gemini:', openAIError.message);
      try {
        const { chatWithGemini } = require('../services/gemini');
        responseMessage = await chatWithGemini(conversationMessages, tools);
        console.log('Using Gemini fallback');
      } catch (geminiError) {
        console.error('Gemini also failed:', geminiError.message);
        return res.status(503).json({
          error: 'AI service temporarily unavailable. Please try again.',
          products: [],
          cursor: null
        });
      }
    }

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      const result = await searchProducts(session.access_token, shop, args.query, {
        cursor: cursor || null,
        maxPrice: maxPrice || null,
        minPrice: minPrice || null,
        colorFilter
      });

      if (result === null) {
        return res.json({
          reply: 'Sorry, search is unavailable right now. Please try again.',
          products: [],
          cursor: null,
          searchQuery: args.query
        });
      }

      const formatted = result.products.map(formatProduct);

      await supabase.from('analytics_events').insert({
        shop,
        event_type: 'search',
        query: args.query
      });

      let reply = '';
      if (responseMessage.content) {
        reply = responseMessage.content;
      } else if (formatted.length > 0) {
        try {
          const fashionReply = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            max_tokens: 80,
            messages: [
              {
                role: 'system',
                content: 'You are a fashion stylist. Give a 2 sentence warm response about the products found. Include a brief styling tip. Be concise and enthusiastic.'
              },
              {
                role: 'user',
                content: `Customer searched for: "${args.query}". Found ${formatted.length} products including: ${formatted.slice(0, 3).map(p => p.title).join(', ')}. Write a short response.`
              }
            ]
          });
          reply = fashionReply.choices[0].message.content;
        } catch (e) {
          reply = `Found ${formatted.length} beautiful styles for you!`;
        }
      } else {
        reply = `Sorry, I couldn't find anything for "${args.query}". Try a different search.`;
      }

      const refineChips = formatted.length > 0 ? [
        'Show cheaper options',
        'Show in black',
        'Show something different',
        'What goes with these?'
      ] : [];

      res.json({
        reply,
        searchQuery: args.query,
        products: formatted,
        cursor: result.cursor,
        promptChips: config?.prompt_chips || [],
        refineChips
      });

    } else {
      await supabase.from('analytics_events').insert({
        shop,
        event_type: 'message',
        query: message
      });

      res.json({
        reply: responseMessage.content,
        products: [],
        cursor: null,
        promptChips: config?.prompt_chips || []
      });
    }

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Service unavailable' });
  }
});

module.exports = router;