// Main application logic and event handlers
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Supabase Auth Demo initialized');
    
    // Initialize authentication
    await initializeApp();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    try {
        // Set up auth state listener
        authManager.setupAuthListener();
        
        // Check for existing session
        showLoading(true);
        await authManager.getCurrentSession();
        authManager.updateUI();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        showMessage('Failed to initialize application. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    
    if (loginTab) loginTab.addEventListener('click', showLoginForm);
    if (signupTab) signupTab.addEventListener('click', showSignupForm);
    
    // Email login form
    const loginForm = document.getElementById('login-email-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleEmailLogin);
    }
    
    // Email signup form
    const signupForm = document.getElementById('signup-email-form');
    if (signupForm) {
        signupForm.addEventListener('submit', handleEmailSignup);
    }
    
    // Google authentication buttons
    const googleLoginBtn = document.getElementById('google-login');
    const googleSignupBtn = document.getElementById('google-signup');
    
    if (googleLoginBtn) googleLoginBtn.addEventListener('click', handleGoogleAuth);
    if (googleSignupBtn) googleSignupBtn.addEventListener('click', handleGoogleAuth);
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Refresh courses button
    const refreshCoursesBtn = document.getElementById('refresh-courses-btn');
    if (refreshCoursesBtn) {
        refreshCoursesBtn.addEventListener('click', handleRefreshCourses);
    }
    
    // Password confirmation validation
    const signupPassword = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-confirm-password');
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    if (signupPassword) {
        signupPassword.addEventListener('input', validatePasswordMatch);
    }
}

// Show login form
function showLoginForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    
    if (loginForm && signupForm && loginTab && signupTab) {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    }
    
    hideMessage();
}

// Show signup form
function showSignupForm() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    
    if (loginForm && signupForm && loginTab && signupTab) {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
    
    hideMessage();
}

// Handle email login
async function handleEmailLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    await authManager.signIn(email, password);
}

// Handle email signup
async function handleEmailSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    if (!email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    await authManager.signUp(email, password);
}

// Handle Google authentication
async function handleGoogleAuth(event) {
    event.preventDefault();
    await authManager.signInWithGoogle();
}

// Handle logout
async function handleLogout(event) {
    event.preventDefault();
    await authManager.signOut();
}

// Handle refresh courses
async function handleRefreshCourses(event) {
    event.preventDefault();
    await authManager.displayUserCourses(true); // Force refresh when button clicked
}

// Validate password match
function validatePasswordMatch() {
    const password = document.getElementById('signup-password');
    const confirmPassword = document.getElementById('signup-confirm-password');
    
    if (!password || !confirmPassword) return;
    
    if (confirmPassword.value && password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity('Passwords do not match');
    } else {
        confirmPassword.setCustomValidity('');
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        // Auto-hide success and info messages after 5 seconds
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                hideMessage();
            }, 5000);
        }
    }
}

function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.classList.add('hidden');
    }
}

// Export functions for global access
window.showLoginForm = showLoginForm;
window.showSignupForm = showSignupForm;

// Handle URL hash changes (for OAuth redirects)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
        console.log('OAuth redirect detected');
        // Supabase will automatically handle this
    }
});

// Handle page visibility changes to refresh session
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && authManager.user) {
        // Refresh session when page becomes visible (without forcing UI refresh)
        authManager.getCurrentSession();
    }
});

console.log('📱 App.js loaded successfully');