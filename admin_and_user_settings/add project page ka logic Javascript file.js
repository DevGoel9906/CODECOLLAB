/* 
   File: add project page ka logic Javascript file.js
   Description: Handle project submission and local storage updates
*/

document.addEventListener('DOMContentLoaded', () => {
    const previewImg = document.getElementById('preview-img');
    const previewSpan = document.querySelector('#image-preview span');
    const previewContainer = document.getElementById('image-preview');
    const fileInput = document.getElementById('p-image-file');
    const imageError = document.getElementById('image-error');
    let currentImageData = '';
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

    function showPreview(src) {
        previewImg.src = src;
        previewImg.style.display = 'block';
        previewSpan.style.display = 'none';
    }

    function hidePreview() {
        previewImg.src = '';
        previewImg.style.display = 'none';
        previewSpan.style.display = 'block';
    }

    function showError(message) {
        imageError.textContent = message;
        imageError.classList.remove('hidden');
    }

    function hideError() {
        imageError.textContent = '';
        imageError.classList.add('hidden');
    }

    function handleFile(file) {
        hideError();
        if (!file) return;
        if (file.size > MAX_IMAGE_SIZE) {
            showError('Image is too large. Please upload a file smaller than 10MB.');
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            currentImageData = reader.result;
            showPreview(currentImageData);
        };
        reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        previewContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        previewContainer.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            previewContainer.classList.remove('drag-over');
        });
    });

    previewContainer.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    });

    const addMaintainerBtn = document.getElementById('btn-add-maintainer');
    const maintainersContainer = document.getElementById('maintainers-container');
    if (addMaintainerBtn && maintainersContainer) {
        addMaintainerBtn.addEventListener('click', () => {
            const entry = document.createElement('div');
            entry.className = 'maintainer-entry';
            entry.style.background = 'rgba(255,255,255,0.02)';
            entry.style.padding = '1rem';
            entry.style.borderRadius = '10px';
            entry.style.marginBottom = '1rem';
            entry.style.border = '1px solid var(--glass-border)';
            entry.innerHTML = `
                <input type="text" class="m-name" placeholder="Full Name" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white;">
                <input type="url" class="m-linkedin" placeholder="LinkedIn Profile URL" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white;">
                <input type="url" class="m-github" placeholder="GitHub Profile URL" required style="margin-bottom: 0.5rem; width: 100%; padding: 0.8rem; border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white;">
                <button type="button" class="btn-remove-maintainer" style="background: #ff5f5f; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Remove Maintainer</button>
            `;
            maintainersContainer.appendChild(entry);
            updateRemoveButtons();
        });

        maintainersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-maintainer')) {
                e.target.closest('.maintainer-entry').remove();
                updateRemoveButtons();
            }
        });

        function updateRemoveButtons() {
            const entries = maintainersContainer.querySelectorAll('.maintainer-entry');
            entries.forEach((entry, index) => {
                const btn = entry.querySelector('.btn-remove-maintainer');
                if (entries.length > 1) {
                    btn.style.display = 'inline-block';
                } else {
                    btn.style.display = 'none';
                }
            });
        }
        updateRemoveButtons();
    }

    document.getElementById('add-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        if (!currentImageData) {
            showError('Please upload a project cover image (under 10MB).');
            return;
        }

        const creatorName = document.getElementById('p-creator').value;
        
        const maintainerEntries = document.querySelectorAll('.maintainer-entry');
        const maintainers = [];
        maintainerEntries.forEach(entry => {
            const name = entry.querySelector('.m-name').value.trim();
            const linkedin = entry.querySelector('.m-linkedin').value.trim();
            const github = entry.querySelector('.m-github').value.trim();
            if (!name || !linkedin || !github) {
                showError('All maintainer fields are required.');
                return;
            }
            maintainers.push({
                name,
                linkedin,
                github
            });
        });

        const ownerId = localStorage.getItem('userId');
        
        if (!ownerId) {
            // Block unauthenticated requests locally before even hitting the API
            if (window.CodeCollabSecurity) {
                window.CodeCollabSecurity.showWarning("You must be logged in to launch a project. Please return home and log in first.");
            } else {
                showError("You must be logged in to launch a project.");
            }
            return;
        }

        const payload = {
            title: document.getElementById('p-title').value,
            description: document.getElementById('p-desc').value,
            githubLink: document.getElementById('p-github').value,
            techStack: document.getElementById('p-tech').value.split(',').map(t => t.trim()),
            ownerId: ownerId,
        };

        // Read tags input (comma separated)
        const tagsInput = document.getElementById('p-tags');
        const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t) : [];
        payload.tags = tags;

        // Enforce unique project title (client‑side)
        const stored = localStorage.getItem('user_added_projects');
        if (stored) {
            const projects = JSON.parse(stored);
            if (projects.some(p => p.title === payload.title)) {
                showError('Project title must be unique.');
                return;
            }
        }

        try {
            await window.apiClient.post('/projects', payload);
        } catch (err) {
            console.error('Failed to post project to backend', err);
            // If it's a security threat, apiClient already showed the modal.
            if (err.isSecurityThreat) return;
        }

        // Also add it locally for quick rendering without backend issues
        const newProject = {
            id: Date.now(),
            ...payload,
            category: document.getElementById('p-category').value,
            tech: payload.techStack,
            image: currentImageData,
            github_url: payload.githubLink,
            progress: parseInt(document.getElementById('p-progress').value) || 0,
            contributors: 1,
            stars: "0",
            creator: creatorName,
            maintainers: maintainers
        };

        const storedProjects = localStorage.getItem('user_added_projects');
        let projectsList = storedProjects ? JSON.parse(storedProjects) : [];
        
        projectsList.push(newProject);
        localStorage.setItem('user_added_projects', JSON.stringify(projectsList));

        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = "Project Launched! 🚀";
        submitBtn.style.background = "#0C6A6E";

        setTimeout(() => {
            if (window.CodeCollabSecurity && typeof window.CodeCollabSecurity.requireAuth === 'function') {
                window.CodeCollabSecurity.requireAuth();
            }
            window.location.href = "../index.html";
        }, 1500);
    });
});
