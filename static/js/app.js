// Global variables
let currentUser = null;
let currentToken = null;
let editingSubjectId = null;

// DOM elements
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const forgotModal = document.getElementById('forgot-modal');
const subjectModal = document.getElementById('subject-modal');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is already logged in
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        currentToken = token;
        // Verify token is still valid
        fetch('/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Token invalid');
            }
        })
        .then(data => {
            currentUser = data;
            showDashboard();
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            showLoginModal();
        });
    } else {
        showLoginModal();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('dashboard-btn').addEventListener('click', showDashboard);
    document.getElementById('profile-btn').addEventListener('click', showProfile);
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('forgot-form').addEventListener('submit', handleForgotPassword);
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('subject-form').addEventListener('submit', handleSubjectSubmit);

    // Modal controls
    document.getElementById('show-register').addEventListener('click', showRegisterModal);
    document.getElementById('show-login').addEventListener('click', showLoginModal);
    document.getElementById('show-forgot').addEventListener('click', showForgotModal);
    document.querySelector('.close-register').addEventListener('click', showLoginModal);
    document.querySelector('.close-forgot').addEventListener('click', showLoginModal);

    // Subject modal
    document.getElementById('add-subject-btn').addEventListener('click', () => showSubjectModal());
    document.querySelector('.close').addEventListener('click', () => hideSubjectModal());
    
    // Profile edit
    document.getElementById('edit-profile-btn').addEventListener('click', showProfileEdit);
    document.getElementById('cancel-edit-btn').addEventListener('click', hideProfileEdit);
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            currentToken = data.token;
            localStorage.setItem('token', data.token);
            
            // Clear login form
            document.getElementById('login-form').reset();
            
            // Fetch user profile data
            fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${data.token}` }
            })
            .then(response => response.json())
            .then(user => {
                currentUser = user;
                showDashboard();
            })
            .catch(error => {
                console.error('Profile fetch error:', error);
                showDashboard();
            });
        } else {
            showAlert(data.message || 'Login failed', 'error');
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        showAlert('Login failed', 'error');
    });
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => response.json())
    .then(data => {
        showAlert(data.message || 'Registration successful', 'success');
        showLoginModal();
    })
    .catch(error => {
        console.error('Register error:', error);
        showAlert('Registration failed', 'error');
    });
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;

    fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        showAlert(data.message || 'Reset link sent', 'success');
        showLoginModal();
    })
    .catch(error => {
        console.error('Forgot password error:', error);
        showAlert('Failed to send reset link', 'error');
    });
}

function logout() {
    if (currentToken) {
        // Call backend logout endpoint
        fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        })
        .catch(error => console.error('Logout error:', error));
    }
    
    localStorage.removeItem('token');
    currentToken = null;
    currentUser = null;
    
    // Clear forms
    document.getElementById('login-form').reset();
    document.getElementById('register-form').reset();
    document.getElementById('profile-form').reset();
    document.getElementById('forgot-form').reset();
    
    showLoginModal();
}

// UI functions
function showDashboard() {
    document.getElementById('dashboard-section').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('dashboard-btn').classList.add('active');
    document.getElementById('profile-btn').classList.remove('active');
    document.getElementById('login-modal').style.display = 'none';
    document.getElementById('register-modal').style.display = 'none';
    document.getElementById('forgot-modal').style.display = 'none';
    document.querySelector('header').style.display = 'block';
    document.querySelector('nav').style.display = 'flex';

    loadSubjects();
    loadUserProfile();
}

function showProfile() {
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('dashboard-btn').classList.remove('active');
    document.getElementById('profile-btn').classList.add('active');

    loadUserProfile();
}

function showLoginModal() {
    loginModal.style.display = 'block';
    registerModal.style.display = 'none';
    forgotModal.style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'none';
    document.getElementById('profile-section').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
}

function showRegisterModal() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'block';
    forgotModal.style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
}

function showForgotModal() {
    loginModal.style.display = 'none';
    registerModal.style.display = 'none';
    forgotModal.style.display = 'block';
    document.querySelector('header').style.display = 'none';
    document.querySelector('nav').style.display = 'none';
}

function showSubjectModal(subject = null) {
    const modal = document.getElementById('subject-modal');
    const form = document.getElementById('subject-form');
    const title = document.getElementById('modal-title');

    if (subject) {
        title.textContent = 'Edit Subject';
        document.getElementById('section-code').value = subject.section_code;
        document.getElementById('description').value = subject.description;
        document.getElementById('units').value = subject.units;
        document.getElementById('subject-image').required = false;
        editingSubjectId = subject.id;
    } else {
        title.textContent = 'Add Subject';
        form.reset();
        document.getElementById('subject-image').required = true;
        editingSubjectId = null;
    }

    modal.style.display = 'block';
}

function hideSubjectModal() {
    document.getElementById('subject-modal').style.display = 'none';
}

function showProfileEdit() {
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById('profile-edit').style.display = 'block';
}

function hideProfileEdit() {
    document.getElementById('profile-view').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    document.getElementById('profile-form').reset();
    loadUserProfile();
}

// API functions
function loadSubjects() {
    fetch('/api/subjects', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
    })
    .then(response => response.json())
    .then(subjects => {
        displaySubjects(subjects);
    })
    .catch(error => {
        console.error('Load subjects error:', error);
        showAlert('Failed to load subjects', 'error');
    });
}

function loadUserProfile() {
    fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
    })
    .then(response => response.json())
    .then(user => {
        currentUser = user;
        document.getElementById('username-display').textContent = user.username;
        
        // Update profile view section
        document.getElementById('profile-display-username').textContent = user.username;
        document.getElementById('profile-display-email').textContent = user.email;
        
        // Update profile edit form
        document.getElementById('profile-username').value = user.username;
        document.getElementById('profile-email').value = user.email;
        
        // Set profile picture
        const profilePicImg = document.getElementById('profile-display-pic');
        const profilePicPlaceholder = document.getElementById('profile-pic-placeholder');
        
        if (user.profile_pic) {
            profilePicImg.src = '/uploads/' + user.profile_pic;
            profilePicImg.style.display = 'block';
            profilePicPlaceholder.style.display = 'none';
        } else {
            profilePicImg.src = '';
            profilePicImg.style.display = 'none';
            profilePicPlaceholder.style.display = 'flex';
        }
    })
    .catch(error => {
        console.error('Load profile error:', error);
    });
}

function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('username', document.getElementById('profile-username').value);
    formData.append('email', document.getElementById('profile-email').value);

    const profilePic = document.getElementById('profile-pic').files[0];
    if (profilePic) {
        formData.append('profile_pic', profilePic);
    }

    fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showAlert(data.message || 'Profile updated', 'success');
        hideProfileEdit();
        loadUserProfile();
    })
    .catch(error => {
        console.error('Profile update error:', error);
        showAlert('Failed to update profile', 'error');
    });
}

function handleSubjectSubmit(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('section_code', document.getElementById('section-code').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('units', document.getElementById('units').value);

    const image = document.getElementById('subject-image').files[0];
    if (image) {
        formData.append('image', image);
    }

    const url = editingSubjectId ? `/api/subjects/${editingSubjectId}` : '/api/subjects';
    const method = editingSubjectId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        showAlert(data.message || 'Subject saved', 'success');
        hideSubjectModal();
        loadSubjects();
    })
    .catch(error => {
        console.error('Subject save error:', error);
        showAlert('Failed to save subject', 'error');
    });
}

function deleteSubject(id) {
    if (confirm('Are you sure you want to delete this subject?')) {
        fetch(`/api/subjects/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentToken}` }
        })
        .then(response => response.json())
        .then(data => {
            showAlert(data.message || 'Subject deleted', 'success');
            loadSubjects();
        })
        .catch(error => {
            console.error('Delete subject error:', error);
            showAlert('Failed to delete subject', 'error');
        });
    }
}

// UI helper functions
function displaySubjects(subjects) {
    const container = document.getElementById('subjects-list');
    container.innerHTML = '';

    subjects.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'subject-card';

        card.innerHTML = `
            <h3>${subject.section_code}</h3>
            <p><strong>Description:</strong> ${subject.description}</p>
            <p><strong>Units:</strong> ${subject.units}</p>
            ${subject.image ? `<img src="/uploads/${subject.image}" alt="${subject.section_code}">` : ''}
            <div class="subject-actions">
                <button class="edit-btn" onclick="showSubjectModal(${JSON.stringify(subject).replace(/"/g, '&quot;')})">Edit</button>
                <button class="delete-btn" onclick="deleteSubject(${subject.id})">Delete</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}