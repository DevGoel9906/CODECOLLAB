/**
 * services/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Legacy API Wrapper (DEPRECATED)
 *
 * NOTE: This file is kept strictly for backward compatibility with older
 * code that imports `apiService` from `api.js`.
 * 
 * It delegates completely to the new centralized `apiClient`.
 * New code should use `window.apiClient` directly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // Ensure new apiClient exists
  if (!global.apiClient) {
    console.warn('[Legacy API] WARNING: apiClient not found. Please load config.js, securityModal.js, and apiClient.js first.');
    
    // Provide a non-crashing mock if it's missing (shouldn't happen with proper script ordering)
    global.apiService = {
      get: async () => { throw new Error('API Client not loaded'); },
      post: async () => { throw new Error('API Client not loaded'); },
      put: async () => { throw new Error('API Client not loaded'); },
      delete: async () => { throw new Error('API Client not loaded'); },
    };
    return;
  }

  // Alias the new client to the old variable name for compatibility
  global.apiService = {
    get: (endpoint) => global.apiClient.get(endpoint),
    post: (endpoint, body) => global.apiClient.post(endpoint, body),
    put: (endpoint, body) => global.apiClient.put(endpoint, body),
    delete: (endpoint) => global.apiClient.delete(endpoint),
  };

})(window);
