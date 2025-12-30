/**
 * API Service
 * Handles all HTTP requests to backend
 */

import API_CONFIG from '../config/api.config.js';

/**
 * Base fetch wrapper with error handling
 */
async function request(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Get stored token
 */
export function getToken() {
    return localStorage.getItem(API_CONFIG.STORAGE.TOKEN);
}

/**
 * Get stored user
 */
export function getStoredUser() {
    const userData = localStorage.getItem(API_CONFIG.STORAGE.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Save auth data
 */
export function saveAuthData(token, user) {
    localStorage.setItem(API_CONFIG.STORAGE.TOKEN, token);
    localStorage.setItem(API_CONFIG.STORAGE.USER_ID, user.id || user._id);
    localStorage.setItem(API_CONFIG.STORAGE.USER_DATA, JSON.stringify(user));
}

/**
 * Clear auth data
 */
export function clearAuthData() {
    localStorage.removeItem(API_CONFIG.STORAGE.TOKEN);
    localStorage.removeItem(API_CONFIG.STORAGE.USER_ID);
    localStorage.removeItem(API_CONFIG.STORAGE.USER_DATA);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
    return !!getToken();
}

// ============================================
// AUTH ENDPOINTS
// ============================================

/**
 * Register new user
 */
export async function register(username, password, email) {
    const response = await request(API_CONFIG.ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify({ username, password, email }),
    });

    return response;
}

/**
 * Login user
 */
export async function login(username, password) {
    const response = await request(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (response.token && response.user) {
        saveAuthData(response.token, response.user);
    }

    return response;
}

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * Get all users
 */
export async function getUsers() {
    return await request(API_CONFIG.ENDPOINTS.USERS, {
        method: 'GET',
    });
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
    return await request(API_CONFIG.ENDPOINTS.USER_BY_ID(id), {
        method: 'GET',
    });
}

/**
 * Update user
 */
export async function updateUser(id, data) {
    const token = getToken();

    return await request(API_CONFIG.ENDPOINTS.UPDATE_USER(id), {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
    });
}


// ============================================
// MESSAGE ENDPOINTS
// ============================================

/**
 * Get all messages
 */
export async function getMessages() {
    return await request(API_CONFIG.ENDPOINTS.MESSAGES, {
        method: 'GET',
    });
}

/**
 * Get message by ID
 */
export async function getMessageById(id) {
    return await request(API_CONFIG.ENDPOINTS.MESSAGE_BY_ID(id), {
        method: 'GET',
    });
}

/**
 * Send message
 */
export async function sendMessage(receiverId, text) {
    const token = getToken();

    return await request(API_CONFIG.ENDPOINTS.MESSAGES, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            message: text
        }),
    });
}

/**
 * Update message
 */
export async function updateMessage(id, text) {
    const token = getToken();

    return await request(API_CONFIG.ENDPOINTS.UPDATE_MESSAGE(id), {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
    });
}

/**
 * Delete message
 */
export async function deleteMessage(id) {
    const token = getToken();

    return await request(API_CONFIG.ENDPOINTS.DELETE_MESSAGE(id), {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
}

export default {
    // Auth
    register,
    login,
    isAuthenticated,
    getToken,
    getStoredUser,
    saveAuthData,
    clearAuthData,

    // Users
    getUsers,
    getUserById,
    updateUser,

    // Messages
    getMessages,
    getMessageById,
    sendMessage,
    updateMessage,
    deleteMessage,
};