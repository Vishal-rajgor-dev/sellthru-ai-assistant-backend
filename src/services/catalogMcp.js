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

<<<<<<< HEAD
async function searchProducts(accessToken, shop, query, options = {}) {
=======
async function searchProducts(accessToken, shop, query) {
>>>>>>> fbd726a (Initial SellThru backend)
  const { client, transport } = createClient(accessToken, shop);

  try {
    await client.connect(transport);

<<<<<<< HEAD
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

    if (options.cursor) {
      catalogArgs.pagination.cursor = options.cursor;
    }

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
=======
    const result = await client.callTool({
      name: 'search_catalog',
      arguments: {
        catalog: {
          query: query,
          pagination: { limit: 6 }
        }
      }
>>>>>>> fbd726a (Initial SellThru backend)
    });

    await client.close();

    const content = result.content?.[0]?.text;
<<<<<<< HEAD
    if (!content) return { products: [], cursor: null };

    const parsed = JSON.parse(content);
    const products = parsed.catalog?.items || parsed.items || parsed.products || parsed || [];
    const cursor = parsed.catalog?.pagination?.cursor || parsed.pagination?.cursor || null;

    console.log('Products found:', products.length, '| cursor:', cursor ? 'yes' : 'no');
    return { products, cursor };
=======
    if (!content) return [];

    const parsed = JSON.parse(content);

    // Extract products array from UCP response
    const products = parsed.catalog?.items || parsed.items || parsed.products || parsed || [];
    return products;
>>>>>>> fbd726a (Initial SellThru backend)

  } catch (err) {
    console.error('Catalog MCP error:', err.message);
    return null;
  }
}

<<<<<<< HEAD
async function getStoreContext(accessToken, shop) {
=======
async function updateCart(accessToken, shop, cartId, variantId, quantity = 1) {
>>>>>>> fbd726a (Initial SellThru backend)
  const { client, transport } = createClient(accessToken, shop);

  try {
    await client.connect(transport);

<<<<<<< HEAD
    const result = await client.callTool({
      name: 'search_catalog',
      arguments: { catalog: { query: '', pagination: { limit: 10 } } }
=======
    const args = cartId
      ? { cart_id: cartId, add_items: [{ product_variant_id: variantId, quantity }] }
      : { add_items: [{ product_variant_id: variantId, quantity }] };

    const result = await client.callTool({
      name: 'update_cart',
      arguments: args
>>>>>>> fbd726a (Initial SellThru backend)
    });

    await client.close();

    const content = result.content?.[0]?.text;
<<<<<<< HEAD
    if (!content) return null;

    const parsed = JSON.parse(content);
    const products = parsed.catalog?.items || parsed.items || [];

    const types = [...new Set(products.map(p => p.product_type).filter(Boolean))];
    const titles = products.slice(0, 5).map(p => p.title);
    const tags = [...new Set(products.flatMap(p => p.tags || []))].slice(0, 10);

    return { types, titles, tags };
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
=======
    return content ? JSON.parse(content) : null;

>>>>>>> fbd726a (Initial SellThru backend)
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

<<<<<<< HEAD
module.exports = { searchProducts, getStoreContext, updateCart, listTools };
=======
module.exports = { searchProducts, updateCart, listTools };
>>>>>>> fbd726a (Initial SellThru backend)
