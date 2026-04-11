/* 
   File: user profile editor page ka logic Javascript file.js
   Description: Logic for updating user information and saving to localStorage
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load existing profile data
    const storedProfile = localStorage.getItem('codecollab_user_profile');
    if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        document.getElementById('display-name').value = profile.name || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('avatar-url').value = profile.avatar || '';
        document.getElementById('preview-img').src = profile.avatar || 'https://i.pravatar.cc/150?u=4';
    }

    // 2. Add New Profile Logic (Clears form)
    document.getElementById('add-new-profile-btn').addEventListener('click', () => {
        document.getElementById('profile-form').reset();
        document.getElementById('preview-img').src = 'https://i.pravatar.cc/150?u=4';
        alert("Enter details for your new profile and click Save!");
    });

    // 3. Avatar Preview Logic
    document.getElementById('avatar-url').addEventListener('input', (e) => {
        document.getElementById('preview-img').src = e.target.value || 'https://i.pravatar.cc/150?u=4';
    });

    // 4. Save Logic
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const profileData = {
            name: document.getElementById('display-name').value,
            bio: document.getElementById('bio').value,
            avatar: document.getElementById('avatar-url').value || 'https://i.pravatar.cc/150?u=4'
        };

        localStorage.setItem('codecollab_user_profile', JSON.stringify(profileData));
        
        // Visual Feedback
        const btn = document.querySelector('.btn-save');
        btn.textContent = "Profile Saved! ✅";
        btn.style.background = "#0C6A6E";

        setTimeout(() => {
            btn.textContent = "Save Changes";
            btn.style.background = "#4FC3B3";
            window.location.href = "../user_dashboard_system/dashboard page.html";
        }, 1500);
    });
});
