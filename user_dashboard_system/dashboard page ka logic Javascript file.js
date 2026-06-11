/* 
   File: dashboard page ka logic Javascript file.js
   Description: Logic for managing user join requests and dashboard stats
*/

// Initial Mock Data for Join Requests (This would normally come from a database)
let joinRequests = [
    { id: 101, project: "SwiftTrack Logistics", date: "2026-04-05", status: "Ongoing" },
    { id: 102, project: "EcoPulse AI", date: "2026-04-09", status: "Pending" },
    { id: 103, project: "SecurePass Vault", date: "2026-03-25", status: "Completed" }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Profile
    const storedProfile = localStorage.getItem('codecollab_user_profile');
    if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        const bioEl = document.getElementById('user-bio');
        if (bioEl) bioEl.textContent = profile.bio || "Here's how your project collaborations are doing.";
    }

    // 2. Load Requests 
    const storedRequests = localStorage.getItem('codecollab_requests');
    if (storedRequests) {
        joinRequests = JSON.parse(storedRequests);
    }

    renderDashboard();
});

function renderDashboard() {
    // Update Stats
    const totalRequests = joinRequests.length;
    const pendingCount = joinRequests.filter(r => r.status === 'Pending').length;
    const acceptedCount = joinRequests.filter(r => r.status === 'Ongoing' || r.status === 'Completed').length;

    document.getElementById('total-req').textContent = totalRequests;
    document.getElementById('pending-req').textContent = pendingCount;
    document.getElementById('accepted-req').textContent = acceptedCount;

    // Render Cards
    const grid = document.getElementById('project-status-grid');
    if (!grid) return;
    grid.innerHTML = '';

    joinRequests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const card = document.createElement('div');
        card.className = 'glass-card fade-in';
        card.style.padding = '1.5rem';
        card.style.borderRadius = '15px';
        card.style.border = '1px solid var(--glass-border)';
        card.style.background = 'var(--glass)';
        
        let badgeColor = '#ffc107'; // pending
        if (req.status === 'Completed') badgeColor = '#28a745';
        else if (req.status === 'Ongoing') badgeColor = '#17a2b8';

        card.innerHTML = `
            <h3 style="margin-bottom: 0.5rem; font-size: 1.2rem;">${req.project}</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">Applied: ${req.date}</p>
            <div style="display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}50;">
                Status: ${req.status}
            </div>
            <button class="view-btn" style="margin-top: 1.5rem; width: 100%; padding: 0.6rem; font-size: 0.9rem;" onclick="alert('Viewing original request details...')">Manage</button>
        `;
        grid.appendChild(card);
    });
}

// Function to handle new join request from Project Detail Page
// This would be called by the Project Detail JS when user clicks "Join"
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
