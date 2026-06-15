/**
 * services/apiClient.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Centralized API Client
 *
 * PURPOSE:
 *   Handles all frontend-to-backend communication.
 *   Uses the CodeCollabConfig object for the base URL.
 *   Automatically intercepts security threat responses (400, 403) and
 *   triggers the Security Warning Modal.
 *
 * DEPENDENCIES:
 *   Must be loaded AFTER config.js and securityModal.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // Ensure config exists
  const config = global.CodeCollabConfig;
  if (!config) {
    console.error('[API Client] CRITICAL ERROR: config.js must be loaded before apiClient.js');
    return;
  }

  // Ensure security module exists
  const security = global.CodeCollabSecurity;
  if (!security) {
    console.error('[API Client] CRITICAL ERROR: securityModal.js must be loaded before apiClient.js');
    return;
  }

  /**
   * Generic fetch wrapper with security interception
   */
  const request = async (endpoint, options = {}) => {
    // Construct full URL using the centralized config
    const url = `${config.API_BASE}${endpoint}`;

    // Get auth token if implemented
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      // AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT_MS || 15000);

      const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // We expect the backend to always return JSON, even on errors
      let data;
      try {
        data = await response.json();
      } catch (jsonErr) {
        // If not JSON, it might be a catastrophic server failure (e.g., 502 Bad Gateway HTML)
        throw new Error('Server returned an invalid response format.');
      }

      // ── SECURITY INTERCEPTION ─────────────────────────────────────────────
      // If the backend flags this as a security threat, or it's a 403 Forbidden
      if (data.securityThreat || response.status === 403) {
        // Trigger the visual modal
        security.showWarning(data.message || 'Unauthorized action blocked by security policy.');
        
        // Log internally, but don't expose raw details
        console.warn(`[Security API] Blocked: ${options.method || 'GET'} ${endpoint} - ${response.status}`);
        
        // Throw a specific error so the calling code knows it failed
        const err = new Error(data.message || 'Security threat detected');
        err.isSecurityThreat = true;
        err.status = response.status;
        throw err;
      }

      // ── NORMAL ERROR HANDLING ─────────────────────────────────────────────
      if (!response.ok) {
        const errorMessage = data.message || (data.errors && data.errors[0] && data.errors[0].message) || 'API Error occurred';
        const err = new Error(errorMessage);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`[API Client] Timeout on ${options.method || 'GET'} ${endpoint}`);
        throw new Error('Request timed out. Please check your connection.');
      }
      
      // Don't double-log security threats, but do log other network errors
      if (!error.isSecurityThreat) {
         // Keep logging minimal to avoid exposing internals in prod
         if (config.IS_DEV) {
           console.error(`[API Client] Error on ${options.method || 'GET'} ${endpoint}:`, error.message);
         }
      }
      
      throw error;
    }
  };

  // ── Public API ────────────────────────────────────────────────────────────
  
  global.apiClient = {
    get: (endpoint) => request(endpoint, { method: 'GET' }),
    
    post: (endpoint, body) => request(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
    
    put: (endpoint, body) => request(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
    
    patch: (endpoint, body) => request(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    }),
    
    delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
  };

})(window);
