/**
 * services/securityModal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Security UI Module
 *
 * PURPOSE:
 *   A self-contained module that renders a high-visibility danger modal
 *   whenever a security threat is detected by the API client.
 *
 * USAGE:
 *   window.CodeCollabSecurity.showWarning('Optional custom message');
 *
 * This module auto-injects its own CSS, so it works on any page
 * without requiring changes to CSS files.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── CSS Injection ─────────────────────────────────────────────────────────
  const injectStyles = () => {
    if (document.getElementById('cc-security-styles')) return;

    const style = document.createElement('style');
    style.id = 'cc-security-styles';
    style.textContent = `
      .cc-sec-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        padding: 1rem;
      }
      .cc-sec-overlay.visible {
        opacity: 1;
      }
      .cc-sec-card {
        background: rgba(20, 20, 20, 0.95);
        border: 1px solid #ff4444;
        border-radius: 16px;
        width: 100%;
        max-width: 480px;
        padding: 0;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(255, 0, 0, 0.25);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .cc-sec-overlay.visible .cc-sec-card {
        transform: translateY(0) scale(1);
      }
      .cc-sec-header {
        background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .cc-sec-header svg {
        width: 28px;
        height: 28px;
      }
      .cc-sec-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        letter-spacing: 0.025em;
      }
      .cc-sec-body {
        padding: 1.5rem;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.6;
        font-size: 1rem;
      }
      .cc-sec-message {
        margin-bottom: 1.25rem;
      }
      .cc-sec-reassurance {
        font-size: 0.875rem;
        color: #94a3b8;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
        margin-bottom: 1.5rem;
      }
      .cc-sec-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
      }
      .cc-sec-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.6rem 1.25rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
      }
      .cc-sec-btn:hover {
        background: #dc2626;
      }
      .cc-sec-btn:active {
        transform: scale(0.97);
      }
    `;
    document.head.appendChild(style);
  };

  // ── DOM Construction ──────────────────────────────────────────────────────
  let overlayEl = null;

  const buildDOM = () => {
    if (overlayEl) return;

    injectStyles();

    overlayEl = document.createElement('div');
    overlayEl.className = 'cc-sec-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-labelledby', 'cc-sec-title');

    overlayEl.innerHTML = `
      <div class="cc-sec-card">
        <div class="cc-sec-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M12 8v4"></path>
            <path d="M12 16h.01"></path>
          </svg>
          <h2 id="cc-sec-title" class="cc-sec-title">Security Warning</h2>
        </div>
        <div class="cc-sec-body">
          <div class="cc-sec-message" id="cc-sec-msg-text">
            Suspicious or unauthorized activity was detected. The requested action has been blocked for your protection.
          </div>
          <div class="cc-sec-reassurance">
            <strong>System Status:</strong> No data was modified. Your session remains secure.
          </div>
          <div class="cc-sec-footer">
            <button class="cc-sec-btn" id="cc-sec-btn-close">Understood</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Event Listeners
    const closeBtn = overlayEl.querySelector('#cc-sec-btn-close');
    closeBtn.addEventListener('click', hideWarning);

    // Prevent clicks inside the card from closing it, but clicking outside closes
    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) hideWarning();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayEl.classList.contains('visible')) {
        hideWarning();
      }
    });
  };

  // ── Public API ────────────────────────────────────────────────────────────

  const showWarning = (message) => {
    // Ensure DOM is ready (wait if called before body exists)
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => showWarning(message));
      return;
    }

    buildDOM();

    const msgEl = overlayEl.querySelector('#cc-sec-msg-text');
    if (message && typeof message === 'string') {
      // Basic escaping to prevent XSS injection into the modal itself
      const safeMsg = message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      msgEl.innerHTML = safeMsg;
    } else {
      msgEl.textContent = 'Suspicious or unauthorized activity was detected. The requested action has been blocked for your protection.';
    }

    // Small delay to allow CSS transitions to trigger
    requestAnimationFrame(() => {
      overlayEl.style.display = 'flex';
      requestAnimationFrame(() => {
        overlayEl.classList.add('visible');
        overlayEl.querySelector('#cc-sec-btn-close').focus();
      });
    });
  };

  const hideWarning = () => {
    if (!overlayEl) return;
    
    overlayEl.classList.remove('visible');
    
    // Wait for transition
    setTimeout(() => {
      overlayEl.style.display = 'none';
    }, 300);
  };

  // Expose to global scope
  global.CodeCollabSecurity = {
    showWarning,
    hideWarning
  };

})(window);
