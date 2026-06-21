/**
 * services/profileModal.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Interactive 3D User Profile Card & Editor Module
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function (global) {
  'use strict';

  let overlayEl = null;
  let cardEl = null;

  // Sync user details from localStorage
  function getUserData() {
    const profileStr = localStorage.getItem('codecollab_user_profile');
    const profile = profileStr ? JSON.parse(profileStr) : {};

    return {
      userId: localStorage.getItem('userId') || 'USR-000000',
      name: profile.name || localStorage.getItem('name') || 'Guest User',
      email: localStorage.getItem('email') || 'guest@codecollab.org',
      role: localStorage.getItem('role') || 'Student',
      github: profile.github || localStorage.getItem('github') || 'https://github.com',
      linkedin: profile.linkedin || localStorage.getItem('linkedin') || 'https://linkedin.com',
      bio: profile.bio || 'CodeCollab platform developer & student.',
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80'
    };
  }

  // Construct DOM elements
  function buildDOM() {
    if (overlayEl) return;

    overlayEl = document.createElement('div');
    overlayEl.className = 'cc-modal-overlay';
    overlayEl.id = 'cc-profile-modal-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');

    overlayEl.innerHTML = `
      <div class="profile-card-container">
        <div class="profile-card3d" id="cc-profile-card">
          <!-- Close button -->
          <button class="cc-modal-close" id="cc-profile-close">&times;</button>
          
          <!-- View Profile View -->
          <div id="cc-profile-view-panel">
            <div class="profile-avatar-wrapper">
              <img src="" alt="Avatar" class="profile-avatar" id="cc-p-avatar">
            </div>
            
            <h2 class="profile-name" id="cc-p-name">Loading...</h2>
            <div class="profile-username" id="cc-p-username">@username</div>
            
            <p style="color: var(--text-muted); font-size: 0.88rem; text-align: center; margin-bottom: 1.5rem; line-height: 1.5;" id="cc-p-bio">
              No bio written.
            </p>

            <div class="profile-details">
              <div class="profile-row">
                <span class="profile-label">User ID</span>
                <span class="profile-value" id="cc-p-uid">USR-000000</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Role</span>
                <span class="profile-value" id="cc-p-role">Student</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Email</span>
                <span class="profile-value" id="cc-p-email">user@codecollab.org</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">GitHub</span>
                <a href="#" target="_blank" class="profile-value" id="cc-p-github" style="color: var(--accent); text-decoration:none;">github.com</a>
              </div>
              <div class="profile-row">
                <span class="profile-label">LinkedIn</span>
                <a href="#" target="_blank" class="profile-value" id="cc-p-linkedin" style="color: var(--accent); text-decoration:none;">linkedin.com</a>
              </div>
            </div>

            <div class="profile-actions">
              <div style="display:flex; gap: 0.8rem;">
                <button class="cc-btn cc-btn-outline" id="cc-profile-edit-btn" style="flex:1;">Edit Profile</button>
                <button class="cc-btn cc-btn-primary" id="cc-profile-dash-btn" style="flex:1;">Dashboard</button>
              </div>
              <div style="display:flex; gap: 0.8rem;">
                <button class="cc-btn cc-btn-outline" id="cc-profile-contact-btn" style="flex:1;">Contact</button>
                <button class="cc-btn cc-btn-secondary" id="cc-profile-logout-btn" style="flex:1;">Logout</button>
              </div>
            </div>
          </div>

          <!-- Edit Profile View -->
          <div id="cc-profile-edit-panel" style="display: none;">
            <h2 style="font-size:1.4rem; font-weight:800; margin-bottom: 1.5rem; text-align:center; color: var(--accent);">Edit Profile Settings</h2>
            
            <form id="cc-profile-edit-form">
              <div class="cc-form-group">
                <label class="cc-label" for="cc-edit-name">Display Name</label>
                <input type="text" id="cc-edit-name" class="cc-input" required>
              </div>
              
              <div class="cc-form-group">
                <label class="cc-label" for="cc-edit-bio">Short Bio</label>
                <textarea id="cc-edit-bio" class="cc-textarea" rows="2" style="resize:none;" required></textarea>
              </div>

              <div class="cc-form-group">
                <label class="cc-label" for="cc-edit-avatar">Avatar URL</label>
                <input type="url" id="cc-edit-avatar" class="cc-input" placeholder="https://unsplash.com/...">
              </div>

              <div class="cc-form-row">
                <div class="cc-form-group">
                  <label class="cc-label" for="cc-edit-github">GitHub Link</label>
                  <input type="url" id="cc-edit-github" class="cc-input">
                </div>
                <div class="cc-form-group">
                  <label class="cc-label" for="cc-edit-linkedin">LinkedIn Link</label>
                  <input type="url" id="cc-edit-linkedin" class="cc-input">
                </div>
              </div>

              <div class="cc-alert" id="cc-edit-alert"></div>

              <div style="display:flex; gap: 0.8rem; margin-top: 1.5rem;">
                <button type="button" class="cc-btn cc-btn-outline" id="cc-edit-cancel" style="flex:1;">Cancel</button>
                <button type="submit" class="cc-btn cc-btn-primary" id="cc-edit-save" style="flex:1;">Save Details</button>
              </div>
            </form>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);
    cardEl = document.getElementById('cc-profile-card');

    // Attach interaction events
    const closeBtn = document.getElementById('cc-profile-close');
    closeBtn.addEventListener('click', hide);

    overlayEl.addEventListener('click', (e) => {
      if (e.target === overlayEl) hide();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlayEl.classList.contains('visible')) {
        hide();
      }
    });

    // Tilt movement calculation (3D tilt mouse tracker)
    const container = overlayEl.querySelector('.profile-card-container');
    container.addEventListener('mousemove', (e) => {
      // Don't tilt if user is editing settings to allow clean typing
      if (document.getElementById('cc-profile-edit-panel').style.display !== 'none') {
        cardEl.style.transform = 'none';
        return;
      }
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 14;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 14;

      cardEl.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    container.addEventListener('mouseleave', () => {
      cardEl.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });

    // Wire up panel switching
    document.getElementById('cc-profile-edit-btn').addEventListener('click', showEditPanel);
    document.getElementById('cc-edit-cancel').addEventListener('click', showViewPanel);

    // Dashboard click
    document.getElementById('cc-profile-dash-btn').addEventListener('click', () => {
      // Dashboard path handling based on nesting
      const isNested = window.location.pathname.includes('/all_projects/') || window.location.pathname.includes('/admin_and_user_settings/');
      window.location.href = isNested ? '../user_dashboard_system/index.html' : 'user_dashboard_system/index.html';
    });

    // Contact button click
    document.getElementById('cc-profile-contact-btn').addEventListener('click', () => {
      if (window.CodeCollabComingSoon) {
        window.CodeCollabComingSoon.show(
          'Contact Integration Offline',
          'The team messaging hub is currently under development. A real-time chat with maintainers will launch in the next upgrade.',
          '✉️'
        );
      } else {
        alert('Contact system is under development.');
      }
    });

    // Logout click
    document.getElementById('cc-profile-logout-btn').addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });

    // Edit Form Submission
    document.getElementById('cc-profile-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('cc-edit-alert');
      alertBox.style.display = 'none';

      const githubVal = document.getElementById('cc-edit-github').value.trim();
      const linkedinVal = document.getElementById('cc-edit-linkedin').value.trim();

      if (githubVal && !githubVal.startsWith('https://')) {
        alertBox.textContent = 'GitHub URL must start with https://';
        alertBox.className = 'cc-alert cc-alert-error';
        alertBox.style.display = 'block';
        return;
      }

      if (linkedinVal && !linkedinVal.startsWith('https://')) {
        alertBox.textContent = 'LinkedIn URL must start with https://';
        alertBox.className = 'cc-alert cc-alert-error';
        alertBox.style.display = 'block';
        return;
      }

      const updated = {
        name: document.getElementById('cc-edit-name').value.trim(),
        bio: document.getElementById('cc-edit-bio').value.trim(),
        avatar: document.getElementById('cc-edit-avatar').value.trim(),
        github: githubVal,
        linkedin: linkedinVal
      };

      // Save to localStorage
      localStorage.setItem('codecollab_user_profile', JSON.stringify(updated));
      localStorage.setItem('name', updated.name);

      alertBox.textContent = 'Profile settings saved successfully! ✓';
      alertBox.className = 'cc-alert cc-alert-success';
      alertBox.style.display = 'block';

      // Re-populate and switch panel back after a short delay
      setTimeout(() => {
        populateCard();
        showViewPanel();
        
        // Reload page to refresh names across widgets
        window.location.reload();
      }, 1000);
    });
  }

  // Populate data inside card layout
  function populateCard() {
    const data = getUserData();

    document.getElementById('cc-p-avatar').src = data.avatar;
    document.getElementById('cc-p-name').textContent = data.name;
    
    // Derive username from email or name
    const derivedUsername = data.email.split('@')[0];
    document.getElementById('cc-p-username').textContent = `@${derivedUsername}`;
    
    document.getElementById('cc-p-bio').textContent = data.bio;
    document.getElementById('cc-p-uid').textContent = data.userId;
    document.getElementById('cc-p-role').textContent = data.role;
    document.getElementById('cc-p-email').textContent = data.email;

    // GitHub Link
    const ghLink = document.getElementById('cc-p-github');
    ghLink.href = data.github;
    ghLink.textContent = data.github.replace('https://', '');

    // LinkedIn Link
    const liLink = document.getElementById('cc-p-linkedin');
    liLink.href = data.linkedin;
    liLink.textContent = data.linkedin.replace('https://', '');

    // Fill inputs in settings form
    document.getElementById('cc-edit-name').value = data.name;
    document.getElementById('cc-edit-bio').value = data.bio;
    document.getElementById('cc-edit-avatar').value = data.avatar;
    document.getElementById('cc-edit-github').value = data.github === 'https://github.com' ? '' : data.github;
    document.getElementById('cc-edit-linkedin').value = data.linkedin === 'https://linkedin.com' ? '' : data.linkedin;
  }

  function showViewPanel() {
    document.getElementById('cc-profile-view-panel').style.display = 'block';
    document.getElementById('cc-profile-edit-panel').style.display = 'none';
    document.getElementById('cc-edit-alert').style.display = 'none';
  }

  function showEditPanel() {
    document.getElementById('cc-profile-view-panel').style.display = 'none';
    document.getElementById('cc-profile-edit-panel').style.display = 'block';
  }

  // Sync profile values with active backend values on profile display
  async function syncProfile() {
    const uid = localStorage.getItem('userId');
    if (!uid) return;

    try {
      const response = await window.apiClient.get(`/users/${uid}`);
      if (response.success && response.data) {
        const backend = response.data;
        const profileStr = localStorage.getItem('codecollab_user_profile');
        const profile = profileStr ? JSON.parse(profileStr) : {};

        // Sync missing local parameters with database values
        let updated = false;
        if (!profile.name || profile.name !== backend.name) {
          profile.name = backend.name;
          updated = true;
        }
        if (backend.github && profile.github !== backend.github) {
          profile.github = backend.github;
          updated = true;
        }
        if (backend.linkedin && profile.linkedin !== backend.linkedin) {
          profile.linkedin = backend.linkedin;
          updated = true;
        }
        if (backend.profileImage && profile.avatar !== backend.profileImage) {
          profile.avatar = backend.profileImage;
          updated = true;
        }
        if (backend.role && localStorage.getItem('role') !== backend.role) {
          localStorage.setItem('role', backend.role);
        }

        if (updated) {
          localStorage.setItem('codecollab_user_profile', JSON.stringify(profile));
          populateCard();
        }
      }
    } catch (err) {
      console.warn('[Profile Sync] Failed to sync profile with database:', err.message);
    }
  }

  // Public Methods
  function show() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', show);
      return;
    }

    buildDOM();
    populateCard();
    showViewPanel();

    requestAnimationFrame(() => {
      overlayEl.style.display = 'flex';
      requestAnimationFrame(() => {
        overlayEl.classList.add('visible');
      });
    });

    // Trigger async sync to keep in step with the database
    syncProfile();
  }

  function hide() {
    if (!overlayEl) return;
    overlayEl.classList.remove('visible');
    setTimeout(() => {
      overlayEl.style.display = 'none';
    }, 300);
  }

  // Expose module globally
  global.CodeCollabProfileCard = {
    show,
    hide
  };

})(window);
