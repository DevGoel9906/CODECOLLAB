/* 
   File: dashboard page ka logic Javascript file.js
   Description: Logic for managing user join requests, project status, and dashboard stats.
                Status dropdown is ONLY visible to the project owner.
*/

// Initial Mock Data for Join Requests (fallback if no stored data)
let joinRequests = [
    { id: 101, project: "SwiftTrack Logistics", date: "2026-04-05", status: "Ongoing" },
    { id: 102, project: "EcoPulse AI", date: "2026-04-09", status: "Pending" },
    { id: 103, project: "SecurePass Vault", date: "2026-03-25", status: "Completed" }
];

// Projects owned by current user (fetched from backend + localStorage)
let myProjects = [];

// The logged-in user's ID from localStorage
const currentUserId = localStorage.getItem('userId');

// ──────────────────────────────────────────────
// STATUS HELPERS
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
    'ongoing':    { color: '#17a2b8', label: '🔄 Ongoing'    },
    'complete':   { color: '#28a745', label: '✅ Complete'   },
    'drop idea':  { color: '#dc3545', label: '🗑️ Drop Idea'  },
    'Pending':    { color: '#ffc107', label: '⏳ Pending'    },
    'Ongoing':    { color: '#17a2b8', label: '🔄 Ongoing'    },
    'Completed':  { color: '#28a745', label: '✅ Completed'  },
};

function getBadge(status) {
    const cfg = STATUS_CONFIG[status] || { color: '#6c757d', label: status };
    return `<span style="
        display: inline-block;
        padding: 0.3rem 0.85rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 600;
        background: ${cfg.color}22;
        color: ${cfg.color};
        border: 1px solid ${cfg.color}55;
        letter-spacing: 0.02em;
    ">${cfg.label}</span>`;
}

// ── Check authentication status before rendering
if (!currentUserId) {
    window.location.href = '../index.html?auth=login';
}

// ──────────────────────────────────────────────
// ON DOM READY
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Load Profile bio
    const storedProfile = localStorage.getItem('codecollab_user_profile');
    const profile = storedProfile ? JSON.parse(storedProfile) : {};
    const bioEl = document.getElementById('user-bio');
    if (bioEl) {
        bioEl.textContent = profile.bio || "Here's how your project collaborations are doing.";
    }

    // Bind profile modal trigger
    const sidebarProfileBtn = document.getElementById('sidebar-profile-btn');
    if (sidebarProfileBtn && window.CodeCollabProfileCard) {
        sidebarProfileBtn.addEventListener('click', () => {
            window.CodeCollabProfileCard.show();
        });
    }

    // 2. Load Join Requests from localStorage (or defaults)
    const storedRequests = localStorage.getItem('codecollab_requests');
    if (storedRequests) {
        joinRequests = JSON.parse(storedRequests);
    }

    // 3. Fetch the user's owned projects from backend
    await loadMyProjects();

    renderDashboard();
});

// ──────────────────────────────────────────────
// FETCH MY PROJECTS FROM BACKEND
// ──────────────────────────────────────────────
async function loadMyProjects() {
    if (!currentUserId) return;

    try {
        const result = await window.apiClient.get('/projects');
        if (result.success && Array.isArray(result.data)) {
            // Filter to only projects this user owns
            myProjects = result.data.filter(p => p.ownerId === currentUserId);
        }
    } catch (err) {
        console.error('Could not fetch projects from backend:', err);
    }

    // Also merge any locally added projects (owner tracked by 'creator' fallback)
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    const localOwned = localProjects
        .filter(p => !p.ownerId || p.ownerId === currentUserId)
        .map(p => ({
            projectId: String(p.id),
            title: p.title,
            status: p.status || 'ongoing',
            ownerId: currentUserId || 'local',
            isLocal: true,
            _localIndex: localProjects.indexOf(p)
        }));

    // Avoid duplicates (backend already includes saved ones)
    myProjects = [...myProjects, ...localOwned];
}

