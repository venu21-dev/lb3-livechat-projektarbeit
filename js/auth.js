/**
 * Authentication Module
 * Handles login, registration, and session management
 */

import * as API from './api.js';

/**
 * Show error message
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

/**
 * Hide error message
 */
function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

/**
 * Handle login form submission
 */
export async function handleLogin(event) {
    event.preventDefault();
    hideError('login-error');

    const form = event.target;
    const username = form.querySelector('#login-username').value.trim();
    const password = form.querySelector('#login-password').value;

    if (!username || !password) {
        showError('login-error', 'Bitte fülle alle Felder aus');
        return;
    }

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Anmeldung läuft...';

        await API.login(username, password);

        // Redirect to chat
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', error.message || 'Fehler bei der Anmeldung');

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Anmelden';
    }
}

/**
 * Handle registration form submission
 */
export async function handleRegister(event) {
    event.preventDefault();
    hideError('register-error');

    const form = event.target;
    const username = form.querySelector('#register-username').value.trim();
    const email = form.querySelector('#register-email').value.trim();
    const password = form.querySelector('#register-password').value;

    if (!username || !email || !password) {
        showError('register-error', 'Bitte fülle alle Felder aus');
        return;
    }

    if (username.length < 3) {
        showError('register-error', 'Benutzername muss mindestens 3 Zeichen lang sein');
        return;
    }

    if (password.length < 6) {
        showError('register-error', 'Passwort muss mindestens 6 Zeichen lang sein');
        return;
    }

    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registrierung läuft...';

        await API.register(username, password, email);

        // Auto-login after registration
        await API.login(username, password);

        // Redirect to chat
        window.location.href = 'index.html';

    } catch (error) {
        console.error('Registration error:', error);
        showError('register-error', error.message || 'Fehler bei der Registrierung');

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Registrieren';
    }
}

/**
 * Logout user
 */
export function logout() {
    API.clearAuthData();
    window.location.href = 'index.html';
}

/**
 * Check authentication and redirect if needed
 */
export function requireAuth() {
    if (!API.isAuthenticated()) {
        // User not logged in, show auth page
        return false;
    }
    return true;
}

/**
 * Setup form switching (Login <-> Register)
 */
export function setupFormSwitching() {
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');

    if (showRegisterBtn && showLoginBtn && loginSection && registerSection) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
            hideError('login-error');
        });

        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
            hideError('register-error');
        });
    }
}

/**
 * Initialize authentication
 */
export function initAuth() {
    // Setup form switching
    setupFormSwitching();

    // Setup login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Setup register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

export default {
    handleLogin,
    handleRegister,
    logout,
    requireAuth,
    initAuth,
};
