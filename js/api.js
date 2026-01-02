/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import API_CONFIG from '../config/api.config.js';

/**
 * Get stored JWT token
 * @returns {string|null} JWT token
 */
export function getToken() {
    return localStorage.getItem(API_CONFIG.STORAGE.TOKEN);
}

/**
 * Get user-friendly error message based on status code and endpoint
 * @param {number} status - HTTP status code
 * @param {string} endpoint - API endpoint
 * @param {string} defaultMessage - Default error message from server
 * @returns {string} User-friendly error message
 */
function getUserFriendlyError(status, endpoint, defaultMessage) {
    // Check if it's a login endpoint
    if (endpoint.includes('/login')) {
        if (status === 401) {
            return 'Falscher Benutzername oder Passwort';
        }
        if (status === 404) {
            return 'Benutzer nicht gefunden';
        }
    }
    
    // Check if it's a register endpoint
    if (endpoint.includes('/register')) {
        if (status === 409) {
            return 'Benutzername bereits vergeben';
        }
        if (status === 400) {
            return 'Ungültige Eingabe. Bitte überprüfe deine Daten';
        }
    }
    
    // Check if it's a user update endpoint
    if (endpoint.includes('/user') && endpoint.includes('PUT')) {
        if (status === 409) {
            return 'Benutzername bereits vergeben';
        }
        if (status === 400) {
            return 'Ungültige Daten. Bitte überprüfe deine Eingabe';
        }
    }
    
    // General status codes
    switch (status) {
        case 400:
            return 'Ungültige Anfrage. Bitte überprüfe deine Eingabe';
        case 401:
            return 'Nicht autorisiert. Bitte melde dich erneut an';
        case 403:
            return 'Zugriff verweigert';
        case 404:
            return 'Ressource nicht gefunden';
        case 409:
            return 'Konflikt: Die Ressource existiert bereits';
        case 422:
            return 'Ungültige Daten';
        case 429:
            return 'Zu viele Anfragen. Bitte warte einen Moment';
        case 500:
            return 'Serverfehler. Bitte versuche es später erneut';
        case 502:
            return 'Server nicht erreichbar. Bitte versuche es später erneut';
        case 503:
            return 'Service vorübergehend nicht verfügbar';
        default:
            // If server provided a message, use it
            if (defaultMessage && !defaultMessage.includes('HTTP error!')) {
                return defaultMessage;
            }
            return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut';
    }
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const token = getToken();
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, config);
        
        // Parse response
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            // If JSON parsing fails, create a basic error object
            data = { message: null };
        }
        
        // Handle errors
        if (!response.ok) {
            const userFriendlyMessage = getUserFriendlyError(
                response.status,
                endpoint,
                data.message
            );
            throw new Error(userFriendlyMessage);
        }
        
        return data;
    } catch (error) {
        // Network errors (no response from server)
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('Network Error:', error);
            throw new Error('Keine Verbindung zum Server. Bitte überprüfe deine Internetverbindung');
        }
        
        console.error('API Request Error:', error);
        throw error;
    }
}

// ============================================
// AUTH API
// ============================================

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {Promise<object>} User and token
 */
