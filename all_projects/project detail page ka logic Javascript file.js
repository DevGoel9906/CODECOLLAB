/**
 * all_projects/project detail page ka logic Javascript file.js
 * ─────────────────────────────────────────────────────────────────────────────
 * CODECOLLAB — Project Details Page Script Logic
 * ─────────────────────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', async () => {
    // ── 1. RENDER FLOATING NAVIGATION DOCK ───────────────────────────────────
    const dockContainer = document.getElementById('floating-dock');
    
    function renderDock() {
        if (!dockContainer) return;
        const currentUserId = localStorage.getItem('userId');
        const userProfileStr = localStorage.getItem('codecollab_user_profile');
        const userProfile = userProfileStr ? JSON.parse(userProfileStr) : {};
        const userName = userProfile.name || localStorage.getItem('name') || '';
        const userInitials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

        let html = `
            <a href="../index.html" class="dock-item">Home</a>
            <a href="javascript:void(0)" class="dock-item" id="dock-about-btn">About</a>
            <a href="../index.html#discovery-area" class="dock-item active">Projects</a>
        `;

        if (currentUserId) {
            html += `
                <a href="../user_dashboard_system/index.html" class="dock-item">Dashboard</a>
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
        // About trigger
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

        // Profile card trigger
        const profileBtn = document.getElementById('dock-profile-btn');
        if (profileBtn && window.CodeCollabProfileCard) {
            profileBtn.addEventListener('click', () => {
                window.CodeCollabProfileCard.show();
            });
        }

        // Auth modal triggers (redirects to home with login search params)
        const signinBtn = document.getElementById('dock-signin-btn');
        const signupBtn = document.getElementById('dock-signup-btn');

        if (signinBtn) {
            signinBtn.addEventListener('click', () => {
                window.location.href = '../index.html?auth=login';
            });
        }
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = '../index.html?auth=login';
            });
        }

        // macOS spring hover magnification
        const dockItems = document.querySelectorAll('.dock-item');
        dockContainer.addEventListener('mousemove', (e) => {
            const rect = dockContainer.getBoundingClientRect();
            const mouseX = e.clientX;

            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.left + itemRect.width / 2;
                const distance = Math.abs(mouseX - itemCenter);
                
                const maxDistance = 140;
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


    // ── 2. GET PROJECT DATA & DETAIL SYNC ──────────────────────────────────
    const staticProjects = (typeof globalDatabase !== 'undefined') ? globalDatabase.projects : [];
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    const projectsData = [...staticProjects, ...localProjects];

    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('id') || '1';
    
    let project = null;

    // Check if ID is a number or formatted string (e.g. PRJ-XXXXXX)
    if (/^\d+$/.test(rawId)) {
        const intId = parseInt(rawId);
        project = projectsData.find(p => p.id === intId);
    } else {
        project = projectsData.find(p => p.projectId === rawId);
    }

    // If not found in static/local, fetch directly from backend API
    if (!project) {
        try {
            const response = await window.apiClient.get(`/projects`);
            if (response.success && response.data) {
                const backendProj = response.data.find(p => p.projectId === rawId);
                if (backendProj) {
                    project = {
                        id: backendProj.projectId,
                        projectId: backendProj.projectId,
                        title: backendProj.title,
                        category: backendProj.techStack && backendProj.techStack.length > 0 ? backendProj.techStack[0] : 'Web',
                        tech: backendProj.techStack || [],
                        progress: 50,
                        contributors: 4,
                        stars: "18",
                        github_url: backendProj.githubLink || '#',
                        description: backendProj.description,
                        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
                        ownerId: backendProj.ownerId,
                        status: backendProj.status || 'ongoing',
                        maintainers: []
                    };
                }
            }
        } catch (err) {
            console.error('[Details Page Loader] Failed to query backend project details:', err.message);
        }
    }

    // ── 3. RENDER PROJECT INTERFACE ─────────────────────────────────────────
    const STATUS_UI = {
        'ongoing':    { tag: '🟢 ACTIVE', color: '#4FC3B3' },
        'complete':   { tag: '🔵 COMPLETED', color: '#38bdf8' },
        'drop idea':  { tag: '🔴 DROPPED', color: '#ff5f5f' },
        'on hold':    { tag: '🟡 ON HOLD', color: '#fbbf24' }
    };

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

    if (project) {
        document.getElementById('project-img').src = project.image || 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800';
        document.getElementById('project-title').textContent = project.title;
        document.getElementById('project-desc').innerHTML = project.description;
        document.getElementById('project-id').textContent = project.projectId || `PRJ-${String(project.id).padStart(6, '0')}`;
        document.getElementById('stars-count').textContent = project.stars || "0";
        document.getElementById('contributors-count').textContent = project.contributors || "1";
        document.getElementById('progress-pct').textContent = (project.progress || 0) + '%';
        document.getElementById('progress-bar-inner').style.width = (project.progress || 0) + '%';

        // Render Status Badge
        const dbStatus = (project.status || 'ongoing').toLowerCase();
        const sCfg = STATUS_UI[dbStatus] || { tag: `🟢 ${project.status}`, color: '#4FC3B3' };
        
        const badgeContainer = document.getElementById('status-badge-container');
        if (badgeContainer) {
            badgeContainer.innerHTML = `
                <span class="status-badge" style="position:static; background: ${sCfg.color}20; color: ${sCfg.color}; border: 1px solid ${sCfg.color}40;">
                    ${sCfg.tag}
                </span>
            `;
        }

        // Render Tech Tags
        const tagsContainer = document.getElementById('project-tags');
        tagsContainer.innerHTML = '';
        if (project.tech) {
            project.tech.forEach(t => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = t;
                tagsContainer.appendChild(span);
            });
        }

        // Render Required Skills
        const skillsContainer = document.getElementById('project-skills');
        if (skillsContainer) {
            skillsContainer.innerHTML = '';
            const techList = project.tech || [];
            const skills = techList.map(t => SKILLS_MAP[t] || `${t} development`);
            if (skills.length === 0) skills.push('Open Source Contribution');
            
            skills.forEach(s => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.style.cssText = 'background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); color: var(--text-muted);';
                span.textContent = s;
                skillsContainer.appendChild(span);
            });
        }

        // Render Owner Details
        const ownerContainer = document.getElementById('owner-info-container');
        if (ownerContainer) {
            const ownerId = project.ownerId || 'USR-000000';
            let ownerName = project.creator || 'CodeCollab Admin';
            
            // Try fetching owner profile details from database API
            try {
                if (project.ownerId) {
                    const usrRes = await window.apiClient.get(`/users/${project.ownerId}`);
                    if (usrRes.success && usrRes.data) {
                        ownerName = usrRes.data.name;
                    }
                }
            } catch(e) {}

            const initials = ownerName.split(' ').map(n => n[0]).join('').toUpperCase();
            ownerContainer.innerHTML = `
                <div class="owner-card">
                    <div class="avatar-circle">${initials}</div>
                    <div class="profile-info">
                        <span class="name">${ownerName}</span>
                        <span class="role-label">Project Creator</span>
                        <div class="profile-links">
                            <a href="https://github.com" target="_blank">GitHub</a>
                            <a href="https://linkedin.com" target="_blank">LinkedIn</a>
                        </div>
                    </div>
                </div>
            `;
        }

        // Render Core Maintainers
        const maintainersContainer = document.getElementById('maintainers-container');
        if (maintainersContainer) {
            maintainersContainer.innerHTML = '';
            const maintainers = project.maintainers && project.maintainers.length > 0
                ? project.maintainers
                : [{ name: project.creator || 'CodeCollab Admin', github: '#', linkedin: '#' }];

            maintainers.forEach(m => {
                const initials = m.name.split(' ').map(n => n[0]).join('').toUpperCase();
                const div = document.createElement('div');
                div.className = 'contributor';
                div.innerHTML = `
                    <div class="avatar-circle" style="width:30px; height:30px; font-size:0.75rem;">${initials}</div>
                    <div class="profile-info">
                        <span class="name" style="font-size:0.85rem;">${m.name}</span>
                        <div class="profile-links" style="font-size:0.75rem;">
                            <a href="${m.github || '#'}" target="_blank">GitHub</a>
                            <a href="${m.linkedin || '#'}" target="_blank">LinkedIn</a>
                        </div>
                    </div>
                `;
                maintainersContainer.appendChild(div);
            });
        }

        // ── 4. DYNAMIC MEETINGS FETCHING & SCHEDULING ───────────────────────
        const meetingListEl = document.getElementById('meeting-list-container');
        
        async function loadScheduledMeetings() {
            if (!meetingListEl) return;
            const pId = project.projectId || `PRJ-${String(project.id).padStart(6, '0')}`;
            
            try {
                const response = await window.apiClient.get('/meeting-requests');
                if (response.success && Array.isArray(response.data)) {
                    // Filter meetings for this specific project
                    const filtered = response.data.filter(r => r.projectId === pId);
                    
                    if (filtered.length > 0) {
                        meetingListEl.innerHTML = '';
                        filtered.forEach(m => {
                            const dateStr = new Date(m.scheduledDate).toLocaleString();
                            const statusLabel = m.status === 'pending' ? '⏳ Pending' : (m.status === 'accepted' ? '✅ Accepted' : '❌ Declined');
                            const div = document.createElement('div');
                            div.className = 'meeting-item';
                            div.innerHTML = `
                                <h5>${m.message || 'Discussion Session'}</h5>
                                <p style="margin-top:0.25rem;">Date: ${dateStr}</p>
                                <span style="font-size:0.78rem; font-weight:600; display:inline-block; margin-top:0.5rem; color: var(--accent);">${statusLabel}</span>
                            `;
                            meetingListEl.appendChild(div);
                        });
                    } else {
                        meetingListEl.innerHTML = '<p style="color: var(--text-muted); font-size:0.9rem;">No meetings scheduled for this project yet.</p>';
                    }
                }
            } catch (err) {
                console.warn('[Meetings Loader] Failed to query meetings list:', err.message);
            }
        }

        // Initial load of meetings
        loadScheduledMeetings();

        // ── 5. BUTTON ACTION LOGIC ──────────────────────────────────────────
        const isDemoProject = project.title.includes('{DEMO}');
        const joinBtn = document.getElementById('join-project-btn');
        const githubBtn = document.getElementById('github-btn');
        const scheduleBtn = document.getElementById('schedule-meeting-btn');

        // Modal triggers
        const demoPopup = document.getElementById('demo-popup');
        const joinPopup = document.getElementById('join-popup');
        const meetingModal = document.getElementById('meeting-modal');
        const meetingSuccessModal = document.getElementById('meeting-success-modal');

        // Helpers to toggle modal visibility
        function toggleModal(el, show = true) {
            if (!el) return;
            if (show) {
                el.style.display = 'flex';
                requestAnimationFrame(() => el.classList.add('visible'));
            } else {
                el.classList.remove('visible');
                setTimeout(() => { el.style.display = 'none'; }, 300);
            }
        }

        // Close bindings for modals
        document.getElementById('demo-close-btn').addEventListener('click', () => toggleModal(demoPopup, false));
        document.getElementById('demo-ok-btn').addEventListener('click', () => toggleModal(demoPopup, false));
        demoPopup.addEventListener('click', (e) => { if (e.target === demoPopup) toggleModal(demoPopup, false); });

        document.getElementById('join-close-btn').addEventListener('click', () => toggleModal(joinPopup, false));
        document.getElementById('join-ok-btn').addEventListener('click', () => toggleModal(joinPopup, false));
        joinPopup.addEventListener('click', (e) => { if (e.target === joinPopup) toggleModal(joinPopup, false); });

        document.getElementById('meeting-close-icon').addEventListener('click', () => toggleModal(meetingModal, false));
        document.getElementById('meeting-success-ok-btn').addEventListener('click', () => toggleModal(meetingSuccessModal, false));

        // JOIN ACTION BUTTON
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                if (isDemoProject) {
                    toggleModal(demoPopup, true);
                    return;
                }

                const currentUserId = localStorage.getItem('userId');
                if (!currentUserId) {
                    // Redirect to home requesting authentication
                    window.location.href = '../index.html?auth=login';
                    return;
                }

                // Check duplicate applications
                const stored = localStorage.getItem('codecollab_requests');
                let requests = stored ? JSON.parse(stored) : [];

                const exists = requests.find(r => r.project === project.title);
                if (exists) {
                    if (window.CodeCollabComingSoon) {
                        window.CodeCollabComingSoon.show(
                            'Application Duplicate',
                            `You have already requested to join the team of ${project.title}.<br><br>Current Review Status: <b>${exists.status}</b>`,
                            '⏳'
                        );
                    } else {
                        alert(`Already applied. Status: ${exists.status}`);
                    }
                } else {
                    const newReq = {
                        id: Date.now(),
                        project: project.title,
                        date: new Date().toISOString().split('T')[0],
                        status: "Pending"
                    };
                    requests.push(newReq);
                    localStorage.setItem('codecollab_requests', JSON.stringify(requests));
                    
                    joinBtn.textContent = "Application Pending";
                    joinBtn.style.background = "rgba(79,195,179,0.08)";
                    joinBtn.style.color = "var(--accent)";
                    joinBtn.style.border = "1px solid rgba(79,195,179,0.15)";
                    joinBtn.disabled = true;

                    toggleModal(joinPopup, true);
                }
            });
        }

        // GITHUB ACTION BUTTON
        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                if (isDemoProject) {
                    toggleModal(demoPopup, true);
                    return;
                }

                if (project.github_url && project.github_url !== '#') {
                    window.open(project.github_url, '_blank');
                } else {
                    if (window.CodeCollabComingSoon) {
                        window.CodeCollabComingSoon.show(
                            'GitHub Repo Unavailable',
                            'A GitHub repository has not been linked for this project yet. Please check back later or notify the owner.',
                            '💻'
                        );
                    } else {
                        alert("GitHub repository not linked for this project.");
                    }
                }
            });
        }

        // SCHEDULE MEETING MODAL TOGGLE
        if (scheduleBtn && meetingModal) {
            scheduleBtn.addEventListener('click', () => {
                if (isDemoProject) {
                    toggleModal(demoPopup, true);
                    return;
                }

                const currentUserId = localStorage.getItem('userId');
                if (!currentUserId) {
                    window.location.href = '../index.html?auth=login';
                    return;
                }

                // Populate selector
                const maintainerSelect = document.getElementById('meeting-maintainer');
                if (maintainerSelect) {
                    maintainerSelect.innerHTML = '';
                    const maintainers = project.maintainers && project.maintainers.length > 0
                        ? project.maintainers
                        : [{ name: project.creator || 'CodeCollab Admin' }];

                    maintainers.forEach(m => {
                        const opt = document.createElement('option');
                        opt.value = m.name;
                        opt.textContent = m.name;
                        maintainerSelect.appendChild(opt);
                    });
                }

                // Pre-fill profile name/email from session keys
                const sessionName = localStorage.getItem('name') || '';
                const sessionEmail = localStorage.getItem('email') || '';
                document.getElementById('meeting-name').value = sessionName;
                document.getElementById('meeting-email').value = sessionEmail;

                toggleModal(meetingModal, true);
            });

            // Submit meeting request handler
            document.getElementById('meeting-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const requesterId = localStorage.getItem('userId') || 'USR-000000';
                const recipientId = project.ownerId || 'USR-999999'; // Owner ID reference
                
                const topic = document.getElementById('meeting-topic').value.trim();
                const description = document.getElementById('meeting-desc').value.trim();
                const pId = project.projectId || `PRJ-${String(project.id).padStart(6, '0')}`;

                const payload = {
                    requesterId,
                    recipientId,
                    projectId: pId,
                    message: `${topic} - ${description}`,
                    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Scheduled for tomorrow by default
                };

                try {
                    await window.apiClient.post('/meeting-requests', payload);
                    toggleModal(meetingModal, false);
                    toggleModal(meetingSuccessModal, true);
                    
                    e.target.reset();
                    // Reload dynamic meetings list after post succeeds
                    loadScheduledMeetings();
                } catch(err) {
                    if (err.isSecurityThreat) {
                        toggleModal(meetingModal, false);
                    } else {
                        alert(err.message || 'Failed to submit meeting request.');
                    }
                }
            });
        }
    }

    // ── 6. CURSOR HOVER TRIGGERS ────────────────────────────────────────────
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });

        const setupCursorHover = () => {
            const hoverables = ['button', 'a', '.stat-box', 'input', 'select', 'textarea'];
            hoverables.forEach(tag => {
                document.querySelectorAll(tag).forEach(el => {
                    if (el.dataset.cursorBound) return;
                    el.dataset.cursorBound = 'true';

                    el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
                    el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
                });
            });
        };
        setupCursorHover();

        const observer = new MutationObserver(setupCursorHover);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Scroll reveal observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});
