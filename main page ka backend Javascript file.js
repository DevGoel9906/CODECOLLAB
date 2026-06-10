/* 
   File: main page ka backend Javascript file.js
   Description: Interaction, Animations, and Centralized Data Management
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Data Source (Merge Static and User-Added Projects)
    const staticProjects = (typeof globalDatabase !== 'undefined') ? globalDatabase.projects : [];
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    const projects = [...staticProjects, ...localProjects];

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
                </div>
                <div class="card-footer">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${project.progress}%"></div>
                    </div>
                    <button class="view-btn" onclick="window.location.href='all_projects/index.html?id=${project.id}'">View</button>
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
