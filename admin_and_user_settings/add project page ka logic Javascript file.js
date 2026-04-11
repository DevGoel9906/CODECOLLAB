/* 
   File: add project page ka logic Javascript file.js
   Description: Handle project submission and local storage updates
*/

document.addEventListener('DOMContentLoaded', () => {
    const previewImg = document.getElementById('preview-img');
    const previewSpan = document.querySelector('#image-preview span');
    const imageUrlInput = document.getElementById('p-image');

    // 1. Live Image Preview
    imageUrlInput.addEventListener('input', (e) => {
        if (e.target.value) {
            previewImg.src = e.target.value;
            previewImg.style.display = 'block';
            previewSpan.style.display = 'none';
        } else {
            previewImg.style.display = 'none';
            previewSpan.style.display = 'block';
        }
    });

    // 2. Form Submission
    document.getElementById('add-project-form').addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect Data
        const newProject = {
            id: Date.now(), // Unique ID based on timestamp
            title: document.getElementById('p-title').value,
            category: document.getElementById('p-category').value,
            tech: document.getElementById('p-tech').value.split(',').map(t => t.trim()),
            image: document.getElementById('p-image').value,
            github_url: document.getElementById('p-github').value,
            description: document.getElementById('p-desc').value,
            progress: parseInt(document.getElementById('p-progress').value) || 0,
            contributors: 1, // Start with 1 (the creator)
            stars: "0"       // Initial stars
        };

        // Save to LocalStorage
        const storedProjects = localStorage.getItem('user_added_projects');
        let projectsList = storedProjects ? JSON.parse(storedProjects) : [];
        
        projectsList.push(newProject);
        localStorage.setItem('user_added_projects', JSON.stringify(projectsList));

        // Feedback and Redirect
        const submitBtn = document.querySelector('.btn-submit');
        submitBtn.textContent = "Project Launched! 🚀";
        submitBtn.style.background = "#0C6A6E";

        setTimeout(() => {
            window.location.href = "../code collab main page.html";
        }, 1500);
    });
});
