/**
 * WebSocket Service
 * Robust gegen unterschiedliche Message-Shapes
 */
import API_CONFIG from '../config/api.config.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.connected = false;

    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;

    this.eventHandlers = new Map();

    // “connected aber empfängt nix” erkennen
    this.lastMessageAt = 0;
    this.staleAfterMs = 15000;
  }

  normalizeWsUrl(url) {
    if (!url) return url;
    if (url.startsWith('https://')) return 'wss://' + url.slice('https://'.length);
    if (url.startsWith('http://')) return 'ws://' + url.slice('http://'.length);
    return url;
  }

  /**
   * Safely send JSON to WS (no crash if not open)
   */
  safeSend(obj) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(obj));
      }
    } catch (e) {
      console.error('WS send failed:', e);
    }
  }

  connect() {
    try {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }

      // --- Token (JWT) beim WS Connect mitsenden ---
      const baseUrl = this.normalizeWsUrl(API_CONFIG.WS_URL);

      // Token liegt bei dir unter STORAGE.TOKEN = 'livechat_token'
      const token = localStorage.getItem(API_CONFIG.STORAGE.TOKEN);

      // Option 1: Token als Query-Param
      const url = token ? `${baseUrl}?token=${encodeURIComponent(token)}` : baseUrl;

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected:', url);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.lastMessageAt = Date.now();
        this.emit('connected');

        // Option 2: Zusätzlich Auth-Message senden (falls Backend das braucht)
        if (token) {
          // mehrere mögliche Auth-Events probieren (robust)
          this.safeSend({ event: 'auth', token });
          this.safeSend({ type: 'auth', token });
          this.safeSend({ event: 'authenticate', token });
          this.safeSend({ type: 'authenticate', token });
          this.safeSend({ event: 'login', token });
          this.safeSend({ type: 'login', token });
        }
      };

      this.ws.onmessage = (event) => {
        this.lastMessageAt = Date.now();
        this.handleMessage(event.data);
      };

      this.ws.onclose = (event) => {
        console.warn('WebSocket closed:', event.code, event.reason);
        this.connected = false;
        this.emit('disconnected');

        if (event.code !== 1000) this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connected = false;
        this.emit('error', error);
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      this.connected = false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached');
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => this.connect(), this.reconnectDelay);
  }

  handleMessage(raw) {
    try {
      const msg = JSON.parse(raw);

      // mehrere Shapes akzeptieren
      const event = msg?.event ?? msg?.type;
      const payload = msg?.payload ?? msg?.data ?? msg?.message ?? msg?.user ?? msg;

      if (!event) {
        console.warn('WS message without event/type:', msg);
        this.emit('raw', msg);
        return;
      }

      // Backend-Events: new_message/new_login/changed_user/deleted_user/...
      switch (event) {
        case 'new_message':
          this.emit('message', payload);
          break;

        case 'new_login':
        case 'changed_user':
          this.emit('user_joined', payload);
          break;

        case 'deleted_user':
          this.emit('user_left', payload);
          break;

        case 'changed_message':
          this.emit('message_updated', payload);
          break;

        case 'deleted_message':
          this.emit('message_deleted', payload);
          break;

        default:
          this.emit(event, payload);
      }
    } catch (err) {
      console.error('Failed to handle WS message:', err, raw);
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) this.eventHandlers.set(event, []);
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    if (!this.eventHandlers.has(event)) return;
    this.eventHandlers.get(event).forEach((h) => {
      try {
        h(data);
      } catch (e) {
        console.error('Handler error:', e);
      }
    });
  }

  isConnected() {
    return this.connected;
  }

  isStale() {
    if (!this.connected) return true;
    if (!this.lastMessageAt) return true;
    return Date.now() - this.lastMessageAt > this.staleAfterMs;
  }

  /**
   * Used by chat.js
   */
  sendMessage(receiverId, text) {
    // mehrere mögliche Shapes (robust)
    this.safeSend({ event: 'message', receiverId, message: text });
    this.safeSend({ type: 'message', receiverId, message: text });

    this.safeSend({ event: 'message', to: receiverId, message: text });
    this.safeSend({ type: 'message', to: receiverId, message: text });
  }

  /**
   * Used by chat.js
   */
  sendTyping(receiverId, isTyping) {
    const evt = isTyping ? 'start_typing' : 'stop_typing';

    this.safeSend({ event: evt, to: receiverId });
    this.safeSend({ type: evt, to: receiverId });

    // fallback shape
    this.safeSend({ event: 'typing', receiverId, isTyping });
    this.safeSend({ type: 'typing', receiverId, isTyping });
  }

  disconnect() {
    if (!this.ws) return;
    try {
      this.ws.close(1000, 'Client disconnect');
    } finally {
      this.ws = null;
      this.connected = false;
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
