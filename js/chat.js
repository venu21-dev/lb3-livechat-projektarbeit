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

// Cache key for sent messages
const SENT_MESSAGES_CACHE_KEY = 'livechat_sent_messages_';

/**
 * Get cache key for current user
 */
function getCacheKey(userId) {
    return SENT_MESSAGES_CACHE_KEY + userId;
}

/**
 * Get sent messages from cache
 */
function getSentMessagesCache(userId) {
    try {
        const cached = localStorage.getItem(getCacheKey(userId));
        return cached ? JSON.parse(cached) : [];
    } catch (error) {
        console.error('Error reading cache:', error);
        return [];
    }
}

/**
 * Save sent messages to cache
 */
function saveSentMessagesCache(userId, messages) {
    try {
        localStorage.setItem(getCacheKey(userId), JSON.stringify(messages));
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

/**
 * Add message to cache
 */
function addToCache(userId, message) {
    const cached = getSentMessagesCache(userId);
    cached.push({
        id: message.id || message._id,
        timestamp: message.created_at || message.timestamp || new Date().toISOString()
    });
    saveSentMessagesCache(userId, cached);
}

/**
 * Check if message is in cache
 */
function isInCache(userId, messageId) {
    const cached = getSentMessagesCache(userId);
    return cached.some(m => m.id === messageId);
}

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

        this.setupMessageForm();
        
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
    async loadMessages() {
    try {
        const allMessages = await API.getMessages();

        // Filter messages using cache
        const currentUserId = this.currentUser.id || this.currentUser._id;
        const sentCache = getSentMessagesCache(currentUserId);

        // Only show:
        // 1. Messages sent by current user (in cache)
        // 2. Messages sent TO current user (received)
        this.messages = allMessages.filter(message => {
            const messageId = message.id || message._id;
            const senderId = message.user?.id || message.user?._id || message.sender_id;

            // Keep if sent by current user (check cache)
            if (senderId === currentUserId && isInCache(currentUserId, messageId)) {
                return true;
            }

            // Keep if sent TO current user
            if (message.receiver_id === currentUserId) {
                return true;
            }

            return false;
        });

        this.renderMessages();
    } catch (error) {
        console.error('Error loading messages:', error);
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
        // Load messages
        await this.loadMessages();

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


    /**
     * Load messages
     */
    async loadMessages() {
        try {
            this.messages = await API.getMessages();
            this.renderMessages();
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    /**
     * Render messages in chat
     */
    renderMessages() {
        const messagesList = document.getElementById('messages-list');
        if (!messagesList) return;

        messagesList.innerHTML = '';

        if (this.messages.length === 0) {
            messagesList.innerHTML = `
                <div class="no-messages">
                    <p>Noch keine Nachrichten. Schreibe die erste!</p>
                </div>
            `;
            return;
        }

        this.messages.forEach((message, index) => {
            const messageEl = this.createMessageElement(message);
            messagesList.appendChild(messageEl);
        });

        // Scroll to bottom
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    /**
     * Create message element
     */
    createMessageElement(message) {
        const div = document.createElement('div');

        const currentUserId = this.currentUser.id || this.currentUser._id;
        const senderId = message.user?.id || message.user?._id || message.sender_id;
        const isOwn = senderId === currentUserId;

        div.className = `message ${isOwn ? 'own' : 'other'}`;

        const senderName = message.user?.username || 'Unknown';
        const initial = senderName.charAt(0).toUpperCase();
        const gradient = getAvatarGradient(senderName);

        const time = new Date(message.created_at || message.timestamp).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });

        div.innerHTML = `
            ${!isOwn ? `
                <div class="message-avatar" style="background: ${gradient};">
                    <span>${initial}</span>
                </div>
            ` : ''}
            <div class="message-content">
                ${!isOwn ? `<div class="message-sender">${senderName}</div>` : ''}
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(message.message || message.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        `;

        return div;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Send message
     */
    async sendMessage(text) {
        if (!text || !text.trim()) return;

        try {
            const currentUserId = this.currentUser.id || this.currentUser._id;
            const message = await API.sendMessage(null, text.trim());

            // Add to cache
            addToCache(currentUserId, message);

            // Add to messages array
            this.messages.push(message);

            // Re-render messages
            this.renderMessages();

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }


    /**
     * Setup message form
     */
    setupMessageForm() {
        const messageForm = document.getElementById('message-form');
        const messageInput = document.getElementById('message-input');

        if (messageForm && messageInput) {
            messageForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const text = messageInput.value.trim();
                if (!text) return;

                try {
                    // Disable input
                    messageInput.disabled = true;

                    // Send message
                    await this.sendMessage(text);

                    // Clear input
                    messageInput.value = '';

                } catch (error) {
                    console.error('Error sending message:', error);
                    alert('Fehler beim Senden der Nachricht');
                } finally {
                    messageInput.disabled = false;
                    messageInput.focus();
                }
            });
        }
    }

    
    /**
     * Clear cache (for testing)
     */
    clearCache() {
        const currentUserId = this.currentUser.id || this.currentUser._id;
        localStorage.removeItem(getCacheKey(currentUserId));
        console.log('Cache cleared');
    }
}

// Create singleton instance
const chatManager = new ChatManager();

export default chatManager;
