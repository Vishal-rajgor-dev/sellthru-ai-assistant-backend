const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

function createClient(accessToken, shop) {
  const client = new Client({ name: 'sellthru', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL(`https://${shop}/api/mcp`),
    {
      requestInit: {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Shopify-Shop-Domain': shop
        }
      }
    }
  );
  return { client, transport };
}

async function searchProducts(accessToken, shop, query, options = {}) {
  const { client, transport } = createClient(accessToken, shop);

  try {
    await client.connect(transport);

    const priceMatch = query.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less\s*than\s*\$?(\d+)/i);
    const maxPrice = priceMatch
      ? parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]) * 100
      : null;

    const cleanQuery = query
      .replace(/under\s*\$?\d+/i, '')
      .replace(/below\s*\$?\d+/i, '')
      .replace(/less\s*than\s*\$?\d+/i, '')
      .trim();

    const catalogArgs = {
      query: cleanQuery || query,
      pagination: { limit: options.limit || 6 }
    };

    if (options.cursor) catalogArgs.pagination.cursor = options.cursor;

    if (maxPrice || options.maxPrice) {
      catalogArgs.filters = { price: { max: options.maxPrice || maxPrice } };
    }

    if (options.minPrice) {
      catalogArgs.filters = catalogArgs.filters || {};
      catalogArgs.filters.price = catalogArgs.filters.price || {};
      catalogArgs.filters.price.min = options.minPrice;
    }

    console.log('MCP search:', cleanQuery || query, '| maxPrice:', maxPrice);

    const result = await client.callTool({
      name: 'search_catalog',
      arguments: { catalog: catalogArgs }
    });

    await client.close();

    const content = result.content?.[0]?.text;
    if (!content) return { products: [], cursor: null };

    const parsed = JSON.parse(content);
    const products = parsed.catalog?.items || parsed.items || parsed.products || parsed || [];
    const cursor = parsed.catalog?.pagination?.cursor || parsed.pagination?.cursor || null;

    console.log('Products found:', products.length);
    return { products, cursor };

  } catch (err) {
    console.error('Catalog MCP error:', err.message);
    return null;
  }
}

async function getStoreContext(accessToken, shop) {
  const { client, transport } = createClient(accessToken, shop);

  try {
    await client.connect(transport);

    // Use broad queries to get a sample of products
    const result = await client.callTool({
      name: 'search_catalog',
      arguments: {
        catalog: {
          query: 'product',
          pagination: { limit: 20 }
        }
      }
    });

    await client.close();

    const content = result.content?.[0]?.text;
    if (!content) return null;

    const parsed = JSON.parse(content);
    const products = parsed.catalog?.items || parsed.items || [];

    if (!products.length) return null;

    // Extract unique product types
    const types = [...new Set(
      products.map(p => p.product_type || p.productType).filter(Boolean)
    )];

    // Extract titles
    const titles = products.slice(0, 8).map(p => p.title).filter(Boolean);

    // Extract all tags
    const tags = [...new Set(
      products.flatMap(p => p.tags || []).filter(Boolean)
    )].slice(0, 20);

    // Extract price ranges
    const prices = products
      .map(p => p.price_range?.min?.amount)
      .filter(Boolean)
      .map(p => Math.round(p / 100));

    const minPrice = prices.length ? Math.min(...prices) : null;
    const maxPrice = prices.length ? Math.max(...prices) : null;

    console.log('Store context:', { types, titles: titles.length, tags: tags.slice(0,5), minPrice, maxPrice });

    return { types, titles, tags, minPrice, maxPrice };

  } catch (err) {
    console.error('Store context error:', err.message);
    return null;
  }
}

async function updateCart(accessToken, shop, cartId, variantId, quantity = 1) {
  const { client, transport } = createClient(accessToken, shop);
  try {
    await client.connect(transport);
    const args = cartId
      ? { cart_id: cartId, add_items: [{ product_variant_id: variantId, quantity }] }
      : { add_items: [{ product_variant_id: variantId, quantity }] };
    const result = await client.callTool({ name: 'update_cart', arguments: args });
    await client.close();
    const content = result.content?.[0]?.text;
    return content ? JSON.parse(content) : null;
  } catch (err) {
    console.error('Cart MCP error:', err.message);
    return null;
  }
}

async function listTools(accessToken, shop) {
  const { client, transport } = createClient(accessToken, shop);
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    await client.close();
    return tools;
  } catch (err) {
    console.error('List tools error:', err.message);
    return null;
  }
}

module.exports = { searchProducts, getStoreContext, updateCart, listTools };