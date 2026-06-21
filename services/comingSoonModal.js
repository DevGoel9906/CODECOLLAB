/**
 * services/comingSoonModal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Glassmorphism "Coming Soon" Experience Module
 *
 * PURPOSE:
 *   Handles modal overlay warnings, alerts, and detailed messaging when
 *   unimplemented features are clicked.
 *
 * USAGE:
 *   window.CodeCollabComingSoon.show(title, description);
 *   window.CodeCollabComingSoon.showAuth();
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  // ── CSS Injection ─────────────────────────────────────────────────────────
  const injectStyles = () => {
    if (document.getElementById('cc-comingsoon-styles')) return;

    const style = document.createElement('style');
    style.id = 'cc-comingsoon-styles';
    style.textContent = `
      .cc-cs-overlay {
        position: fixed;
        inset: 0;
        background: rgba(11, 15, 25, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 1.5rem;
      }
      .cc-cs-overlay.visible {
        opacity: 1;
      }
      .cc-cs-card {
        background: rgba(15, 23, 42, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        width: 100%;
        max-width: 480px;
        padding: 2.5rem;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
        transform: translateY(20px) scale(0.95);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15);
        text-align: center;
        color: #f8fafc;
        font-family: 'Outfit', sans-serif;
        position: relative;
      }
      .cc-cs-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at top right, rgba(79, 195, 179, 0.06), transparent 60%);
        pointer-events: none;
        border-radius: 24px;
      }
      .cc-cs-overlay.visible .cc-cs-card {
        transform: translateY(0) scale(1);
      }
      .cc-cs-icon {
        font-size: 3rem;
        margin-bottom: 1.5rem;
        display: inline-block;
        animation: pulseIcon 2s infinite ease-in-out;
      }
      .cc-cs-title {
        font-size: 1.6rem;
        font-weight: 800;
        margin-bottom: 1rem;
        background: linear-gradient(135deg, #fff 0%, #4FC3B3 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .cc-cs-desc {
        color: #94a3b8;
        font-size: 0.98rem;
        line-height: 1.6;
        margin-bottom: 2rem;
      }
      .cc-cs-btn {
        background: linear-gradient(135deg, #4FC3B3 0%, #2f9486 100%);
        color: #0b0f19;
        border: none;
        padding: 0.75rem 2.2rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(79, 195, 179, 0.25);
        outline: none;
      }
      .cc-cs-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 179, 0.45);
      }
      .cc-cs-btn:active {
        transform: translateY(0);
      }
      @keyframes pulseIcon {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
  };

  let overlayEl = null;

  const buildDOM = () => {
    if (overlayEl) return;

    injectStyles();

    overlayEl = document.createElement('div');
    overlayEl.className = 'cc-cs-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');

    overlayEl.innerHTML = `
      <div class="cc-cs-card">
        <div class="cc-cs-icon" id="cc-cs-icon-content">✨</div>
        <h2 class="cc-cs-title" id="cc-cs-title-content">Feature Coming Soon</h2>
        <div class="cc-cs-desc" id="cc-cs-desc-content">
          This feature is currently under development and will be available in an upcoming release.
        </div>
        <button class="cc-cs-btn" id="cc-cs-btn-close">Acknowledge</button>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Event listeners
    const closeBtn = overlayEl.querySelector('#cc-cs-btn-close');
    closeBtn.addEventListener('click', hide);

    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) hide();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayEl.classList.contains('visible')) {
        hide();
      }
    });
  };

  const show = (title, description, icon = '🚀') => {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => show(title, description, icon));
      return;
    }

    buildDOM();

    overlayEl.querySelector('#cc-cs-title-content').textContent = title || 'Feature Coming Soon';
    overlayEl.querySelector('#cc-cs-desc-content').innerHTML = description || 'This feature is currently under development and will be available in an upcoming release.';
    overlayEl.querySelector('#cc-cs-icon-content').textContent = icon;

    requestAnimationFrame(() => {
      overlayEl.style.display = 'flex';
      requestAnimationFrame(() => {
        overlayEl.classList.add('visible');
        overlayEl.querySelector('#cc-cs-btn-close').focus();
      });
    });
  };

  const showAuth = () => {
    show(
      'Authentication Coming Soon',
      `User authentication is currently under development and will be available in an upcoming release.<br><br>We are building a secure and scalable authentication system to provide a better experience for contributors, maintainers, and project owners.<br><br>Please check back in a future update.`,
      '🔒'
    );
  };

  const hide = () => {
    if (!overlayEl) return;
    overlayEl.classList.remove('visible');
    setTimeout(() => {
      overlayEl.style.display = 'none';
    }, 300);
  };

  // Expose to global scope
  global.CodeCollabComingSoon = {
    show,
    showAuth,
    hide
  };

  // Auto-scan document for "coming soon" interactions once loaded
  const initInteractions = () => {
    document.body.addEventListener('click', (e) => {
      // Find elements with href="#" or specific data/class
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href');
      const comingSoonAttr = target.getAttribute('data-coming-soon');

      if (comingSoonAttr || (href === '#' && !target.classList.contains('nav-item'))) {
        e.preventDefault();
        e.stopPropagation();

        const contextTitle = target.getAttribute('data-title') || 'Feature Coming Soon';
        const contextDesc = target.getAttribute('data-desc') || 'This feature is currently under development and will be available in an upcoming release.<br><br>Thank you for helping us build CODECOLLAB.';
        const contextIcon = target.getAttribute('data-icon') || '✨';

        if (target.id === 'login-btn' || target.innerText.toLowerCase().includes('login') || target.innerText.toLowerCase().includes('join us')) {
          showAuth();
        } else {
          show(contextTitle, contextDesc, contextIcon);
        }
      }
    });
  };

  if (document.body) {
    initInteractions();
  } else {
    document.addEventListener('DOMContentLoaded', initInteractions);
  }

})(window);
