/**
 * SellThru AI Assistant — Chat Route v2.0
 * POST /api/chat
 *
 * Returns: { message, products: [...all matched...], chips }
 * Widget handles client-side pagination (PAGE_SIZE = 8).
 */

const express  = require('express');
const router   = express.Router();
const OpenAI   = require('openai');
const { GeminiService } = require('../services/gemini');
const { CatalogMcpClient } = require('../services/catalogMcp');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─────────────────────────────────────────────
// SYSTEM PROMPT BUILDER
// ─────────────────────────────────────────────
function buildSystemPrompt(storeContext, sizes) {
  const sizeClause = sizes && sizes.length > 0
    ? `The customer has pre-filtered for sizes: ${sizes.join(', ')}. ONLY recommend products available in these sizes when possible.`
    : '';

  return `You are an expert AI shopping assistant for ${storeContext.name || 'this online store'}.
${storeContext.description ? `Store: ${storeContext.description}` : ''}

Your role:
- Help customers find products they'll love with warm, knowledgeable advice
- Ask clarifying questions when helpful (occasion, budget, style preference)
- Reference specific product names and features from the catalog
- Be concise — 2-4 sentences max per response unless detail is genuinely needed
- Never make up products; only reference what's in the catalog
- Universal tone: works for fashion, electronics, home goods, beauty, or any store type

${sizeClause}

Respond naturally. Do not use markdown headers or bullet lists. Flowing conversational prose only.
After finding products, briefly describe what makes them a good fit, then let the product cards do the visual work.`;
}

// ─────────────────────────────────────────────
// CHIP GENERATION from query + products
// ─────────────────────────────────────────────
function generateChips(userQuery, products, history) {
  const chips = new Set();

  // Extract colors from products for follow-up suggestions
  const colors = new Set();
  const types  = new Set();

  products.slice(0, 12).forEach(function (p) {
    if (p.product_type) types.add(p.product_type);
    (p.options || []).forEach(function (opt) {
      if (/colou?r/i.test(opt.name)) {
        (opt.values || []).slice(0, 3).forEach(function (v) { colors.add(v); });
      }
    });
  });

  // Generate contextual follow-up chips
  const queryLower = userQuery.toLowerCase();

  if (products.length > 0) {
    // Budget refinement
    chips.add('Under £50');
    chips.add('Best sellers');

    // Color variations (from actual results)
    if (colors.size > 0) {
      const colorArr = [...colors].slice(0, 2);
      colorArr.forEach(function (c) { chips.add(c + ' ' + (userQuery.split(' ').slice(0, 3).join(' '))); });
    }

    // Category variations
    if (types.size > 0) {
      const typeArr = [...types].slice(0, 1);
      typeArr.forEach(function (t) { chips.add('More ' + t); });
    }
  }

  // Generic helpful chips if nothing specific
  if (chips.size < 3) {
    chips.add('New arrivals');
    chips.add('Best sellers');
    chips.add('Show all');
  }

  return [...chips].slice(0, 6);
}

