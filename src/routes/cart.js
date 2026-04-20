const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { updateCart } = require('../services/catalogMcp');

router.post('/api/cart/add', async (req, res) => {
  const { shop, variantId, cartId, quantity = 1 } = req.body;

  if (!shop || !variantId) {
    return res.status(400).json({ error: 'Missing shop or variantId' });
  }

  // Load session
  const { data: session, error } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', shop)
    .single();

  if (error || !session) {
    return res.status(401).json({ error: 'Shop not installed' });
  }

  try {
    const result = await updateCart(
      session.access_token,
      shop,
      cartId || null,
      variantId,
      quantity
    );

    if (!result) {
      return res.status(500).json({ error: 'Failed to update cart' });
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      shop,
      event_type: 'add_to_cart',
      product_id: variantId
    });

    res.json({
      success: true,
      cartId: result.cart?.id || result.id,
      checkoutUrl: result.cart?.checkoutUrl || result.checkoutUrl,
      totalItems: result.cart?.totalQuantity || 1
    });

  } catch (err) {
    console.error('Cart error:', err.message);
    res.status(500).json({ error: 'Cart service unavailable' });
  }
});

module.exports = router;