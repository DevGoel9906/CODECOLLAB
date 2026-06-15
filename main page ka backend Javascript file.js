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
        const result = await window.apiClient.get('/projects');
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
                    <div class="tags">
                        ${project.tech.map(t => `<span class="tag">${t}</span>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <span style="color: var(--text-muted); font-size: 0.85rem;">Status:</span>
                    <span style="color: var(--accent); font-weight: 600; font-size: 0.85rem; margin-left: 0.5rem; text-transform: uppercase;">${project.status || 'Active'}</span>
                </div>

                ${maintainersHtml}

                <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                    <a href="all_projects/index.html?id=${project.id}" class="filter-btn active" style="text-decoration: none; text-align: center; width: 100%;">View Project</a>
                </div>
            `;
            projectGrid.appendChild(card);
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
});
