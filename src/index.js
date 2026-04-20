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

  if (data?.prompt_chips && data.prompt_chips.length > 0) {
    return res.json({
      enabled: data?.widget_enabled ?? true,
      position: data?.widget_position || 'bottom-right',
      color: data?.primary_color || '#000000',
      greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
      promptChips: data.prompt_chips
    });
  }

  generateAndSaveChips(shop).catch(e => console.error('Chip gen error:', e.message));

  res.json({
    enabled: data?.widget_enabled ?? true,
    position: data?.widget_position || 'bottom-right',
    color: data?.primary_color || '#000000',
    greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
    promptChips: ["What's new?", 'Best sellers', 'Party dresses', 'Bridesmaid dresses', 'Under $100', 'Wedding guest']
  });
});

async function generateAndSaveChips(shop) {
  const { data: session } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', shop)
    .single();

  if (!session?.access_token) return;

  const { searchProducts } = require('./services/catalogMcp');

  const queries = ['dress', 'bridesmaid', 'party', 'maxi', 'wedding guest'];
  let allTags = [];
  let allTitles = [];
  let prices = [];

  for (const q of queries) {
    try {
      const result = await searchProducts(session.access_token, shop, q, { limit: 5 });
      if (result?.products?.length) {
        result.products.forEach(p => {
          allTags.push(...(p.tags || []));
          allTitles.push(p.title);
          const price = p.price_range?.min?.amount;
          if (price) prices.push(Math.round(price / 100));
        });
      }
    } catch (e) { continue; }
  }

  if (!allTitles.length) return;

  const chips = generateSmartChips({ tags: allTags, titles: allTitles, prices });
  console.log('Generated chips:', chips);

  await supabase
    .from('merchant_config')
    .upsert({ shop, prompt_chips: chips, updated_at: new Date().toISOString() });
}

function generateSmartChips({ tags = [], titles = [], prices = [] }) {
  const chips = new Set();

  const skipPrefixes = ['colour_', 'color_', 'price_', 'length_', 'sleeve_', 'size'];
  const usefulTags = [...new Set(tags)]
    .filter(t => !skipPrefixes.some(p => t.toLowerCase().startsWith(p)))
    .filter(t => t.length > 3 && t.length < 25)
    .filter(t => !['all products', 'new', 'new in', 'new collection', 'faire4', 'sale',
      'high inventory', 'back in stock', 'all sale lb', 'non trad bride'].includes(t.toLowerCase()));

  const occasionTags = usefulTags.filter(t =>
    ['party', 'wedding', 'bridesmaid', 'prom', 'bridal', 'hen', 'occasion',
      'evening', 'gown', 'maxi', 'midi', 'mini', 'sequin', 'birthday'].some(
      k => t.toLowerCase().includes(k)
    )
  );

  occasionTags.slice(0, 3).forEach(t => {
    chips.add(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  });

  chips.add("What's new?");
  chips.add('Best sellers');

  if (prices.length) {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    if (mid <= 50) chips.add('Under $50');
    else if (mid <= 100) chips.add('Under $100');
    else chips.add('Under $150');
  }

  const remaining = usefulTags.filter(t => !occasionTags.includes(t));
  remaining.slice(0, 2).forEach(t => {
    chips.add(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
  });

  return [...chips].slice(0, 6);
}

app.post('/api/refresh-chips', async (req, res) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ error: 'Missing shop' });
  try {
    await supabase.from('merchant_config').update({ prompt_chips: null }).eq('shop', shop);
    await generateAndSaveChips(shop);
    const { data } = await supabase.from('merchant_config').select('prompt_chips').eq('shop', shop).single();
    res.json({ chips: data?.prompt_chips || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/widget/config.js', (req, res) => {
  const shop = req.query.shop;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.sellthruShop="${shop}";window.sellthruApiUrl="${process.env.APP_URL}";`);
});

app.get('/debug-context', async (req, res) => {
  const shop = req.query.shop || 'sellthru-ai-assistance.myshopify.com';
  const { data: session } = await supabase.from('sessions').select('access_token').eq('shop', shop).single();
  if (!session) return res.json({ error: 'No session' });
  const { searchProducts } = require('./services/catalogMcp');
  const result = await searchProducts(session.access_token, shop, 'dress', { limit: 3 });
  res.json({ products: result?.products?.length, sample: result?.products?.[0]?.tags?.slice(0, 5) });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});