// ─────────────────────────────────────────────
// OPENAI CALL with 8s timeout
// ─────────────────────────────────────────────
async function callOpenAI(systemPrompt, history, userMessage, productContext) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(function (h) { return { role: h.role, content: h.content }; }),
    {
      role: 'user',
      content: productContext
        ? userMessage + '\n\n[Available products in catalog for this query:\n' + productContext + ']'
        : userMessage,
    },
  ];

  const controller = new AbortController();
  const timeout    = setTimeout(function () { controller.abort(); }, 8000);

  try {
    const response = await openai.chat.completions.create(
      {
        model:       'gpt-4o-mini',
        messages:    messages,
        max_tokens:  400,
        temperature: 0.7,
      },
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    return response.choices[0].message.content;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─────────────────────────────────────────────
// GEMINI FALLBACK
// ─────────────────────────────────────────────
async function callGeminiFallback(systemPrompt, history, userMessage, productContext) {
  const gemini   = new GeminiService();
  const combined = [
    systemPrompt,
    ...history.map(function (h) { return h.role.toUpperCase() + ': ' + h.content; }),
    'USER: ' + userMessage,
    productContext ? '\n[Products: ' + productContext + ']' : '',
  ].join('\n\n');

  return await gemini.generateResponse(combined);
}

// ─────────────────────────────────────────────
// FORMAT PRODUCT CONTEXT STRING for AI prompt
// ─────────────────────────────────────────────
function formatProductContext(products) {
  if (!products || products.length === 0) return null;
  return products.slice(0, 15).map(function (p, i) {
    const price = p.variants && p.variants[0] ? p.variants[0].price : (p.price_min || '');
    const sizes = (p.options || [])
      .filter(function (o) { return /^size$/i.test(o.name); })
      .map(function (o) { return (o.values || []).join(', '); })
      .join('');
    const tags = Array.isArray(p.tags)
      ? p.tags.slice(0, 5).join(', ')
      : (typeof p.tags === 'string' ? p.tags.split(',').slice(0, 5).join(', ') : '');

    return (i + 1) + '. ' + p.title +
      (price ? ' — ' + price : '') +
      (p.product_type ? ' | Type: ' + p.product_type : '') +
      (sizes ? ' | Sizes: ' + sizes : '') +
      (tags ? ' | Tags: ' + tags : '');
  }).join('\n');
}

// ─────────────────────────────────────────────
// MAIN ROUTE: POST /api/chat
// ─────────────────────────────────────────────
router.post('/', async function (req, res) {
  try {
    const {
      message,
      sessionId,
      history    = [],
      sizes      = [],
      shop,
    } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const shopDomain = shop || req.headers['x-shop-domain'] || 'unknown';

    // ── 1. Fetch products from Shopify Catalog MCP ──
    let products = [];
    try {
      const catalog = new CatalogMcpClient(shopDomain);
      products = await catalog.searchProducts(message, {
        sizes:  sizes,
        limit:  40, // Return all matches; widget paginates to 8
      });
    } catch (catalogErr) {
      console.error('[SellThru] Catalog MCP error:', catalogErr.message);
      // Continue without products — AI will give a helpful response
    }

    // ── 2. Get store context ──
    let storeContext = { name: shopDomain };
    try {
      const catalog = new CatalogMcpClient(shopDomain);
      storeContext  = await catalog.getStoreInfo() || storeContext;
    } catch (_) {}

    // ── 3. Build system prompt ──
    const systemPrompt   = buildSystemPrompt(storeContext, sizes);
    const productContext = formatProductContext(products);

    // ── 4. Call AI (OpenAI → Gemini fallback) ──
    let aiMessage;
    try {
      aiMessage = await callOpenAI(systemPrompt, history, message, productContext);
    } catch (openAiErr) {
      const isTimeout = openAiErr.name === 'AbortError' || openAiErr.code === 'ECONNABORTED';
      console.warn('[SellThru] OpenAI', isTimeout ? 'timeout' : 'error', '— falling back to Gemini');
      try {
        aiMessage = await callGeminiFallback(systemPrompt, history, message, productContext);
      } catch (geminiErr) {
        console.error('[SellThru] Gemini fallback error:', geminiErr.message);
        aiMessage = products.length > 0
          ? 'I found some great options for you — take a look below!'
          : "I'm having a moment — please try again shortly.";
      }
    }

    // ── 5. Generate follow-up chips ──
    const chips = generateChips(message, products, history);

    // ── 6. Return full product objects (widget paginates) ──
    return res.json({
      message:  aiMessage,
      products: products,   // full array — widget shows 8, "Show N More" for rest
      chips:    chips,
      meta: {
        shop:          shopDomain,
        sessionId:     sessionId,
        productCount:  products.length,
        model:         'gpt-4o-mini',
      },
    });

  } catch (err) {
    console.error('[SellThru] /api/chat unhandled error:', err);
    return res.status(500).json({
      error:    'Internal server error',
      message:  "Something went wrong. Please try again.",
      products: [],
      chips:    [],
    });
  }
});

module.exports = router;