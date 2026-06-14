/* 
   File: main page ka backend Javascript file.js
   Description: Interaction, Animations, and Centralized Data Management
*/

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Data Source (Merge Static and User-Added Projects)
    const staticProjects = (typeof globalDatabase !== 'undefined') ? globalDatabase.projects : [];
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    let projects = [...staticProjects, ...localProjects];

    // Fetch projects from backend
    try {
        const response = await fetch('http://localhost:5000/api/v1/projects');
        const result = await response.json();
        if (result.success && result.data) {
            const backendProjects = result.data.map(p => ({
                id: p.projectId,
                title: p.title,
                category: p.techStack && p.techStack.length > 0 ? p.techStack[0] : 'Web',
                tech: p.techStack || [],
                progress: 0,
                contributors: 1,
                stars: "0",
                github_url: p.githubLink || '#',
                description: p.description,
                image: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=800",
                maintainers: [] // Would normally be fetched
            }));
            projects = [...projects, ...backendProjects];
        }
    } catch (err) {
        console.error('Failed to fetch projects from backend:', err);
    }

    // Login Modal Logic
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
        document.getElementById('login-ok-btn').addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
        document.getElementById('login-close-btn').addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    // 2. Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    });

    const hoverables = ['a', 'button', '.card', '.filter-btn', 'input'];
    hoverables.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.style.transform += ' scale(2.5)');
            el.addEventListener('mouseleave', () => cursor.style.transform = cursor.style.transform.replace(' scale(2.5)', ''));
        });
    });

    // 3. Render Projects Logic
    const projectGrid = document.getElementById('project-grid');
    const searchInput = document.getElementById('project-search');
    let activeCategory = 'All';

    function renderProjects() {
        projectGrid.innerHTML = '';
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        const filtered = projects.filter(p => {
            const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
            const matchesSearch = p.title.toLowerCase().includes(searchTerm) || 
                                p.tech.some(t => t.toLowerCase().includes(searchTerm)) ||
                                p.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

        if (filtered.length === 0) {
            projectGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">No projects found matching your search.</p>';
            return;
        }

        filtered.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'card reveal-text';
            card.style.animationDelay = `${index * 0.05}s`;
            
            let maintainersHtml = '';
            if (project.maintainers && project.maintainers.length > 0) {
                maintainersHtml = `
                    <div class="maintainers-section" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                        <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0.5rem;">Core Maintainers</h4>
                        <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem;">
                            ${project.maintainers.map(m => `
                                <li style="margin-bottom: 0.5rem;">
                                    <span style="font-weight: 600;">&bull; ${m.name}</span><br>
                                    <a href="${m.github}" target="_blank" style="color: var(--accent); text-decoration: none; margin-right: 0.5rem;">GitHub</a>
                                    <a href="${m.linkedin}" target="_blank" style="color: #0A66C2; text-decoration: none;">LinkedIn</a>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="img-container">
                    <img src="${project.image}" alt="${project.title}">
                </div>
                <div>
                    <h3>${project.title}</h3>
                    <p>${project.description}</p>
                    <div class="tags">
                        ${project.tech.map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                    ${maintainersHtml}
                </div>
                <div style="margin-top: 1rem;">
                    <button class="schedule-btn filter-btn" data-project-id="${project.id}" style="width: 100%; margin-bottom: 1rem; border-radius: 10px;">Schedule Meeting</button>
                </div>
                <div class="card-footer" style="margin-top: auto;">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${project.progress}%"></div>
                    </div>
                    <button class="view-btn" onclick="window.location.href='all_projects/index.html?id=${project.id}'">View</button>
                </div>
            `;
            projectGrid.appendChild(card);
        });

        // Attach event listeners to schedule buttons
        document.querySelectorAll('.schedule-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projId = e.target.getAttribute('data-project-id');
                openMeetingModal(projId);
            });
        });
    }

    // Initial Render
    renderProjects();

    // 4. Filter and Search Interaction
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

    // 5. Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Meeting Modal Logic
    const meetingModal = document.getElementById('meeting-modal');
    const meetingSuccessModal = document.getElementById('meeting-success-modal');
    const maintainerSelect = document.getElementById('meeting-maintainer');
    
    function openMeetingModal(projectId) {
        const project = projects.find(p => p.id.toString() === projectId.toString());
        if (!project || !project.maintainers || project.maintainers.length === 0) {
            alert('No maintainers available for this project.');
            return;
        }
        
        maintainerSelect.innerHTML = '';
        project.maintainers.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.textContent = m.name;
            maintainerSelect.appendChild(opt);
        });
        
        meetingModal.style.display = 'flex';
    }

    if (meetingModal) {
        document.getElementById('meeting-close-icon').addEventListener('click', (e) => {
            e.preventDefault();
            meetingModal.style.display = 'none';
        });

        document.getElementById('meeting-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const requesterId = localStorage.getItem('userId') || 'USR-000000'; // fallback mock
            const recipientName = document.getElementById('meeting-maintainer').value;
            // Hacky mock mapping since we don't have real users for maintainers yet
            const recipientId = 'USR-999999'; 
            
            // Extract project id from somewhere... actually we can store it globally when opening modal
            const projectId = window.currentMeetingProjectId || 'PRJ-000000';
            const message = document.getElementById('meeting-desc').value;

            try {
                await fetch('http://localhost:5000/api/v1/meeting-requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requesterId,
                        recipientId,
                        projectId,
                        message,
                        scheduledDate: new Date().toISOString()
                    })
                });
            } catch(err) {
                console.error(err);
            }

            meetingModal.style.display = 'none';
            meetingSuccessModal.style.display = 'flex';
            e.target.reset();
        });

        document.getElementById('meeting-success-ok-btn').addEventListener('click', () => {
            meetingSuccessModal.style.display = 'none';
        });
    }
});
