const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');
const { nodeAdapter } = require('@shopify/shopify-api/adapters/node');

const shopify = shopifyApi({
  adapter: nodeAdapter,
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.APP_URL.replace('https://', ''),
  apiVersion: ApiVersion.July25,
  isEmbeddedApp: false,
  future: {
    unstable_newEmbeddedAuthStrategy: false,
  }
});

module.exports = shopify;