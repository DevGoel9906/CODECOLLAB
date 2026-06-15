/* 
   File: project detail page ka logic Javascript file.js
   Description: Logic for rendering project details based on ID
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get Data from Central Database + Local Storage
    const staticProjects = (typeof globalDatabase !== 'undefined') ? globalDatabase.projects : [];
    const localProjects = JSON.parse(localStorage.getItem('user_added_projects') || '[]');
    const projectsData = [...staticProjects, ...localProjects];
    
    // Get Project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = parseInt(urlParams.get('id')) || 1;
    
    const project = projectsData.find(p => p.id === projectId);

    if (project) {
        // Render Project Details
        document.getElementById('project-img').src = project.image;
        document.getElementById('project-title').textContent = project.title;
        document.getElementById('project-desc').innerHTML = project.description;
        document.getElementById('stars-count').textContent = project.stars;
        document.getElementById('contributors-count').textContent = project.contributors;
        document.getElementById('progress-pct').textContent = project.progress + '%';
        document.getElementById('progress-bar-inner').style.width = project.progress + '%';
        
        const tagsContainer = document.getElementById('project-tags');
        project.tech.forEach(t => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = t;
            tagsContainer.appendChild(span);
        });

        const demoPopup = document.getElementById('demo-popup');
        const demoCloseBtn = demoPopup.querySelector('.modal-close');
        const joinPopup = document.getElementById('join-popup');
        const joinCloseBtn = joinPopup.querySelector('.modal-close');
        const isDemoProject = project.demo || project.title.includes('{DEMO}');

        // Populate Core Maintainers
        const maintainersContainer = document.getElementById('maintainers-container');
        if (project.creator) {
            const creatorInitials = project.creator.split(' ').map(n => n[0]).join('').toUpperCase();
            const avatarColor = `hsl(${creatorInitials.charCodeAt(0) * 20}, 70%, 60%)`;
            
            const creatorHTML = `
                <div class="contributor">
                    <div class="avatar" style="background: ${avatarColor}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white;">${creatorInitials}</div>
                    <span>${project.creator}</span>
                </div>
            `;
            maintainersContainer.innerHTML = creatorHTML;
        }

        function showDemoMessage() {
            demoPopup.classList.remove('hidden');
        }

        function hideDemoMessage() {
            demoPopup.classList.add('hidden');
        }

        demoCloseBtn.addEventListener('click', hideDemoMessage);
        demoPopup.addEventListener('click', (event) => {
            if (event.target === demoPopup) hideDemoMessage();
        });

        function showJoinConfirm() {
            joinPopup.classList.remove('hidden');
        }

        function hideJoinConfirm() {
            joinPopup.classList.add('hidden');
        }

        joinCloseBtn.addEventListener('click', hideJoinConfirm);
        joinPopup.addEventListener('click', (event) => {
            if (event.target === joinPopup) hideJoinConfirm();
        });

        // JOIN BUTTON LOGIC
        const joinBtn = document.querySelector('.btn-primary');
        joinBtn.addEventListener('click', () => {
            if (isDemoProject) {
                showDemoMessage();
                return;
            }

            const stored = localStorage.getItem('codecollab_requests');
            let requests = stored ? JSON.parse(stored) : [
                { id: 101, project: "SwiftTrack Logistics", date: "2026-04-05", status: "Accepted" },
                { id: 102, project: "EcoPulse AI", date: "2026-04-09", status: "Pending" },
                { id: 103, project: "SecurePass Vault", date: "2026-03-25", status: "Rejected" }
            ];

            const exists = requests.find(r => r.project === project.title);
            if (exists) {
                alert(`You have already applied for ${project.title}. Status: ${exists.status}`);
            } else {
                const newReq = {
                    id: Date.now(),
                    project: project.title,
                    date: new Date().toISOString().split('T')[0],
                    status: "Pending"
                };
                requests.push(newReq);
                localStorage.setItem('codecollab_requests', JSON.stringify(requests));
                joinBtn.textContent = "Request Sent!";
                joinBtn.style.background = "#0C6A6E";
                joinBtn.disabled = true;
                showJoinConfirm();
            }
        });

        // GITHUB LINK LOGIC
        const githubBtn = document.getElementById('github-btn') || document.querySelector('.btn-outline');
        githubBtn.addEventListener('click', () => {
            if (isDemoProject) {
                showDemoMessage();
                return;
            }

            if (project.github_url) {
                window.open(project.github_url, '_blank');
            } else {
                alert("GitHub repository not linked for this project.");
            }
        });

        // MEETING MODAL LOGIC
        const scheduleBtn = document.getElementById('schedule-meeting-btn');
        const meetingModal = document.getElementById('meeting-modal');
        const meetingSuccessModal = document.getElementById('meeting-success-modal');
        const maintainerSelect = document.getElementById('meeting-maintainer');
        
        if (scheduleBtn && meetingModal) {
            scheduleBtn.addEventListener('click', () => {
                if (isDemoProject) {
                    showDemoMessage();
                    return;
                }

                // In this simplified version, the creator is the only maintainer shown for now
                // Ideally this uses project.maintainers if available
                maintainerSelect.innerHTML = '';
                const opt = document.createElement('option');
                opt.value = project.creator || 'Admin';
                opt.textContent = project.creator || 'Admin';
                maintainerSelect.appendChild(opt);
                
                meetingModal.style.display = 'flex';
            });

            document.getElementById('meeting-close-icon').addEventListener('click', (e) => {
                e.preventDefault();
                meetingModal.style.display = 'none';
            });

            document.getElementById('meeting-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const requesterId = localStorage.getItem('userId') || 'USR-000000';
                const recipientName = document.getElementById('meeting-maintainer').value;
                const recipientId = 'USR-999999'; // Mock ID
                
                const message = document.getElementById('meeting-desc').value;

                try {
                    await window.apiClient.post('/meeting-requests', {
                        requesterId,
                        recipientId,
                        projectId: project.id || project.projectId || 'PRJ-000000',
                        message,
                        scheduledDate: new Date().toISOString()
                    });
                } catch(err) {
                    console.error(err);
                    if (err.isSecurityThreat) return;
                }

                meetingModal.style.display = 'none';
                meetingSuccessModal.style.display = 'flex';
                e.target.reset();
            });

            document.getElementById('meeting-success-ok-btn').addEventListener('click', () => {
                meetingSuccessModal.style.display = 'none';
            });
        }
    }

    // 2. Custom Cursor
    const cursor = document.querySelector('.cursor');
    document.addEventListener('mousemove', (e) => {
        cursor.style.transform = `translate(${e.clientX - 10}px, ${e.clientY - 10}px)`;
    });

    const hoverables = ['button', 'a', '.stat-box'];
    hoverables.forEach(tag => {
        document.querySelectorAll(tag).forEach(el => {
            el.addEventListener('mouseenter', () => cursor.style.transform += ' scale(2.5)');
            el.addEventListener('mouseleave', () => cursor.style.transform = cursor.style.transform.replace(' scale(2.5)', ''));
        });
    });
});
