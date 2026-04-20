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
    .select('widget_enabled, widget_position, primary_color, widget_greeting, prompt_chips')
    .eq('shop', shop)
    .single();

  res.json({
    enabled: data?.widget_enabled ?? true,
    position: data?.widget_position || 'bottom-right',
    color: data?.primary_color || '#000000',
    greeting: data?.widget_greeting || 'Hi! How can I help you find something today?',
    promptChips: data?.prompt_chips || ['What\'s new?', 'Best sellers', 'Under $100', 'Gifts']
  });
});

app.get('/widget/config.js', (req, res) => {
  const shop = req.query.shop;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`window.sellthruShop="${shop}";window.sellthruApiUrl="${process.env.APP_URL}";`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});