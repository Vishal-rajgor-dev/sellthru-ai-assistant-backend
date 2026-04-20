const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const OpenAI = require('openai');
<<<<<<< HEAD
const { searchProducts, getStoreContext } = require('../services/catalogMcp');
=======
const { searchProducts } = require('../services/catalogMcp');
>>>>>>> fbd726a (Initial SellThru backend)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_products',
<<<<<<< HEAD
      description: 'Search the store products based on what the shopper is looking for',
=======
      description: 'Search Shopify store products based on what the shopper is looking for',
>>>>>>> fbd726a (Initial SellThru backend)
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
<<<<<<< HEAD
            description: 'The search query e.g. "red dress under $50" or "gifts for women"'
=======
            description: 'The search query e.g. "red shoes under $50" or "gifts for women"'
>>>>>>> fbd726a (Initial SellThru backend)
          }
        },
        required: ['query']
      }
    }
  }
];

<<<<<<< HEAD
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
=======
router.post('/api/chat', async (req, res) => {
  const { shop, message } = req.body;
>>>>>>> fbd726a (Initial SellThru backend)

  if (!shop || !message) {
    return res.status(400).json({ error: 'Missing shop or message' });
  }

<<<<<<< HEAD
=======
  // Load session
>>>>>>> fbd726a (Initial SellThru backend)
  const { data: session, error } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', shop)
    .single();

  if (error || !session) {
    return res.status(401).json({ error: 'Shop not installed' });
  }

<<<<<<< HEAD
=======
  // Load merchant config (prompt chips, greeting etc)
>>>>>>> fbd726a (Initial SellThru backend)
  const { data: config } = await supabase
    .from('merchant_config')
    .select('*')
    .eq('shop', shop)
    .single();

<<<<<<< HEAD
=======
  // Insert default config if first visit
>>>>>>> fbd726a (Initial SellThru backend)
  if (!config) {
    await supabase.from('merchant_config').insert({ shop });
  }

<<<<<<< HEAD
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

=======
>>>>>>> fbd726a (Initial SellThru backend)
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful shopping assistant for a Shopify store.
<<<<<<< HEAD
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
=======
When a shopper asks about products, always use the search_products tool to find relevant items.
Be friendly, concise, and helpful.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools: tools,
>>>>>>> fbd726a (Initial SellThru backend)
      tool_choice: 'auto'
    });

    const responseMessage = completion.choices[0].message;

    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0];
      const args = JSON.parse(toolCall.function.arguments);

<<<<<<< HEAD
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

=======
      console.log('Searching products for:', args.query);

      // Call Shopify Catalog MCP
      let products = await searchProducts(session.access_token, shop, args.query);

      if (products === null) {
        console.log('MCP failed — returning empty results');
        products = [];
      }

      // Log analytics event
>>>>>>> fbd726a (Initial SellThru backend)
      await supabase.from('analytics_events').insert({
        shop,
        event_type: 'search',
        query: args.query
      });

<<<<<<< HEAD
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
=======
      // Format price from minor units (69995 → $699.95)
      const formatted = products.map(p => ({
        id: p.id,
        title: p.title,
        price: p.price_range?.min
          ? `$${(p.price_range.min.amount / 100).toFixed(2)}`
          : null,
        image: p.media?.[0]?.url || null,
        variantId: p.variants?.[0]?.id || null,
        available: p.variants?.[0]?.availability?.available ?? true
      }));

      res.json({
        reply: formatted.length > 0
          ? `Here are some products I found for "${args.query}":`
          : `Sorry, I couldn't find anything for "${args.query}". Try a different search.`,
        searchQuery: args.query,
        products: formatted,
        promptChips: config?.prompt_chips || []
      });

    } else {
      // Log non-search interaction
>>>>>>> fbd726a (Initial SellThru backend)
      await supabase.from('analytics_events').insert({
        shop,
        event_type: 'message',
        query: message
      });

      res.json({
        reply: responseMessage.content,
        products: [],
<<<<<<< HEAD
        cursor: null,
=======
>>>>>>> fbd726a (Initial SellThru backend)
        promptChips: config?.prompt_chips || []
      });
    }

  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Service unavailable' });
  }
});

module.exports = router;