/**
 * API Configuration
 * Backend: https://chat.ndum.ch/api/v1
 */

export const API_CONFIG = {
    // Base URLs
    BASE_URL: 'https://chat.ndum.ch/api/v1',
    WS_URL: 'wss://chat.ndum.ch',

    // API Endpoints
    ENDPOINTS: {
        // Auth
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',

        // Users
        USERS: '/users',
        USER_BY_ID: (id) => `/users/${id}`,
        UPDATE_USER: (id) => `/users/${id}`,
        DELETE_USER: (id) => `/users/${id}`,

        // Messages
        MESSAGES: '/messages',
        MESSAGE_BY_ID: (id) => `/messages/${id}`,
        UPDATE_MESSAGE: (id) => `/messages/${id}`,
        DELETE_MESSAGE: (id) => `/messages/${id}`,
    },

    // WebSocket Events
    WS_EVENTS: {
        // Receive
        MESSAGE: 'new_message',
        USER_JOINED: 'new_login',
        USER_LEFT: 'deleted_user',
        USER_UPDATED: 'changed_user',
        TYPING: 'typing',

        // Send
        SEND_MESSAGE: 'message',
        START_TYPING: 'start_typing',
        STOP_TYPING: 'stop_typing',
    },

    // Request Configuration
    TIMEOUT: 10000,

    // Storage Keys
    STORAGE: {
        TOKEN: 'livechat_token',
        USER_ID: 'livechat_user_id',
        USER_DATA: 'livechat_user_data',
    },
};

export default API_CONFIG;
