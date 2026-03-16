require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./src/config/database');
const errorHandler = require('./src/middlewares/errorHandler');
const logger = require('./src/middlewares/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Load all models (ensures they are registered before routes use them)
require('./src/models');

// Initialize recurring broadcasts cron job
const { initRecurringBroadcastsJob } = require('./src/jobs/recurringBroadcasts');
initRecurringBroadcastsJob();

// Load routes (after models are registered)
const routes = require('./src/routes');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
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

// View engine setup (if using server-side rendering)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Routes
app.use('/api', routes);

// Home route - Redirect to login
app.get('/', (req, res) => {
  res.redirect('/login.html');
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
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
