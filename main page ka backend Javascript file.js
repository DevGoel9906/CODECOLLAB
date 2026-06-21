/**
 * main page ka backend Javascript file.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Landing Page Operations, WebGL controls, & Authentication
 * ─────────────────────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── 1. GLOBAL DATABASE SYNC & PROJECT LOADING ───────────────────────────
    const staticProjects = (typeof globalDatabase !== 'undefined') ? globalDatabase.projects : [];
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    let projects = [...staticProjects, ...localProjects];

    // Map tech stacks to specific required skills for richer visual hierarchy
    const SKILLS_MAP = {
        'React': 'Frontend Architecture',
        'TypeScript': 'Type Safety design',
        'Rust': 'Memory Safety & Systems',
        'Solidity': 'Smart Contract audits',
        'Python': 'Backend algorithms',
        'WebAssembly': 'Low-level sandboxing',
        'Canvas API': 'Interactive rendering',
        'CSS': 'Responsive layouts',
        'JavaScript': 'ES6 functional scripting'
    };

    function getSkillsForProject(techList) {
        if (!techList || techList.length === 0) return ['Open Source Contribution'];
        return techList.map(t => SKILLS_MAP[t] || `${t} development`).slice(0, 2);
    }

    // Fetch projects from backend to merge
    try {
        const result = await window.apiClient.get('/projects');
        if (result.success && result.data) {
            const backendProjects = result.data.map(p => ({
                id: p.projectId,
                projectId: p.projectId,
                title: p.title,
                category: p.techStack && p.techStack.length > 0 ? p.techStack[0] : 'Web',
                tech: p.techStack || [],
                progress: 40,
                contributors: 3,
                stars: "12",
                github_url: p.githubLink || '#',
                description: p.description,
                image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
                ownerId: p.ownerId,
                status: p.status || 'ongoing',
                maintainers: [] // Synced on details page
            }));

            // Avoid duplicating backend loaded projects
            const filteredBackend = backendProjects.filter(bp => !projects.some(p => p.projectId === bp.projectId));
            projects = [...projects, ...filteredBackend];
        }
    } catch (err) {
        console.warn('[Backend Projects Sync] Failed to retrieve backend projects list:', err.message);
    }

    // ── 2. DOCK NAVIGATION SYSTEM & MAGNIFICATION ───────────────────────────
    const dockContainer = document.getElementById('floating-dock');
    
    function renderDock() {
        if (!dockContainer) return;
        const currentUserId = localStorage.getItem('userId');
        const userProfileStr = localStorage.getItem('codecollab_user_profile');
        const userProfile = userProfileStr ? JSON.parse(userProfileStr) : {};
        const userName = userProfile.name || localStorage.getItem('name') || '';
        const userInitials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

        let html = `
            <a href="index.html" class="dock-item active">Home</a>
            <a href="javascript:void(0)" class="dock-item" id="dock-about-btn">About</a>
            <a href="#discovery-area" class="dock-item">Projects</a>
        `;

        if (currentUserId) {
            html += `
                <a href="user_dashboard_system/index.html" class="dock-item">Dashboard</a>
                <a href="https://github.com" target="_blank" class="dock-item">
                    GitHub
                    <span class="cc-tooltip">Contribute on GitHub</span>
                </a>
                <a href="javascript:void(0)" class="dock-item" id="dock-profile-btn" style="border-left: 1px solid var(--glass-border); padding-left: 1rem; margin-left: 0.5rem;">
                    <div class="dock-avatar">${userInitials}</div> Profile
                </a>
            `;
        } else {
            html += `
                <a href="https://github.com" target="_blank" class="dock-item">
                    GitHub
                    <span class="cc-tooltip">Contribute on GitHub</span>
                </a>
                <a href="javascript:void(0)" class="dock-item" id="dock-signin-btn" style="color: var(--accent); font-weight: 700;">Sign In</a>
                <a href="javascript:void(0)" class="dock-item" id="dock-signup-btn">Sign Up</a>
            `;
        }

        dockContainer.innerHTML = html;
        attachDockListeners();
    }

    function attachDockListeners() {
        // About click listener
        const aboutBtn = document.getElementById('dock-about-btn');
        if (aboutBtn && window.CodeCollabComingSoon) {
            aboutBtn.addEventListener('click', () => {
                window.CodeCollabComingSoon.show(
                    'About CodeCollab',
                    'CodeCollab is a premium, developer-first hub for students. Discover interesting projects, request team meetings with maintainers, and sync your contributions straight to your GitHub profile.<br><br>Made for student engineers worldwide.',
                    '🤝'
                );
            });
        }

        // Profile click listener
        const profileBtn = document.getElementById('dock-profile-btn');
        if (profileBtn && window.CodeCollabProfileCard) {
            profileBtn.addEventListener('click', () => {
                window.CodeCollabProfileCard.show();
            });
        }

        // Auth modal triggers
        const signinBtn = document.getElementById('dock-signin-btn');
        const signupBtn = document.getElementById('dock-signup-btn');

        if (signinBtn) signinBtn.addEventListener('click', () => openAuthModal('signin'));
        if (signupBtn) signupBtn.addEventListener('click', () => openAuthModal('signup'));

        // macOS spring hover magnification
        const dockItems = document.querySelectorAll('.dock-item');
        dockContainer.addEventListener('mousemove', (e) => {
            const rect = dockContainer.getBoundingClientRect();
            const mouseX = e.clientX;

            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(mouseX - itemCenter);
                
                // Magnification scale calculation
                const maxDistance = 140; // Pixel boundary for magnification bubble
                if (distance < maxDistance) {
                    const scaleFactor = 1.0 + (1.0 - distance / maxDistance) * 0.18;
                    item.style.transform = `scale(${scaleFactor})`;
                    item.style.margin = `0 ${0.2 + (1.0 - distance / maxDistance) * 0.25}rem`;
                } else {
                    item.style.transform = 'scale(1)';
                    item.style.margin = '0';
                }
            });
        });

        dockContainer.addEventListener('mouseleave', () => {
            dockItems.forEach(item => {
                item.style.transform = 'scale(1)';
                item.style.margin = '0';
            });
        });
    }

    // Initial render of dock links
    renderDock();

    // ── 3. INTERACTIVE WEBGL STICKER SHADER INTEGRATION ───────────────────────
    if (window.CodeCollabStickerShader) {
        window.CodeCollabStickerShader.init('metallic-showcase-container', 'sticker.png');

        // Bind WebGL Customizer slider controls to uniforms updates
        const inputs = [
            { id: 'ctrl-aberration', name: 'chromaticAberration' },
            { id: 'ctrl-wavespeed', name: 'waveSpeed' },
            { id: 'ctrl-scale', name: 'scale' },
            { id: 'ctrl-rotation', name: 'rotation' },
            { id: 'ctrl-noise', name: 'noise' },
            { id: 'ctrl-brightness', name: 'brightness' },
            { id: 'ctrl-contrast', name: 'contrast' }
        ];

        inputs.forEach(slider => {
            const el = document.getElementById(slider.id);
            if (el) {
                el.addEventListener('input', (e) => {
                    window.CodeCollabStickerShader.setUniform(slider.name, e.target.value);
                });
            }
        });
    }

    // ── 4. CENTRAL GLASSMORPHISM AUTHENTICATION MODAL ─────────────────────────
    const authOverlay = document.getElementById('auth-modal-overlay');
    const authClose = document.getElementById('auth-modal-close');
    const tabSignin = document.getElementById('tab-signin');
    const tabSignup = document.getElementById('tab-signup');
    const formSignin = document.getElementById('auth-signin-form');
    const formSignup = document.getElementById('auth-signup-form');
    const authAlert = document.getElementById('auth-modal-alert');
    const forgotBtn = document.getElementById('auth-forgot-btn');

    function openAuthModal(mode = 'signin') {
        if (!authOverlay) return;
        
        // Setup starting panel active mode
        if (mode === 'signin') {
            tabSignin.classList.add('active');
            tabSignup.classList.remove('active');
            formSignin.style.display = 'block';
            formSignup.style.display = 'none';
        } else {
            tabSignup.classList.add('active');
            tabSignin.classList.remove('active');
            formSignup.style.display = 'block';
            formSignin.style.display = 'none';
        }

        authAlert.style.display = 'none';

        requestAnimationFrame(() => {
            authOverlay.style.display = 'flex';
            requestAnimationFrame(() => {
                authOverlay.classList.add('visible');
            });
        });
    }

    function closeAuthModal() {
        if (!authOverlay) return;
        authOverlay.classList.remove('visible');
        setTimeout(() => {
            authOverlay.style.display = 'none';
        }, 300);
    }

    if (authClose) authClose.addEventListener('click', closeAuthModal);
    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) closeAuthModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authOverlay && authOverlay.classList.contains('visible')) {
            closeAuthModal();
        }
    });

    // Tab toggle logic
    if (tabSignin && tabSignup) {
        tabSignin.addEventListener('click', () => {
            tabSignin.classList.add('active');
            tabSignup.classList.remove('active');
            formSignin.style.display = 'block';
            formSignup.style.display = 'none';
            authAlert.style.display = 'none';
        });

        tabSignup.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabSignin.classList.remove('active');
            formSignup.style.display = 'block';
            formSignin.style.display = 'none';
            authAlert.style.display = 'none';
        });
    }

    // Forgot password redirect
    if (forgotBtn && window.CodeCollabComingSoon) {
        forgotBtn.addEventListener('click', () => {
            closeAuthModal();
            window.CodeCollabComingSoon.show(
                'Password Reset Offline',
                'The password reset authentication layer is undergoing secure server repairs. Please contact administrative support to reset your keys.',
                '🔑'
            );
        });
    }

    // Form submit handlers
    if (formSignin) {
        formSignin.addEventListener('submit', async (e) => {
            e.preventDefault();
            authAlert.style.display = 'none';

            const email = document.getElementById('auth-signin-email').value.trim();
            const password = document.getElementById('auth-signin-password').value;

            try {
                const response = await window.apiClient.post('/auth/login', { email, password });
                if (response.success && response.data) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('userId', response.data.userId);
                    localStorage.setItem('name', response.data.name);
                    localStorage.setItem('email', response.data.email);
                    localStorage.setItem('role', response.data.role);

                    // Re-render and clear local edit cache
                    localStorage.removeItem('codecollab_user_profile');

                    authAlert.textContent = 'Sign In Successful! Redirecting...';
                    authAlert.className = 'cc-alert cc-alert-success';
                    authAlert.style.display = 'block';

                    setTimeout(() => {
                        closeAuthModal();
                        renderDock();
                        window.location.reload();
                    }, 1000);
                }
            } catch (err) {
                if (err.isSecurityThreat) {
                    closeAuthModal();
                    return;
                }
                authAlert.textContent = err.message || 'Authentication failed. Please verify credentials.';
                authAlert.className = 'cc-alert cc-alert-error';
                authAlert.style.display = 'block';
            }
        });
    }

    if (formSignup) {
        formSignup.addEventListener('submit', async (e) => {
            e.preventDefault();
            authAlert.style.display = 'none';

            const name = document.getElementById('auth-signup-name').value.trim();
            const username = document.getElementById('auth-signup-username').value.trim();
            const role = document.getElementById('auth-signup-role').value;
            const email = document.getElementById('auth-signup-email').value.trim();
            const github = document.getElementById('auth-signup-github').value.trim();
            const linkedin = document.getElementById('auth-signup-linkedin').value.trim();
            const password = document.getElementById('auth-signup-password').value;
            const confirm = document.getElementById('auth-signup-confirm').value;

            if (password !== confirm) {
                authAlert.textContent = 'Passwords do not match.';
                authAlert.className = 'cc-alert cc-alert-error';
                authAlert.style.display = 'block';
                return;
            }

            if (github && !github.startsWith('https://')) {
                authAlert.textContent = 'GitHub profile must be a secure link starting with https://';
                authAlert.className = 'cc-alert cc-alert-error';
                authAlert.style.display = 'block';
                return;
            }

            if (linkedin && !linkedin.startsWith('https://')) {
                authAlert.textContent = 'LinkedIn profile must be a secure link starting with https://';
                authAlert.className = 'cc-alert cc-alert-error';
                authAlert.style.display = 'block';
                return;
            }

            const payload = { name, role, email, password, confirmPassword: confirm };
            if (username) payload.username = username;
            if (github) payload.github = github;
            if (linkedin) payload.linkedin = linkedin;

            try {
                const response = await window.apiClient.post('/auth/register', payload);
                if (response.success && response.data) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('userId', response.data.userId);
                    localStorage.setItem('name', response.data.name);
                    localStorage.setItem('email', response.data.email);
                    localStorage.setItem('role', response.data.role);

                    // Re-render and clear cache
                    localStorage.removeItem('codecollab_user_profile');

                    authAlert.textContent = 'Registration Successful! Workspace ready.';
                    authAlert.className = 'cc-alert cc-alert-success';
                    authAlert.style.display = 'block';

                    setTimeout(() => {
                        closeAuthModal();
                        renderDock();
                        window.location.reload();
                    }, 1000);
                }
            } catch (err) {
                if (err.isSecurityThreat) {
                    closeAuthModal();
                    return;
                }
                authAlert.textContent = err.message || 'Registration failed. Check inputs.';
                authAlert.className = 'cc-alert cc-alert-error';
                authAlert.style.display = 'block';
            }
        });
    }

    // Automatically check for incoming redirect parameters requesting login modal activation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'login') {
        openAuthModal('signin');
    }

    // ── 5. RENDER MODERNIZED PROJECT CARDS ──────────────────────────────────
    const projectGrid = document.getElementById('project-grid');
    const searchInput = document.getElementById('project-search');
    let activeCategory = 'All';

    // Status styling indicators configuration mapping
    const STATUS_UI = {
        'ongoing':    { tag: '🟢 ACTIVE', color: '#4FC3B3' },
        'complete':   { tag: '🔵 COMPLETED', color: '#38bdf8' },
        'drop idea':  { tag: '🔴 DROPPED', color: '#ff5f5f' },
        'on hold':    { tag: '🟡 ON HOLD', color: '#fbbf24' }
    };

    function renderProjects() {
        if (!projectGrid) return;
        projectGrid.innerHTML = '';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const filtered = projects.filter(p => {
            const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
            const matchesSearch = p.title.toLowerCase().includes(searchTerm) || 
                                (p.tech && p.tech.some(t => t.toLowerCase().includes(searchTerm))) ||
                                (p.description && p.description.toLowerCase().includes(searchTerm));
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            projectGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 6rem; color: var(--text-muted); font-size:1.05rem;">No collaborative project templates found.</p>';
            return;
        }

        filtered.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'card reveal';
            card.style.transitionDelay = `${index * 0.05}s`;
            
            // Map project status indicator properties
            const dbStatus = (project.status || 'ongoing').toLowerCase();
            const statusCfg = STATUS_UI[dbStatus] || { tag: `🟢 ${project.status}`, color: '#4FC3B3' };

            // Determine display owner and core maintainers
            const ownerName = project.creator || 'CodeCollab Builder';
            const maintainersList = project.maintainers && project.maintainers.length > 0 
                ? project.maintainers 
                : [{ name: ownerName }];

            const skillsRequired = getSkillsForProject(project.tech);

            card.innerHTML = `
                <div class="card-spotlight"></div>
                <div class="img-container">
                    <img src="${project.image}" alt="${project.title}">
                    <span class="status-badge" style="background: ${statusCfg.color}20; color: ${statusCfg.color}; border: 1px solid ${statusCfg.color}40;">
                        ${statusCfg.tag}
                    </span>
                </div>
                
                <div class="card-body">
                    <h3>${project.title}</h3>
                    
                    <div class="card-meta-row">
                        <span class="meta-label">Launched By:</span>
                        <span class="meta-val">${ownerName}</span>
                    </div>

                    <!-- Tech stack list -->
                    <div class="tags" style="margin-top: 1rem;">
                        ${project.tech ? project.tech.map(t => `<span class="tag">${t}</span>`).join('') : ''}
                    </div>

                    <!-- Required Skills -->
                    <div class="skills-section" style="margin-top: 1.2rem;">
                        <h4 style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:0.4rem; letter-spacing:0.04em;">Required Skills</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                            ${skillsRequired.map(s => `<span class="skill-tag" style="font-size:0.75rem; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:6px; padding:0.25rem 0.6rem; color:var(--text-muted);">${s}</span>`).join('')}
                        </div>
                    </div>

                    <!-- Core Maintainers -->
                    <div class="maintainers-section" style="margin-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 1rem;">
                        <h4 style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; letter-spacing:0.04em;">Core Maintainers</h4>
                        <div style="display: flex; gap: 0.4rem; align-items:center; flex-wrap:wrap;">
                            ${maintainersList.map(m => {
                                const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase();
                                return `
                                    <div class="avatar-circle" title="${m.name}" style="width:26px; height:26px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid var(--glass-border); font-size:0.75rem; font-weight:600; color:var(--text-main); display:flex; align-items:center; justify-content:center;">
                                        ${initials}
                                    </div>
                                `;
                            }).join('')}
                            <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.3rem;">${maintainersList.length} maintainer${maintainersList.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                <div class="card-footer-actions">
                    <a href="all_projects/index.html?id=${project.id || project.projectId}" class="cc-btn cc-btn-primary" style="text-decoration: none; text-align: center; width: 100%; font-size:0.88rem; padding: 0.6rem 1rem;">View Details</a>
                </div>
            `;
            
            projectGrid.appendChild(card);

            // Add dynamic 3D Card Tilt calculations
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Tilt card angle calculations
                const rotateX = -((y - rect.height / 2) / (rect.height / 2)) * 8;
                const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 8;
                
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
                
                // Highlight spotlight reflection follow mouse position
                const spotlight = card.querySelector('.card-spotlight');
                if (spotlight) {
                    spotlight.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(79, 195, 179, 0.1) 0%, transparent 80%)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
                const spotlight = card.querySelector('.card-spotlight');
                if (spotlight) {
                    spotlight.style.background = 'none';
                }
            });
        });

        // Trigger reveal animations observer checks
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.05 });
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // Initial render project templates grid
    renderProjects();

    // Bind Category Filter Buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.textContent;
            renderProjects();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', renderProjects);
    }

    // ── 6. DOCK CUSTOM CURSOR HOVER TRIGGERS ────────────────────────────────
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });

        // Set hover triggers for all buttons and interactive cards
        const setupCursorHover = () => {
            const hoverables = ['a', 'button', '.card', '.filter-btn', 'input', 'select', 'textarea'];
            hoverables.forEach(tag => {
                document.querySelectorAll(tag).forEach(el => {
                    // Avoid duplicate binding
                    if (el.dataset.cursorBound) return;
                    el.dataset.cursorBound = 'true';

                    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
                    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
                });
            });
        };
        setupCursorHover();

        // Check for DOM mutations to bind dynamic elements
        const cursorObserver = new MutationObserver(setupCursorHover);
        cursorObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Intersection observer for scrolling transitions
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => scrollObserver.observe(el));
});
