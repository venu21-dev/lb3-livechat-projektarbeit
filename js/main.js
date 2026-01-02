/**
 * Main Application Entry Point
 * Initializes the application and handles routing
 */

import { initAuth, isAuthenticated } from './auth.js';
import chatManager from './chat.js';

class App {
    constructor() {
        this.currentView = null;
    }
    
    /**
     * Initialize application
     */
    init() {
        console.log('Initializing LiveChat application...');
        
        // Initialize auth
        initAuth();
        
        // Setup routing
        this.setupRouting();
        
        // Handle initial route
        this.handleRoute();
        
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
    }
    
    /**
     * Setup routing
     */
    setupRouting() {
        // Default route
        if (!window.location.hash) {
            window.location.hash = isAuthenticated() ? '#chat' : '#login';
        }
    }
    
    /**
     * Handle route changes
     */
    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        
        console.log('Routing to:', hash);
        
        // Check authentication for protected routes
        if (hash === 'chat' && !isAuthenticated()) {
            window.location.hash = '#login';
            return;
        }
        
        // Redirect to chat if logged in and trying to access login/register
        if ((hash === 'login' || hash === 'register') && isAuthenticated()) {
            window.location.hash = '#chat';
            return;
        }
        
        // Switch views
        await this.switchView(hash);
    }
    
    /**
     * Switch to a different view
     * @param {string} viewName - Name of the view
     */
    async switchView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show requested view
        let viewElement;
        
        switch (viewName) {
            case 'login':
                viewElement = document.getElementById('login-view');
                this.currentView = 'login';
                break;
                
            case 'register':
                viewElement = document.getElementById('register-view');
                this.currentView = 'register';
                break;
                
            case 'chat':
                viewElement = document.getElementById('chat-view');
                this.currentView = 'chat';
                
                // Initialize chat if not already initialized
                if (!chatManager.currentUser) {
                    await chatManager.init();
                }
                break;
                
            default:
                console.error('Unknown view:', viewName);
                window.location.hash = '#login';
                return;
        }
        
        if (viewElement) {
            viewElement.classList.add('active');
        }
    }
}

// Create and initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (chatManager) {
        chatManager.destroy();
    }
});
