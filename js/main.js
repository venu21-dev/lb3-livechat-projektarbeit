/**
 * LiveChat - Main Entry Point
 * M294 LB3 Project
 * Authors: Venu & Mathu
 */

import * as API from './api.js';
import * as Auth from './auth.js';

// Application state
const app = {
    initialized: false,
    currentPage: null,
    currentUser: null
};

/**
 * Show specific page
 */
function showPage(pageName) {
    // Hide all pages
    const pages = ['auth-page', 'chat-page'];
    pages.forEach(page => {
        const element = document.getElementById(page);
        if (element) element.classList.add('hidden');
    });

    // Show requested page
    const pageElement = document.getElementById(`${pageName}-page`);
    if (pageElement) {
        pageElement.classList.remove('hidden');
        app.currentPage = pageName;
    }

    // Hide loading screen
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

/**
 * Initialize application
 */
async function init() {
    console.log('🚀 LiveChat starting...');

    try {
        // Check if user is authenticated
        if (API.isAuthenticated()) {
            // User is logged in
            app.currentUser = API.getStoredUser();
            console.log('✅ User authenticated:', app.currentUser.username);

            // Show chat page
            showPage('chat');

            // Initialize chat
            const { default: chatManager } = await import('./chat.js');
            await chatManager.init();

            

        } else {
            // User not logged in, show auth page
            console.log('ℹ️ User not authenticated, showing login');
            showPage('auth');
        }

        // Initialize authentication
        Auth.initAuth();

        app.initialized = true;
        console.log('✅ LiveChat initialized');

    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

export default app;