/**
 * WebSocket Service
 * Handles real-time communication
 */

import API_CONFIG from '../config/api.config.js';

class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.reconnectTimer = null;
        this.isConnecting = false;
        this.messageHandlers = new Set();
        this.connectionHandlers = new Set();
    }

    /**
     * Connect to WebSocket server
     */
    connect(token) {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            console.log('⚠️ WebSocket already connecting or connected');
            return;
        }

        this.isConnecting = true;
        console.log('🔌 Connecting to WebSocket...');

        try {
            // Connect with token as query parameter
            const wsUrl = `${API_CONFIG.WS_URL}?token=${token}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);

        } catch (error) {
            console.error('❌ WebSocket connection error:', error);
            this.isConnecting = false;
            this.scheduleReconnect(token);
        }
    }

    /**
     * Handle WebSocket open
     */
    handleOpen(event) {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Notify connection handlers
        this.connectionHandlers.forEach(handler => {
            try {
                handler(true);
            } catch (error) {
                console.error('Error in connection handler:', error);
            }
        });
    }

    /**
     * Handle incoming WebSocket message
     */
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message:', data);

            // Notify message handlers
            this.messageHandlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('Error in message handler:', error);
                }
            });

        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket error
     */
    handleError(event) {
        console.error('❌ WebSocket error:', event);
        this.isConnecting = false;
    }

    /**
     * Handle WebSocket close
     */
    handleClose(event) {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        this.isConnecting = false;
        this.ws = null;

        // Notify connection handlers
        this.connectionHandlers.forEach(handler => {
            try {
                handler(false);
            } catch (error) {
                console.error('Error in connection handler:', error);
            }
        });

        // Attempt to reconnect
        if (event.code !== 1000) { // 1000 = Normal closure
            const token = localStorage.getItem(API_CONFIG.STORAGE.TOKEN);
            if (token) {
                this.scheduleReconnect(token);
            }
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect(token) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

        this.reconnectTimer = setTimeout(() => {
            this.connect(token);
        }, delay);
    }

    /**
     * Send message through WebSocket
     */
    send(data) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket not connected');
            return false;
        }

        try {
            this.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Error sending WebSocket message:', error);
            return false;
        }
    }

    /**
     * Add message handler
     */
    onMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    /**
     * Add connection handler
     */
    onConnection(handler) {
        this.connectionHandlers.add(handler);
        return () => this.connectionHandlers.delete(handler);
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }

        this.reconnectAttempts = 0;
        this.isConnecting = false;
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
