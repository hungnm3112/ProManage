require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Log startup timestamp
const startupTime = new Date();
console.log(`
╔════════════════════════════════════════════════════════════╗
║          📋 ProManage Server Initialization Started        ║
╠════════════════════════════════════════════════════════════╣
║ ⏰ Init Time: ${startupTime.toLocaleString('vi-VN', { 
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})}
║ 📦 Node Version: ${process.version}
║ 🌍 Environment: ${(process.env.NODE_ENV || 'development').toUpperCase()}
╚════════════════════════════════════════════════════════════╝
`);

const connectDB = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');
const logger = require('./src/middlewares/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
console.log('[Server Startup] Connecting to database...');
connectDB();

// Load all models (ensures they are registered before routes use them)
require('./src/models');
console.log('[Server Startup] ✓ Models loaded');

// Initialize recurring broadcasts cron job
console.log('[Server Startup] Initializing recurring broadcasts cron job...');
const { initRecurringBroadcastsJob } = require('./src/jobs/recurringBroadcasts');
initRecurringBroadcastsJob();
console.log('[Server Startup] ✓ Cron job initialized');

// Load routes (after models are registered)
const routes = require('./src/routes');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
})); // Security headers with CSP config
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(morgan('combined', { stream: logger.stream })); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine setup (EJS templates)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views/pages')); // Point directly to pages folder

// Routes
app.use('/api', routes);

// HTML page routes - Render EJS templates
app.get('/', (req, res) => {
  res.render('login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard');
});

app.get('/manager/dashboard', (req, res) => {
  res.render('manager/dashboard');
});

app.get('/employee/dashboard', (req, res) => {
  res.render('employee/dashboard');
});

app.get('/user-guide', (req, res) => {
  res.render('user-guide');
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProManage API is running',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  const startTime = new Date();
  const timestamp = startTime.toLocaleString('vi-VN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🚀 ProManage Server Started Successfully          ║
╠════════════════════════════════════════════════════════════╣
║ 📍 Port:        ${PORT}
║ 🌍 Environment: ${(process.env.NODE_ENV || 'development').toUpperCase()}
║ ⏰ Time:        ${timestamp}
║ 🔗 URL:         http://localhost:${PORT}
║ 💾 Database:    ${process.env.MONGODB_URI ? '✓ Connected' : '✗ Not connected'}
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
