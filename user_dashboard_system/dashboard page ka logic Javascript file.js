/* 
   File: dashboard page ka logic Javascript file.js
   Description: Logic for managing user join requests and dashboard stats
*/

// Initial Mock Data for Join Requests (This would normally come from a database)
let joinRequests = [
    { id: 101, project: "SwiftTrack Logistics", date: "2026-04-05", status: "Accepted" },
    { id: 102, project: "EcoPulse AI", date: "2026-04-09", status: "Pending" },
    { id: 103, project: "SecurePass Vault", date: "2026-03-25", status: "Rejected" }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Profile
    const storedProfile = localStorage.getItem('codecollab_user_profile');
    if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        document.getElementById('user-name').textContent = profile.name || 'Student';
        document.getElementById('user-bio').textContent = profile.bio || 'Pro Contributor';
        document.getElementById('user-avatar').src = profile.avatar || 'https://i.pravatar.cc/150?u=4';
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
    const acceptedCount = joinRequests.filter(r => r.status === 'Accepted').length;

    document.getElementById('total-req').textContent = totalRequests;
    document.getElementById('pending-req').textContent = pendingCount;
    document.getElementById('accepted-req').textContent = acceptedCount;

    // Render Table
    const tableBody = document.getElementById('requests-table-body');
    tableBody.innerHTML = '';

    joinRequests.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(req => {
        const tr = document.createElement('tr');
        tr.className = 'fade-in';
        
        const statusClass = `status-${req.status.toLowerCase()}`;
        
        tr.innerHTML = `
            <td>${req.project}</td>
            <td>${req.date}</td>
            <td><span class="status-pill ${statusClass}">${req.status}</span></td>
            <td>
                <button class="view-btn" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="alert('Viewing original request details...')">Manage</button>
            </td>
        `;
        tableBody.appendChild(tr);
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
