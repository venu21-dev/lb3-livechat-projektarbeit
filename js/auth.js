/**
 * Authentication Module
 * Handles user authentication (login, register, logout)
 */

import * as API from './api.js';
import { showError, hideError, showSuccess, setButtonLoading, isValidEmail, validatePassword } from './utils.js';

/**
 * Initialize authentication event listeners
 */
export function initAuth() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // View switchers
    const showRegisterBtn = document.getElementById('show-register');
    const showLoginBtn = document.getElementById('show-login');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('register');
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('login');
        });
    }
}

/**
 * Switch between login and register views
 * @param {string} view - 'login' or 'register'
 */
function switchView(view) {
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    
    if (view === 'register') {
        loginView.classList.remove('active');
        registerView.classList.add('active');
    } else {
        registerView.classList.remove('active');
        loginView.classList.add('active');
    }
    
    // Clear forms and errors
    hideError('login-error');
    hideError('register-error');
}

/**
 * Handle login form submission
 * @param {Event} e - Form submit event
 */
async function handleLogin(e) {
    e.preventDefault();
    hideError('login-error');
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const username = form.username.value.trim();
    const password = form.password.value;
    
    // Validation
    if (!username || !password) {
        showError('login-error', 'Bitte alle Felder ausfüllen');
        return;
    }
    
    // Set loading state
    setButtonLoading(submitBtn, true);
    
    try {
        // Call API
        const response = await API.login({ username, password });
        
        // Backend returns { userId, token } not { user, token }
        // Build user object from response
        const userData = {
            id: response.userId,
            username: username
        };
        
        // Save auth data
        API.saveAuthData(response.token, userData);
        
        // Show success message
        showSuccess('login-error', '✓ Anmeldung erfolgreich!');
        
        // Redirect to chat after short delay
        setTimeout(() => {
            window.location.hash = '#chat';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showError('login-error', error.message || 'Login fehlgeschlagen. Bitte versuche es erneut.');
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Handle register form submission
 * @param {Event} e - Form submit event
 */
async function handleRegister(e) {
    e.preventDefault();
    hideError('register-error');
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const username = form.username.value.trim();
    const password = form.password.value;
    const passwordConfirm = form.password_confirm.value;
    
    // Validation
    if (!username || !password || !passwordConfirm) {
        showError('register-error', 'Bitte alle Felder ausfüllen');
        return;
    }
    
    if (username.length < 3) {
        showError('register-error', 'Benutzername muss mindestens 3 Zeichen lang sein');
        return;
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError('register-error', passwordValidation.message);
        return;
    }
    
    if (password !== passwordConfirm) {
        showError('register-error', 'Passwörter stimmen nicht überein');
        return;
    }
    
    // Set loading state
    setButtonLoading(submitBtn, true);
    
    try {
        // Call API - Backend expects only username and password
        const registerResponse = await API.register({ username, password });
        
        // Backend only returns {success: true}, no token!
        // So we need to login immediately after registration
        if (registerResponse.success) {
            // Auto-login after successful registration
            const loginResponse = await API.login({ username, password });
            
            // Backend returns { userId, token }
            const userData = {
                id: loginResponse.userId,
                username: username
            };
            
            // Save auth data
            API.saveAuthData(loginResponse.token, userData);
            
            // Show success message
            showSuccess('register-error', '✓ Konto erfolgreich erstellt!');
            
            // Redirect to chat after short delay
            setTimeout(() => {
                window.location.hash = '#chat';
            }, 1500);
        } else {
            throw new Error('Registrierung fehlgeschlagen');
        }
        
    } catch (error) {
        console.error('Register error:', error);
        showError('register-error', error.message || 'Registrierung fehlgeschlagen. Bitte versuche es erneut.');
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Logout user
 */
export function logout() {
    // Clear auth data
    API.clearAuthData();
    
    // Redirect to login
    window.location.hash = '#login';
    
    // Reload page to reset state
    window.location.reload();
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return API.isAuthenticated();
}

/**
 * Get current user data
 * @returns {object|null} User data
 */
export function getCurrentUser() {
    return API.getStoredUser();
}

export default {
    initAuth,
    logout,
    isAuthenticated,
    getCurrentUser,
};