export async function register(userData) {
    return apiRequest(API_CONFIG.ENDPOINTS.REGISTER, {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}

/**
 * Login user
 * @param {object} credentials - Login credentials
 * @returns {Promise<object>} User and token
 */
export async function login(credentials) {
    return apiRequest(API_CONFIG.ENDPOINTS.LOGIN, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

// ============================================
// USER API
// ============================================

/**
 * Get all users
 * @returns {Promise<array>} List of users
 */
export async function getUsers() {
    return apiRequest(API_CONFIG.ENDPOINTS.USERS, {
        method: 'GET',
    });
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User data
 */
export async function getUserById(userId) {
    return apiRequest(API_CONFIG.ENDPOINTS.USER_BY_ID(userId), {
        method: 'GET',
    });
}

/**
 * Update user
 * @param {string} userId - User ID
 * @param {object} userData - Updated user data
 * @returns {Promise<object>} Updated user
 */
export async function updateUser(userId, userData) {
    return apiRequest(API_CONFIG.ENDPOINTS.UPDATE_USER(userId), {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise<object>} Success message
 */
export async function deleteUser(userId) {
    return apiRequest(API_CONFIG.ENDPOINTS.DELETE_USER(userId), {
        method: 'DELETE',
    });
}

// ============================================
// MESSAGE API
// ============================================

/**
 * Get all messages
 * @param {object} params - Query parameters (optional)
 * @returns {Promise<array>} List of messages
 */
export async function getMessages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
        ? `${API_CONFIG.ENDPOINTS.MESSAGES}?${queryString}`
        : API_CONFIG.ENDPOINTS.MESSAGES;
    
    return apiRequest(endpoint, {
        method: 'GET',
    });
}

/**
 * Send a new message
 * @param {string} receiverId - Recipient user ID
 * @param {string} messageText - Message text
 * @returns {Promise<object>} Created message
 */
export async function sendMessage(receiverId, messageText) {
    // Backend expects: URL query param for receiver, body with {message: "text"}
    return apiRequest(`${API_CONFIG.ENDPOINTS.MESSAGES}?receiverId=${receiverId}`, {
        method: 'POST',
        body: JSON.stringify({ message: messageText }),
    });
}

/**
 * Get message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} Message data
 */
export async function getMessageById(messageId) {
    return apiRequest(API_CONFIG.ENDPOINTS.MESSAGE_BY_ID(messageId), {
        method: 'GET',
    });
}

/**
 * Update message
 * @param {string} messageId - Message ID
 * @param {object} messageData - Updated message data
 * @returns {Promise<object>} Updated message
 */
export async function updateMessage(messageId, messageData) {
    return apiRequest(API_CONFIG.ENDPOINTS.UPDATE_MESSAGE(messageId), {
        method: 'PUT',
        body: JSON.stringify(messageData),
    });
}

/**
 * Delete message
 * @param {string} messageId - Message ID
 * @returns {Promise<object>} Success message
 */
export async function deleteMessage(messageId) {
    return apiRequest(API_CONFIG.ENDPOINTS.DELETE_MESSAGE(messageId), {
        method: 'DELETE',
    });
}

// ============================================
// STORAGE HELPERS
// ============================================

/**
 * Save authentication data to localStorage
 * @param {string} token - JWT token
 * @param {object} user - User data
 */
export function saveAuthData(token, user) {
    localStorage.setItem(API_CONFIG.STORAGE.TOKEN, token);
    localStorage.setItem(API_CONFIG.STORAGE.USER_ID, user.id || user._id);
    localStorage.setItem(API_CONFIG.STORAGE.USER_DATA, JSON.stringify(user));
}

/**
 * Get stored user data
 * @returns {object|null} User data
 */
export function getStoredUser() {
    const userData = localStorage.getItem(API_CONFIG.STORAGE.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Get stored user ID
 * @returns {string|null} User ID
 */
export function getStoredUserId() {
    return localStorage.getItem(API_CONFIG.STORAGE.USER_ID);
}

/**
 * Clear authentication data
 */
export function clearAuthData() {
    localStorage.removeItem(API_CONFIG.STORAGE.TOKEN);
    localStorage.removeItem(API_CONFIG.STORAGE.USER_ID);
    localStorage.removeItem(API_CONFIG.STORAGE.USER_DATA);
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export function isAuthenticated() {
    return !!getToken();
}

export default {
    register,
    login,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getMessages,
    sendMessage,
    getMessageById,
    updateMessage,
    deleteMessage,
    saveAuthData,
    getStoredUser,
    getStoredUserId,
    getToken,
    clearAuthData,
    isAuthenticated,
};