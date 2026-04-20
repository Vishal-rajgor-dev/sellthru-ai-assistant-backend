require('dotenv').config();
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { registerScriptTag } = require('../services/scriptTag');

// Step 1 — Build OAuth URL manually
router.get('/auth', (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send('Missing shop parameter');
  }

  const scopes = process.env.SHOPIFY_SCOPES;
  const redirectUri = `${process.env.APP_URL}/auth/callback`;
  const nonce = Math.random().toString(36).substring(2, 15);

  // Store nonce in cookie for verification
  res.cookie('shopify_nonce', nonce, { httpOnly: true, sameSite: 'none', secure: true });

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${process.env.SHOPIFY_API_KEY}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

  res.redirect(authUrl);
});

// Step 2 — Handle callback manually
router.get('/auth/callback', async (req, res) => {
  try {
    const { shop, code, state, hmac } = req.query;

    if (!shop || !code) {
      return res.status(400).send('Missing required parameters');
    }

    // Verify HMAC
    const params = Object.keys(req.query)
      .filter(k => k !== 'hmac')
      .sort()
      .map(k => `${k}=${req.query[k]}`)
      .join('&');

    const digest = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(params)
      .digest('hex');

    if (digest !== hmac) {
      return res.status(400).send('HMAC validation failed');
    }

    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.status(500).send('Failed to get access token: ' + JSON.stringify(tokenData));
    }

    const accessToken = tokenData.access_token;
    const scope = tokenData.scope;

    console.log('Access token received for:', shop);
    console.log('Scopes granted:', scope);

    // Save session to Supabase
    const { error } = await supabase
      .from('sessions')
      .upsert({
        id: `offline_${shop}`,
        shop,
        access_token: accessToken,
        scope,
        is_online: false,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase save error:', error);
      return res.status(500).send('Failed to save session: ' + error.message);
    }

    console.log('Session saved for:', shop);

    // Register script tags
    const appUrl = process.env.APP_URL;
    await registerScriptTag(shop, accessToken, appUrl);
    // Auto-generate prompt chips from store products
try {
  const { getStoreContext } = require('../services/catalogMcp');
  const context = await getStoreContext(accessToken, shop);
  if (context) {
    const { generateSmartChips } = require('../index');
    // inline the function here since we can't import from index.js
    const types = context.types || [];
    const tags = context.tags || [];
    const chips = [];
    if (types.length > 0) chips.push(`Show me ${types[0]}`);
    if (types.length > 1) chips.push(`Browse ${types[1]}`);
    const usefulTags = tags.filter(t => !['sale','new','featured','home-page'].includes(t.toLowerCase()));
    if (usefulTags.length > 0) chips.push(`Show me ${usefulTags[0]}`);
    chips.push("What's new?");
    chips.push('Best sellers');
    chips.push('Under $100');
    const occasionTags = tags.filter(t => ['party','wedding','casual','formal','summer','winter','bridal','evening'].some(occ => t.toLowerCase().includes(occ)));
    if (occasionTags.length > 0) chips.push(`${occasionTags[0].charAt(0).toUpperCase()+occasionTags[0].slice(1)} styles`);
    const finalChips = [...new Set(chips)].slice(0, 6);
    await supabase.from('merchant_config').upsert({ shop, prompt_chips: finalChips });
    console.log('Auto-generated chips:', finalChips);
  }
} catch (e) {
  console.error('Chip generation error:', e.message);
}
    console.log('Script tags registered for:', shop);

    res.send(`
      <h2>App installed successfully!</h2>
      <p>Shop: ${shop}</p>
      <p>Scopes: ${scope}</p>
      <p>Session saved to database.</p>
    `);

  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).send('Auth failed: ' + err.message);
  }
});

module.exports = router;