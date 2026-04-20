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
            description: 'The search query e.g. "red dress under $50" or "gifts for women"'
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
  const { shop, message, cursor, maxPrice, minPrice } = req.body;

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

  // Auto-detect store context
  let storeContext = '';
  try {
    const context = await getStoreContext(session.access_token, shop);
    if (context) {
      storeContext = `
This store sells: ${context.types.join(', ') || 'various products'}
Example products: ${context.titles.join(', ')}
Common tags: ${context.tags.join(', ')}`;
    }
  } catch (e) {
    storeContext = '';
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant for a Shopify store.
${storeContext}

Your job is to help shoppers find products from THIS store only.
ALWAYS use the search_products tool when shoppers ask about products.

Rules:
- Map "best sellers" or "popular" → search "popular products"
- Map "new arrivals" or "what's new" → search "new arrivals"
- Map "under $X" or "below $X" → pass the price in the query
- Map "gifts" → search "gift ideas"
- For ANY product question → use search_products tool
- For greetings only (hi, hello) → respond warmly without searching
- Never mention products outside this store
- Never assume what the store sells — use the context above

Be friendly, helpful and concise.`
        },
        { role: 'user', content: message }
      ],
      tools,
      tool_choice: 'auto'
    });

    const responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

      const result = await searchProducts(session.access_token, shop, args.query, {
        cursor: cursor || null,
        maxPrice: maxPrice || null,
        minPrice: minPrice || null
      });

      if (result === null) {
        return res.json({
          reply: 'Sorry, search is unavailable right now. Please try again.',
          products: [],
          cursor: null
        });
      }

      const formatted = result.products.map(formatProduct);

      await supabase.from('analytics_events').insert({
        shop,
        event_type: 'search',
        query: args.query
      });

      const followUpChips = formatted.length > 0 ? [
        'Show cheaper options',
        'Sort by price: low to high',
        'Show more results',
        'Show something different'
      ] : [];

      res.json({
        reply: formatted.length > 0
          ? `Here are ${formatted.length} products I found for "${args.query}":`
          : `Sorry, I couldn't find anything for "${args.query}". Try a different search.`,
        searchQuery: args.query,
        products: formatted,
        cursor: result.cursor,
        promptChips: config?.prompt_chips || [],
        followUpChips
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