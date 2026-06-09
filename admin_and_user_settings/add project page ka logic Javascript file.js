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

    document.getElementById('add-project-form').addEventListener('submit', (e) => {
        e.preventDefault();
        hideError();

        if (!currentImageData) {
            showError('Please upload a project cover image (under 10MB).');
            return;
        }

        const creatorName = document.getElementById('p-creator').value;
        const newProject = {
            id: Date.now(),
            title: document.getElementById('p-title').value,
            category: document.getElementById('p-category').value,
            tech: document.getElementById('p-tech').value.split(',').map(t => t.trim()),
            image: currentImageData,
            github_url: document.getElementById('p-github').value,
            description: document.getElementById('p-desc').value,
            progress: parseInt(document.getElementById('p-progress').value) || 0,
            contributors: 1,
            stars: "0",
            creator: creatorName
        };

        const storedProjects = localStorage.getItem('user_added_projects');
        let projectsList = storedProjects ? JSON.parse(storedProjects) : [];
        
        projectsList.push(newProject);
        localStorage.setItem('user_added_projects', JSON.stringify(projectsList));

        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = "Project Launched! 🚀";
        submitBtn.style.background = "#0C6A6E";

        setTimeout(() => {
            window.location.href = "../code collab main page.html";
        }, 1500);
    });
});
