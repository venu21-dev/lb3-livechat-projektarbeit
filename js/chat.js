/**
 * Chat Module
 * Handles chat UI and user list
 */

import * as API from './api.js';
import { logout } from './auth.js';
import {
    getInitials,
    getAvatarGradient,
    showError,
    hideError
} from './utils.js';

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.currentRecipient = null;
        this.users = [];
        this.messages = [];
    }

    /**
     * Initialize chat
     */
    async init() {
        this.currentUser = API.getStoredUser();

        if (!this.currentUser) {
            console.error('No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        // Set up UI
        this.setupUI();
        this.setupEventListeners();

        // Load initial data
        await this.loadUsers();
    }

    /**
     * Setup UI elements
     */
    setupUI() {
        // Update current user info
        const currentUserName = document.getElementById('current-user-name');
        const currentUserEmail = document.getElementById('current-user-email');
        const currentUserInitial = document.getElementById('current-user-initial');

        if (currentUserName) currentUserName.textContent = this.currentUser.username;
        if (currentUserEmail) currentUserEmail.textContent = this.currentUser.email || '';
        if (currentUserInitial) {
            currentUserInitial.textContent = getInitials(this.currentUser.username);
            const avatar = currentUserInitial.closest('.user-avatar');
            if (avatar) {
                avatar.style.background = getAvatarGradient(this.currentUser.username);
            }
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                logout();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                console.log('Settings clicked (TODO)');
            });
        }

        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
            });
        }
    }

    /**
     * Load all users
     */
    async loadUsers() {
        try {
            this.users = await API.getUsers();
            this.renderUserList();
        } catch (error) {
            console.error('Error loading users:', error);
            showError('chat-error', 'Fehler beim Laden der Benutzerliste');
        }
    }

    /**
     * Render user list in sidebar
     */
    renderUserList() {
        const userList = document.getElementById('user-list');
        const userCount = document.getElementById('user-count');

        if (!userList) return;

        // Filter out current user
        const otherUsers = this.users.filter(u =>
            (u.id || u._id) !== (this.currentUser.id || this.currentUser._id)
        );

        // Update count
        if (userCount) {
            userCount.textContent = otherUsers.length;
        }

        // Clear list
        userList.innerHTML = '';

        // Render users
        otherUsers.forEach(user => {
            const userItem = this.createUserItem(user);
            userList.appendChild(userItem);
        });
    }

    /**
     * Create user item element
     */
    createUserItem(user) {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.dataset.userId = user.id || user._id;

        const isActive = this.currentRecipient &&
            (user.id || user._id) === (this.currentRecipient.id || this.currentRecipient._id);

        if (isActive) {
            div.classList.add('active');
        }

        const initial = getInitials(user.username);
        const gradient = getAvatarGradient(user.username);

        div.innerHTML = `
            <div class="user-avatar" style="background: ${gradient};">
                <span>${initial}</span>
                <div class="status-indicator online"></div>
            </div>
            <div class="user-info">
                <div class="user-name">${user.username}</div>
                <div class="user-status">
                    <span class="status-dot online"></span>
                    <span class="status-text">Online</span>
                </div>
            </div>
            <svg class="arrow-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;

        div.addEventListener('click', () => {
            this.selectUser(user);
        });

        return div;
    }

    /**
     * Select a user to chat with
     */
    async selectUser(user) {
        this.currentRecipient = user;

        // Update active state in user list
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
        const userItem = document.querySelector(`[data-user-id="${user.id || user._id}"]`);
        if (userItem) {
            userItem.classList.add('active');
        }

        // Update chat header
        this.updateChatHeader(user);

        // Show chat UI
        this.showChatUI();

        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('hidden');
        }

        console.log('Selected user:', user.username);
        // TODO: Load messages
    }

    /**
     * Update chat header with recipient info
     */
    updateChatHeader(user) {
        const recipientName = document.getElementById('recipient-name');
        const recipientStatus = document.getElementById('recipient-status');
        const recipientInitial = document.getElementById('recipient-initial');

        if (recipientName) recipientName.textContent = user.username;
        if (recipientStatus) {
            recipientStatus.innerHTML = `
                <span class="status-dot online"></span>
                <span class="status-text">Online</span>
            `;
        }
        if (recipientInitial) {
            recipientInitial.textContent = getInitials(user.username);
            const avatar = recipientInitial.closest('.user-avatar');
            if (avatar) {
                avatar.style.background = getAvatarGradient(user.username);
            }
        }
    }

    /**
     * Show chat UI elements
     */
    showChatUI() {
        const noChatSelected = document.getElementById('no-chat-selected');
        const chatHeader = document.getElementById('chat-header');
        const messagesContainer = document.getElementById('messages-container');
        const messageInputContainer = document.getElementById('message-input-container');

        if (noChatSelected) noChatSelected.style.display = 'none';
        if (chatHeader) chatHeader.style.display = 'flex';
        if (messagesContainer) messagesContainer.style.display = 'block';
        if (messageInputContainer) messageInputContainer.style.display = 'block';
    }
}

// Create singleton instance
const chatManager = new ChatManager();

export default chatManager;
