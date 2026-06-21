/* 
   File: auth.js
   Description: Client-side routing, submission, and validation for CodeCollab authentication
*/

document.addEventListener('DOMContentLoaded', () => {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showSignin = document.getElementById('show-signin');
    const authTitleDesc = document.getElementById('auth-title-desc');
    const alertBox = document.getElementById('auth-alert');

    // ── Toggle Form Modes ─────────────────────────────────────────────────────
    showSignup.addEventListener('click', () => {
        signinForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        authTitleDesc.textContent = 'Create your CodeCollab workspace profile';
        clearAlert();
    });

    showSignin.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        signinForm.classList.remove('hidden');
        authTitleDesc.textContent = 'Join the student open-source workspace';
        clearAlert();
    });

    // ── Alerts helper ─────────────────────────────────────────────────────────
    function showAlert(message, type = 'error') {
        alertBox.textContent = message;
        alertBox.className = `alert alert-${type}`;
        alertBox.style.display = 'block';
    }

    function clearAlert() {
        alertBox.textContent = '';
        alertBox.style.display = 'none';
        alertBox.className = 'alert';
    }

    // ── Validation Helpers ────────────────────────────────────────────────────
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    function validatePasswordStrength(pwd) {
        const issues = [];
        if (pwd.length < 8) issues.push("at least 8 characters");
        if (!/[A-Z]/.test(pwd)) issues.push("one uppercase letter");
        if (!/[0-9]/.test(pwd)) issues.push("one number");
        if (!/[^A-Za-z0-9]/.test(pwd)) issues.push("one special character");
        return issues;
    }

    // ── Sign In Submission ────────────────────────────────────────────────────
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;

        if (!validateEmail(email)) {
            showAlert("Please enter a valid email address in the format name@example.com.", "error");
            return;
        }

        try {
            const response = await window.apiClient.post('/auth/login', { email, password });
            if (response.success && response.data) {
                // Initialize user session
                localStorage.setItem('token', response.token);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('name', response.data.name);
                localStorage.setItem('email', response.data.email);
                localStorage.setItem('role', response.data.role);

                showAlert("Logged in successfully. Redirecting...", "success");
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            if (err.isSecurityThreat) return; // handled by global client warning modal
            
            // Map bad credentials response to friendly error message
            if (err.status === 401) {
                showAlert("Unable to sign in. Please check your email and password and try again.", "error");
            } else if (err.status === 429) {
                showAlert("Too many authentication attempts. Please try again in 15 minutes.", "error");
            } else {
                showAlert("We couldn't connect to the server right now. Please check your internet connection and try again.", "error");
            }
        }
    });

    // ── Sign Up Submission ────────────────────────────────────────────────────
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();

        const name = document.getElementById('signup-name').value.trim();
        const username = document.getElementById('signup-username').value.trim();
        const role = document.getElementById('signup-role').value;
        const email = document.getElementById('signup-email').value.trim();
        const github = document.getElementById('signup-github').value.trim();
        const linkedin = document.getElementById('signup-linkedin').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Perform rigorous UI field validation
        if (name.length < 2) {
            showAlert("Please enter your full name so others can identify you.", "error");
            return;
        }

        if (!validateEmail(email)) {
            showAlert("Please enter a valid email address in the format name@example.com.", "error");
            return;
        }

        if (github && !github.startsWith('https://')) {
            showAlert("GitHub URL must be a valid HTTPS URL (e.g. https://github.com/username).", "error");
            return;
        }

        if (linkedin && !linkedin.startsWith('https://')) {
            showAlert("LinkedIn URL must be a valid HTTPS URL (e.g. https://linkedin.com/in/username).", "error");
            return;
        }

        const passwordIssues = validatePasswordStrength(password);
        if (passwordIssues.length > 0) {
            showAlert(`Password is too weak. It must contain ${passwordIssues.join(', ')}.`, "error");
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Passwords do not match. Please verify both password entries.", "error");
            return;
        }

        const payload = {
            name,
            role,
            email,
            password,
            confirmPassword
        };
        if (username) payload.username = username;
        if (github) payload.github = github;
        if (linkedin) payload.linkedin = linkedin;

        try {
            const response = await window.apiClient.post('/auth/register', payload);
            if (response.success && response.data) {
                // Initialize session
                localStorage.setItem('token', response.token);
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('name', response.data.name);
                localStorage.setItem('email', response.data.email);
                localStorage.setItem('role', response.data.role);

                showAlert("Account created successfully. Configuring workspace...", "success");
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        } catch (err) {
            console.error(err);
            if (err.isSecurityThreat) return;

            if (err.status === 409) {
                showAlert("An account with this email already exists. Try signing in instead.", "error");
            } else if (err.status === 420 || err.status === 400) {
                showAlert(err.message || "Please review your inputs and try again.", "error");
            } else if (err.status === 429) {
                showAlert("Too many authentication attempts. Please try again in 15 minutes.", "error");
            } else {
                showAlert("We couldn't connect to the server right now. Please check your internet connection and try again.", "error");
            }
        }
    });
});
