/**
 * server.js — CODECOLLAB Backend Entry Point
 *
 * Security Architecture:
 * ┌─────────────────────────────────────────────────────────┐
 * │  Request → helmet → cors → morgan → body-parser         │
 * │          → generalLimiter → sanitizer (per-route)       │
 * │          → requestVerifier (per-route)                  │
 * │          → ownershipVerifier (mutating routes)          │
 * │          → validation (per-route)                       │
 * │          → controller → service → MongoDB               │
 * │          → errorHandler (global, last middleware)       │
 * └─────────────────────────────────────────────────────────┘
 *
 * Environment secrets are validated at startup — server will not
 * start if any required variable is missing.
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const connectDB  = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// ── Environment Validation ────────────────────────────────────────────────────
// Fail fast: never start with missing secrets
const REQUIRED_ENV = ['PORT', 'MONGODB_URI', 'JWT_SECRET'];
const missingEnv   = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`❌ Startup Error: Missing required environment variables: ${missingEnv.join(', ')}`);
  console.error('   Create a .env file from .env.example and set all required values.');
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT;

// ── CORS Configuration ────────────────────────────────────────────────────────
// Only explicitly allowed origins can make cross-origin requests.
// In development: localhost (file:// and http://localhost variations).
// In production: set ALLOWED_ORIGINS in your hosting environment.

const rawOrigins = process.env.ALLOWED_ORIGINS || '';
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

// Development fallback origins (never used in production)
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  null, // allows file:// origin in dev (Chrome sends null for file:// requests)
];

const corsOptions = {
  origin: (origin, callback) => {
    const isDev = process.env.NODE_ENV !== 'production';

    // Allow server-to-server (no origin header) — e.g. Postman, internal calls
    if (!origin) return callback(null, true);

    // Check configured production/staging origins first
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // In development, also permit local dev server origins
    if (isDev && DEV_ORIGINS.includes(origin)) return callback(null, true);

    // Block everything else
    console.warn(`[CORS] Blocked request from unlisted origin: ${origin}`);
    callback(new Error('Not allowed by CORS policy.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

// ── Core Middleware ───────────────────────────────────────────────────────────

app.use(helmet({
  // Prevent MIME-type sniffing
  noSniff: true,
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Force HTTPS in production
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  // Remove X-Powered-By: Express header (don't advertise stack)
  hidePoweredBy: true,
}));

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Handle preflight OPTIONS requests

// HTTP request logger — use 'combined' in production for more detail
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parser — hard limit prevents payload flooding attacks
// This limit is enforced before any route handler runs
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Global Rate Limiter ───────────────────────────────────────────────────────
// Fallback for any /api route not covered by a more specific limiter
app.use('/api', generalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
// Does NOT expose internal config or DB connection string
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.status(200).json({
    status: 'healthy',
    database: stateMap[dbState] || 'unknown',
    server: 'running',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth',             require('./routes/v1/auth'));
app.use('/api/v1/users',           require('./routes/v1/users'));
app.use('/api/v1/projects',        require('./routes/v1/projects'));
app.use('/api/v1/maintainers',     require('./routes/v1/maintainers'));
app.use('/api/v1/meeting-requests', require('./routes/v1/meetingRequests'));


// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

// ── Global Error Handler (MUST be last middleware) ────────────────────────────
app.use(errorHandler);

// ── Unhandled Rejection & Exception Guards ────────────────────────────────────
// Catch async errors that escape the middleware chain.
// Log internally, do NOT expose details, shut down gracefully.

process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION]', reason instanceof Error ? reason.message : reason);
  // Give in-flight requests 5 s to finish before exiting
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err.message);
  process.exit(1);
});

// ── Start Server ──────────────────────────────────────────────────────────────
let server;

connectDB()
  .then(() => {
    console.log('✓ Environment loaded');
    server = app.listen(PORT, () => {
      console.log('✓ Routes registered');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch(() => {
    console.error('❌ Failed to start — database connection error');
    process.exit(1);
  });

module.exports = app; // For testing
