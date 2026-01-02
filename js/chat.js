/**
 * Chat Module
 * Handles chat UI and message rendering
 */

import * as API from './api.js';
import wsService from './websocket.js';
import { logout } from './auth.js';
import { 
    getInitials, 
    getAvatarGradient, 
    formatTime, 
    formatDate,
    parseMarkdown,
    scrollToBottom,
    isScrolledToBottom,
    showError,
    hideError,
    debounce,
    playNotificationSound,
    showNotification
} from './utils.js';

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.currentRecipient = null;
        this.users = [];
        this.messages = [];
        this.messagePollingInterval = null;
    }
    
    /**
     * Initialize chat
     */
    async init() {
        // CRITICAL: Clean up old global cache (from previous version)
        // This ensures privacy by removing shared cache from old code
        if (localStorage.getItem('sent_messages_cache')) {
            console.warn('🧹 Removing old global cache - upgrading to per-user cache for privacy');
            localStorage.removeItem('sent_messages_cache');
        }
        
        this.currentUser = API.getStoredUser();
        
        // Set up UI
        this.setupUI();
        this.setupEventListeners();
        
        // Load initial data
        await this.loadUsers();
        
        // Connect WebSocket
        this.connectWebSocket();
        
        // Start polling for messages (fallback if WebSocket fails)
        this.startMessagePolling();
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
            settingsBtn.addEventListener('click', () => this.openProfileModal());
        }
        
        // Mobile menu button
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('hidden');
            });
        }
        
        // Message form
        const messageForm = document.getElementById('message-form');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        }
        
        // Message input for typing indicator
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
            let typingTimeout;
            messageInput.addEventListener('input', () => {
                if (this.currentRecipient) {
                    wsService.sendTyping(this.currentRecipient.id || this.currentRecipient._id, true);
                    
                    clearTimeout(typingTimeout);
                    typingTimeout = setTimeout(() => {
                        wsService.sendTyping(this.currentRecipient.id || this.currentRecipient._id, false);
                    }, 1000);
                }
            });
        }
        
        // Profile modal
        this.setupProfileModal();
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
     * @param {object} user - User data
     * @returns {HTMLElement} User item element
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
     * @param {object} user - User data
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
        
        // Load messages
        await this.loadMessages();
        
        // Hide sidebar on mobile
        if (window.innerWidth <= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.add('hidden');
        }
    }
    
    /**
     * Update chat header with recipient info
     * @param {object} user - User data
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
     * Load messages for current recipient
     */
    async loadMessages() {
        if (!this.currentRecipient) return;
        
        try {
            // Get all messages
            const allMessages = await API.getMessages();
            
            const currentUsername = this.currentUser.username;
            const recipientUsername = this.currentRecipient.username;
            
            // Get sent messages cache (per-user)
            const sentCacheKey = `sent_messages_cache_${currentUsername}`;
            const sentCache = JSON.parse(localStorage.getItem(sentCacheKey) || '{}');
            
            this.messages = allMessages.filter(msg => {
                const senderUsername = msg.username;
                const messageText = msg.message;
                
                // Messages FROM chat partner → always show
                // NOTE: Backend limitation - we cannot distinguish which partner
                // they sent it to, so we show ALL messages from this user
                if (senderUsername === recipientUsername) {
                    return true;
                }
                
                // Messages FROM current user → check sent cache
                if (senderUsername === currentUsername) {
                    const messageKey = `msg_${messageText.trim()}`;
                    const cached = sentCache[messageKey];
                    
                    if (cached && cached.recipientUsername === recipientUsername) {
                        return true; // Show if sent to this recipient
                    }
                    return false; // Hide if sent to someone else
                }
                
                return false;
            });
            
            // Sort by timestamp
            this.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            // Render messages
            this.renderMessages();
            
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }
    
    /**
     * Render all messages
     */
    renderMessages() {
        const messagesList = document.getElementById('messages-list');
        if (!messagesList) return;
        
        const wasAtBottom = isScrolledToBottom(messagesList.parentElement);
        
        messagesList.innerHTML = '';
        
        let lastDate = null;
        
        this.messages.forEach(message => {
            const messageDate = new Date(message.createdAt).toDateString();
            
            // Add date divider if date changed
            if (messageDate !== lastDate) {
                const divider = document.createElement('div');
                divider.className = 'date-divider';
                divider.innerHTML = `<span>${formatDate(message.createdAt)}</span>`;
                messagesList.appendChild(divider);
                lastDate = messageDate;
            }
            
            const messageElement = this.createMessageElement(message);
            messagesList.appendChild(messageElement);
        });
        
        // Scroll to bottom
        if (wasAtBottom) {
            scrollToBottom(messagesList.parentElement);
        }
    }
    
    /**
     * Create message element
     * @param {object} message - Message data
     * @returns {HTMLElement} Message element
     */
    createMessageElement(message) {
        const div = document.createElement('div');
        div.className = 'message';
        
        // Backend format: { username, message } not { sender, text }
        const senderUsername = message.username;
        const currentUsername = this.currentUser.username;
        const isOwn = senderUsername === currentUsername;
        
        if (isOwn) {
            div.classList.add('own');
        }
        
        const sender = isOwn ? this.currentUser : this.currentRecipient;
        const initial = getInitials(sender.username);
        const gradient = getAvatarGradient(sender.username);
        const time = formatTime(message.createdAt);
        const text = parseMarkdown(message.message);  // Backend uses 'message' not 'text'
        
        div.innerHTML = `
            <div class="user-avatar avatar-sm" style="background: ${gradient};">
                <span>${initial}</span>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${sender.username}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">
                    ${text}
                </div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * Handle send message
     * @param {Event} e - Form submit event
     */
    async handleSendMessage(e) {
        e.preventDefault();
        
        if (!this.currentRecipient) return;
        
        const messageInput = document.getElementById('message-input');
        const text = messageInput.value.trim();
        
        if (!text) return;
        
        try {
            // Send via API
            const receiverId = this.currentRecipient.id || this.currentRecipient._id;
            await API.sendMessage(receiverId, text);
            
            // IMPORTANT: Cache sent message with receiver info (backend doesn't return this)
            this.cacheSentMessage(receiverId, text);
            
            // Try to send via WebSocket as well
            wsService.sendMessage(receiverId, text);
            
            // Clear input
            messageInput.value = '';
            
            // Reload messages
            await this.loadMessages();
            
        } catch (error) {
            console.error('Error sending message:', error);
            showError('chat-error', 'Fehler beim Senden der Nachricht');
        }
    }
    
    /**
     * Cache sent message locally (to know which messages were sent to which user)
     * @param {string} receiverId - Receiver user ID
     * @param {string} text - Message text
     */
    cacheSentMessage(receiverId, text) {
        try {
            // CRITICAL: Cache must be per-user to prevent privacy leak!
            const cacheKey = `sent_messages_cache_${this.currentUser.username}`;
            const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            
            // Use message text as key (simple and effective)
            const messageKey = `msg_${text.trim()}`;
            
            cache[messageKey] = {
                receiverId: receiverId,
                recipientUsername: this.currentRecipient.username,
                timestamp: Date.now()
            };
            
            // Clean old entries (older than 1 hour)
            const oneHourAgo = Date.now() - 3600000;
            Object.keys(cache).forEach(key => {
                if (cache[key].timestamp < oneHourAgo) {
                    delete cache[key];
                }
            });
            
            localStorage.setItem(cacheKey, JSON.stringify(cache));
            console.log('Cached message:', messageKey, '→', this.currentRecipient.username);
        } catch (error) {
            console.error('Error caching message:', error);
        }
    }
    
    /**
     * Connect to WebSocket
     */
    connectWebSocket() {
        wsService.connect();
        
        // Handle incoming messages
        wsService.on('message', (message) => {
        console.log('📩 WS message received:', message);
         this.handleIncomingMessage(message);
        });
        
        // Handle user updates
        wsService.on('user_joined', () => {
            this.loadUsers();
        });
        
        wsService.on('user_left', () => {
            this.loadUsers();
        });
        
    }
    
    /**
     * Handle incoming WebSocket message
     * @param {object} message - Message data
     */
    handleIncomingMessage(message) {
        // Backend format: { username, message }
        const senderUsername = message.username;
        const currentUsername = this.currentUser.username;
        const recipientUsername = this.currentRecipient?.username;
        
        // Only add if it's part of current conversation
        if (senderUsername === recipientUsername || senderUsername === currentUsername) {
            this.messages.push(message);
            this.renderMessages();
            
            // Play notification sound if message is from recipient
            if (senderUsername === recipientUsername) {
                playNotificationSound();
                showNotification(
                    this.currentRecipient.username,
                    message.message  // Backend uses 'message' not 'text'
                );
            }
        }
    }
    
    /**
     * Start polling for new messages (fallback)
     */
    startMessagePolling() {
    // Poll every 3 seconds
    this.messagePollingInterval = setInterval(async () => {
        if (this.currentRecipient && (!wsService.isConnected() || wsService.isStale())) {
            await this.loadMessages();
        }
    }, 3000);
    }
    
    /**
     * Stop message polling
     */
    stopMessagePolling() {
        if (this.messagePollingInterval) {
            clearInterval(this.messagePollingInterval);
            this.messagePollingInterval = null;
        }
    }
    
    /**
     * Setup profile modal
     */
    setupProfileModal() {
        const modal = document.getElementById('profile-modal');
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const profileForm = document.getElementById('profile-form');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeProfileModal());
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeProfileModal());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeProfileModal());
        }
        
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
    }
    
    /**
     * Open profile modal
     */
    openProfileModal() {
        const modal = document.getElementById('profile-modal');
        const usernameInput = document.getElementById('profile-username');
        
        if (modal) modal.classList.add('active');
        if (usernameInput) usernameInput.value = this.currentUser.username;
    }
    
    /**
     * Close profile modal
     */
    closeProfileModal() {
        const modal = document.getElementById('profile-modal');
        if (modal) modal.classList.remove('active');
        hideError('profile-error');
    }
    
    /**
     * Handle profile update
     * @param {Event} e - Form submit event
     */
    async handleProfileUpdate(e) {
        e.preventDefault();
        hideError('profile-error');
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        const username = form.username.value.trim();
        const password = form.password.value;
        const passwordConfirm = form.password_confirm.value;
        
        // Build update data
        const updateData = {};
        
        if (username && username !== this.currentUser.username) {
            updateData.username = username;
        }
        
        if (password) {
            if (password !== passwordConfirm) {
                showError('profile-error', 'Passwörter stimmen nicht überein');
                return;
            }
            updateData.password = password;
        }
        
        if (Object.keys(updateData).length === 0) {
            showError('profile-error', 'Keine Änderungen vorgenommen');
            return;
        }
        
        try {
            const userId = this.currentUser.id || this.currentUser._id;
            const updatedUser = await API.updateUser(userId, updateData);
            
            // Update stored user data
            const token = API.getToken();
            API.saveAuthData(token, updatedUser);
            
            // Update current user
            this.currentUser = updatedUser;
            this.setupUI();
            
            // Close modal
            this.closeProfileModal();
            
        } catch (error) {
            console.error('Error updating profile:', error);
            showError('profile-error', error.message || 'Fehler beim Aktualisieren des Profils');
        }
    }
    
    /**
     * Destroy chat manager
     */
    destroy() {
        this.stopMessagePolling();
        wsService.disconnect();
    }
}

// Create singleton instance
const chatManager = new ChatManager();

export default chatManager;