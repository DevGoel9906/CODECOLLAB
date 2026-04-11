/* 
   File: project management page ka logic Javascript file.js
   Description: Logic for approving/rejecting join requests as an admin
*/

document.addEventListener('DOMContentLoaded', () => {
    loadRequests();
});

function loadRequests() {
    const listElement = document.getElementById('request-list');
    const stored = localStorage.getItem('codecollab_requests');
    let requests = stored ? JSON.parse(stored) : [];

    // Filter to show only pending requests for management
    const pending = requests.filter(r => r.status === 'Pending');

    if (pending.length === 0) {
        listElement.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No pending requests to manage.</p>';
        return;
    }

    listElement.innerHTML = '';
    
    pending.forEach(req => {
        const div = document.createElement('div');
        div.className = 'request-item';
        div.innerHTML = `
            <div class="user-info">
                <div class="avatar"></div>
                <div>
                    <h4 style="color: var(--text-main);">Student User</h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Applied for: <b>${req.project}</b></p>
                </div>
            </div>
            <div class="actions">
                <button class="btn btn-approve" onclick="handleAction(${req.id}, 'Accepted')">Approve</button>
                <button class="btn btn-reject" onclick="handleAction(${req.id}, 'Rejected')">Reject</button>
            </div>
        `;
        listElement.appendChild(div);
    });
}

function handleAction(requestId, newStatus) {
    const stored = localStorage.getItem('codecollab_requests');
    let requests = stored ? JSON.parse(stored) : [];

    const index = requests.findIndex(r => r.id === requestId);
    if (index !== -1) {
        requests[index].status = newStatus;
        localStorage.setItem('codecollab_requests', JSON.stringify(requests));
        alert(`Request ${newStatus}!`);
        loadRequests(); // Refresh list
    }
}