// ──────────────────────────────────────────────
// RENDER DASHBOARD
// ──────────────────────────────────────────────
function renderDashboard() {
    // Update Stats
    document.getElementById('total-req').textContent = joinRequests.length;
    document.getElementById('pending-req').textContent =
        joinRequests.filter(r => r.status === 'Pending').length;
    document.getElementById('accepted-req').textContent =
        joinRequests.filter(r => r.status === 'Ongoing' || r.status === 'Completed').length;

    renderJoinRequests();
    renderMyProjects();
}

// ──────────────────────────────────────────────
// RENDER JOIN REQUESTS SECTION
// ──────────────────────────────────────────────
function renderJoinRequests() {
    const grid = document.getElementById('project-status-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (joinRequests.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No join requests yet.</p>`;
        return;
    }

    joinRequests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const card = document.createElement('div');
        card.className = 'glass-card fade-in';
        card.style.cssText = 'padding:1.5rem; border-radius:15px; border:1px solid var(--glass-border); background:var(--glass);';

        card.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${req.project}</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.8rem;">Applied: ${req.date}</p>
            ${getBadge(req.status)}
            <button class="view-btn" style="margin-top:1.2rem; width:100%; padding:0.6rem; font-size:0.85rem;" onclick="window.CodeCollabComingSoon.show('Request Details Coming Soon', 'Detailed tracking of your request is under development and will be available in a future update.', '📊')">View Request</button>
        `;
        grid.appendChild(card);
    });
}

// ──────────────────────────────────────────────
// RENDER MY PROJECTS (OWNER VIEW WITH STATUS CONTROL)
// ──────────────────────────────────────────────
function renderMyProjects() {
    // Create or find the section
    let section = document.getElementById('my-projects-section');
    if (!section) {
        section = document.createElement('section');
        section.id = 'my-projects-section';
        section.className = 'fade-in';
        section.style.cssText = 'margin-top: 2.5rem; animation-delay: 0.5s;';
        section.innerHTML = `
            <h2 class="section-title" style="margin-bottom: 1.2rem;">
                🗂️ My Projects
                <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted); margin-left: 0.5rem;">(Owner Controls)</span>
            </h2>
            <div id="my-projects-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:1.5rem;"></div>
        `;
        document.querySelector('.main-content').appendChild(section);
    }

    const grid = document.getElementById('my-projects-grid');
    grid.innerHTML = '';

    if (!currentUserId) {
        grid.innerHTML = `<p style="color: var(--text-muted);">Register or log in to manage your projects.</p>`;
        return;
    }

    if (myProjects.length === 0) {
        grid.innerHTML = `<p style="color: var(--text-muted);">You haven't created any projects yet. <a href="../admin_and_user_settings/add project page.html" style="color: var(--accent);">Add one →</a></p>`;
        return;
    }

    myProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'glass-card fade-in';
        card.style.cssText = `
            padding: 1.5rem;
            border-radius: 16px;
            border: 1px solid var(--glass-border);
            background: var(--glass);
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
            card.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG['ongoing'];
        const statusOptions = ['ongoing', 'complete', 'drop idea'];

        // Build options HTML
        const optionsHtml = statusOptions.map(s =>
            `<option value="${s}" ${project.status === s ? 'selected' : ''}>${
                STATUS_CONFIG[s] ? STATUS_CONFIG[s].label : s
            }</option>`
        ).join('');

        card.innerHTML = `
            <!-- Accent line -->
            <div style="
                position: absolute; top: 0; left: 0; right: 0; height: 3px;
                background: linear-gradient(90deg, ${cfg.color}, ${cfg.color}66);
                border-radius: 16px 16px 0 0;
            "></div>

            <div style="margin-top: 0.5rem;">
                <h3 style="font-size: 1.1rem; margin-bottom: 0.4rem; color: var(--text);">${project.title}</h3>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1rem; font-family: monospace;">
                    ${project.projectId}
                </p>

                <!-- Current Status Badge -->
                <div id="badge-${project.projectId}" style="margin-bottom: 1rem;">
                    ${getBadge(project.status)}
                </div>

                <!-- 👑 OWNER-ONLY STATUS CONTROL -->
                <div style="margin-top: 0.8rem;">
                    <label style="
                        font-size: 0.75rem;
                        color: var(--text-muted);
                        display: block;
                        margin-bottom: 0.4rem;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                    ">⚙️ Update Status</label>

                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <select
                            id="status-select-${project.projectId}"
                            data-project-id="${project.projectId}"
                            data-is-local="${project.isLocal || false}"
                            style="
                                flex: 1;
                                padding: 0.55rem 0.8rem;
                                border-radius: 10px;
                                background: rgba(255,255,255,0.06);
                                border: 1px solid var(--glass-border);
                                color: var(--text);
                                font-size: 0.85rem;
                                cursor: pointer;
                                outline: none;
                                appearance: none;
                                -webkit-appearance: none;
                                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
                                background-repeat: no-repeat;
                                background-position: right 0.6rem center;
                                background-size: 1.2rem;
                                transition: border-color 0.2s;
                            "
                        >
                            ${optionsHtml}
                        </select>

                        <button
                            onclick="applyStatusUpdate('${project.projectId}', ${project.isLocal || false})"
                            style="
                                padding: 0.55rem 1rem;
                                border-radius: 10px;
                                background: var(--accent, #0ea5e9);
                                color: white;
                                border: none;
                                font-weight: 600;
                                font-size: 0.82rem;
                                cursor: pointer;
                                white-space: nowrap;
                                transition: opacity 0.2s, transform 0.15s;
                            "
                            onmouseenter="this.style.opacity='0.85'"
                            onmouseleave="this.style.opacity='1'"
                        >Save</button>
                    </div>

                    <p id="status-msg-${project.projectId}" style="
                        font-size: 0.75rem;
                        margin-top: 0.4rem;
                        min-height: 1rem;
                        color: #28a745;
                    "></p>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

// ──────────────────────────────────────────────
// APPLY STATUS UPDATE
// ──────────────────────────────────────────────
async function applyStatusUpdate(projectId, isLocal) {
    const select = document.getElementById(`status-select-${projectId}`);
    const msgEl = document.getElementById(`status-msg-${projectId}`);
    const badgeEl = document.getElementById(`badge-${projectId}`);

    if (!select) return;

    const newStatus = select.value;
    const ownerId = currentUserId;

    msgEl.style.color = '#ffc107';
    msgEl.textContent = 'Saving...';

    // 1. Try PATCH backend call (skip for local-only projects without a real projectId)
    if (!isLocal) {
        try {
            const result = await window.apiClient.patch(`/projects/${projectId}/status`, { ownerId, status: newStatus });

            if (!result.success) {
                msgEl.style.color = '#dc3545';
                msgEl.textContent = result.message || 'Update failed.';
                return;
            }
        } catch (err) {
            // apiClient already intercepts securityThreat errors
            msgEl.style.color = '#dc3545';
            msgEl.textContent = 'Network error. Status saved locally.';
        }
    }

    // 2. Update localStorage for local projects
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    const localIdx = localProjects.findIndex(p => String(p.id) === String(projectId));
    if (localIdx !== -1) {
        localProjects[localIdx].status = newStatus;
        localStorage.setItem('user_added_projects', JSON.stringify(localProjects));
    }

    // 3. Update in-memory myProjects array
    const proj = myProjects.find(p => p.projectId === projectId);
    if (proj) proj.status = newStatus;

    // 4. Refresh badge in place (no full re-render needed)
    if (badgeEl) badgeEl.innerHTML = getBadge(newStatus);

    // Update the accent line color
    const cfg = STATUS_CONFIG[newStatus] || { color: '#6c757d' };
    const accentLine = select.closest('.glass-card').querySelector('div[style*="position: absolute"]');
    if (accentLine) {
        accentLine.style.background = `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66)`;
    }

    msgEl.style.color = '#28a745';
    msgEl.textContent = '✓ Status updated!';
    setTimeout(() => { msgEl.textContent = ''; }, 3000);
}

// ──────────────────────────────────────────────
// ADD NEW REQUEST (called from other pages)
// ──────────────────────────────────────────────
function addNewRequest(projectName) {
    const newReq = {
        id: Date.now(),
        project: projectName,
        date: new Date().toISOString().split('T')[0],
        status: "Pending"
    };
    joinRequests.push(newReq);
    localStorage.setItem('codecollab_requests', JSON.stringify(joinRequests));
}
