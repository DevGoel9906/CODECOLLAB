/**
 * services/config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Centralized Environment Configuration
 *
 * PURPOSE:
 *   Single source of truth for all environment-specific settings.
 *   Eliminates hardcoded URLs across the entire frontend codebase.
 *
 * HOW IT WORKS:
 *   Auto-detects the runtime environment by inspecting window.location.hostname.
 *   Sets window.CodeCollabConfig — a frozen, immutable global object available
 *   to every script loaded after this file.
 *
 * LOAD ORDER (required):
 *   This script MUST be loaded BEFORE any other script that makes API calls.
 *   Add to every HTML page as the FIRST <script> tag in <body>:
 *     <script src="../services/config.js"></script>
 *
 * PRODUCTION SETUP:
 *   Set BACKEND_URL below to your deployed backend URL (Railway, Render, etc.)
 *   OR set it as a build-time replacement if you add a bundler later.
 *
 * SECURITY:
 *   - This file contains NO secrets, API keys, or credentials
 *   - Only public configuration (URLs, flags) is stored here
 *   - Safe to commit to version control
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── Environment Detection ─────────────────────────────────────────────────
  const hostname = global.location ? global.location.hostname : '';

  const isDev =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '' ||          // file:// protocol
    hostname.startsWith('192.168.') || // Local network dev
    hostname.endsWith('.local');       // mDNS local hostnames

  // ── API Base URLs ─────────────────────────────────────────────────────────
  // DEVELOPMENT: Express server running locally
  const DEV_API_BASE  = 'http://localhost:5000/api/v1';

  // PRODUCTION: Your deployed backend URL
  // ⬇ Replace this with your actual deployed backend URL before going live ⬇
  const PROD_API_BASE = 'https://your-backend-url.railway.app/api/v1';
  // Examples:
  //   Railway:  'https://codecollab-backend.up.railway.app/api/v1'
  //   Render:   'https://codecollab-api.onrender.com/api/v1'
  //   Vercel:   (not recommended for Express — use Railway/Render instead)

  // ── Config Object ─────────────────────────────────────────────────────────
  // Object.freeze() prevents any script from mutating the config at runtime
  global.CodeCollabConfig = Object.freeze({
    // The full API base URL — use this everywhere, never hardcode
    API_BASE: isDev ? DEV_API_BASE : PROD_API_BASE,

    // Current environment label (useful for conditional logic)
    ENV: isDev ? 'development' : 'production',

    // Feature flags
    IS_DEV: isDev,

    // Request timeout in milliseconds
    REQUEST_TIMEOUT_MS: 15000,

    // App metadata
    APP_NAME: 'CodeCollab',
    APP_VERSION: '2.0.0',
  });

  // Confirm config loaded (visible in DevTools in dev mode only)
  if (isDev) {
    console.info(
      `[CodeCollab] Config loaded | ENV: ${global.CodeCollabConfig.ENV} | API: ${global.CodeCollabConfig.API_BASE}`
    );
  }
})(window);
