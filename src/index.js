require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const cartRoutes = require('./routes/cart');
const { listTools } = require('./services/catalogMcp');
const supabase = require('./config/supabase');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/', authRoutes);
app.use('/', chatRoutes);                      
app.use('/', cartRoutes);
app.use('/widget', express.static(path.join(__dirname, 'widget')));
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SellThru backend is running' });
});


app.get('/widget/config.js', (req, res) => {
  const shop = req.query.shop;
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    window.sellthruConfig = {
      shop: '${shop}',
      apiUrl: '${process.env.APP_URL}',
      greeting: 'Hi! How can I help you find something today?',
      promptChips: ["What's new?", "Best sellers", "Gifts under $50"]
    };
  `);
});
app.get('/test-mcp', async (req, res) => {
  const { data: session } = await supabase
    .from('sessions')
    .select('access_token')
    .eq('shop', 'sellthru-ai-assistance.myshopify.com')
    .single();

  const tools = await listTools(session.access_token, 'sellthru-ai-assistance.myshopify.com');
  res.json(tools);
});
app.get('/check-token', async (req, res) => {
  const { data } = await supabase
    .from('sessions')
    .select('access_token, shop')
    .eq('shop', 'sellthru-ai-assistance.myshopify.com')
    .single();
  res.json({ token: data?.access_token });
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});