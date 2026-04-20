require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const supabase = require('./config/supabase');

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/', authRoutes);
app.use('/', chatRoutes);
app.use('/', cartRoutes);
app.use('/widget', express.static(path.join(__dirname, 'widget')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SellThru backend is running' });
});

app.get('/api/widget/config', async (req, res) => {
  const shop = req.query.shop;
  if (!shop) return res.json({ enabled: false });

  const { data } = await supabase
    .from('merchant_config')
    .select('*')
    .eq('shop', shop)
    .single();

  // If merchant has custom chips saved, use those
  if (data?.prompt_chips && data.prompt_chips.length > 0) {
    return res.json({
      enabled: data?.widget_enabled ?? true,
      position: data?.widget_position || 'bottom-right',
      color: data?.primary_color || '#000000',
      greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
      promptChips: data.prompt_chips
    });
  }

  // Otherwise auto-generate chips from store products
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (session?.access_token) {
      const { getStoreContext } = require('./services/catalogMcp');
      const context = await getStoreContext(session.access_token, shop);

      if (context) {
        const chips = generateSmartChips(context);

        // Save generated chips so we don't regenerate every time
        await supabase
          .from('merchant_config')
          .upsert({ shop, prompt_chips: chips, updated_at: new Date().toISOString() });

        return res.json({
          enabled: data?.widget_enabled ?? true,
          position: data?.widget_position || 'bottom-right',
          color: data?.primary_color || '#000000',
          greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
          promptChips: chips
        });
      }
    }
  } catch (e) {
    console.error('Auto chip generation error:', e.message);
  }

  // Final fallback
  res.json({
    enabled: data?.widget_enabled ?? true,
    position: data?.widget_position || 'bottom-right',
    color: data?.primary_color || '#000000',
    greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
    promptChips: ["What's new?", 'Best sellers', 'Gifts', 'Under $50']
  });
});

function generateSmartChips(context) {
  const chips = [];
  const types = context.types || [];
  const tags = context.tags || [];
  const titles = context.titles || [];

  // Add product type chips
  if (types.length > 0) {
    chips.push(`Show me ${types[0]}`);
    if (types.length > 1) chips.push(`Browse ${types[1]}`);
  }

  // Add tag-based chips
  const usefulTags = tags.filter(t =>
    !['sale', 'new', 'featured', 'home-page'].includes(t.toLowerCase())
  );
  if (usefulTags.length > 0) chips.push(`Show me ${usefulTags[0]}`);

  // Always add universal chips
  chips.push("What's new?");
  chips.push('Best sellers');

  // Add price chip based on product prices in titles
  const hasPriceInRange = titles.some(t => t.toLowerCase().includes('$'));
  chips.push('Under $100');

  // Add occasion chip from tags
  const occasionTags = tags.filter(t =>
    ['party', 'wedding', 'casual', 'formal', 'summer', 'winter', 'bridal', 'evening'].some(
      occ => t.toLowerCase().includes(occ)
    )
  );
  if (occasionTags.length > 0) {
    chips.push(`${occasionTags[0].charAt(0).toUpperCase() + occasionTags[0].slice(1)} styles`);
  }

  // Deduplicate and limit to 6
  return [...new Set(chips)].slice(0, 6);
}
app.post('/api/refresh-chips', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ error: 'Missing shop' });

  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('access_token')
      .eq('shop', shop)
      .single();

    if (!session) return res.status(401).json({ error: 'Not installed' });

    const { getStoreContext } = require('./services/catalogMcp');
    const context = await getStoreContext(session.access_token, shop);
    const chips = generateSmartChips(context);

    await supabase
      .from('merchant_config')
      .upsert({ shop, prompt_chips: chips, updated_at: new Date().toISOString() });

    res.json({ chips });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.get('/debug-context', async (req, res) => {
  const shop = req.query.shop || 'sellthru-ai-assistance.myshopify.com';
  const { data: session } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', shop)
    .single();

  if (!session) return res.json({ error: 'No session' });

  const { getStoreContext } = require('./services/catalogMcp');
  const context = await getStoreContext(session.access_token, shop);
  res.json(context);
});
app.get('/widget/config.js', (req, res) => {
  const shop = req.query.shop;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.sellthruShop="${shop}";window.sellthruApiUrl="${process.env.APP_URL}";`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});