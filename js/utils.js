/**
 * Utility Functions
 * Helper functions for UI and data manipulation
 */

/**
 * Get initials from username
 */
export function getInitials(username) {
    if (!username) return '?';

    const words = username.trim().split(/\s+/);
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate avatar gradient based on username
 */
export function getAvatarGradient(username) {
    if (!username) {
        return 'linear-gradient(135deg, #6a9fb5 0%, #8ab4c5 100%)';
    }

    // Generate hash from username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }

    // Convert to HSL
    const hue = Math.abs(hash % 360);
    const saturation = 65;
    const lightness = 55;

    const hue2 = (hue + 30) % 360;

    return `linear-gradient(135deg,
        hsl(${hue}, ${saturation}%, ${lightness}%) 0%,
        hsl(${hue2}, ${saturation}%, ${lightness + 10}%) 100%)`;
}

/**
 * Format timestamp to time string
 */
export function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Heute';
    if (isYesterday) return 'Gestern';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}.${month}.${year}`;
}

/**
 * Simple markdown parser
 */
export function parseMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Code: `code`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}

/**
 * Scroll to bottom of element
 */
export function scrollToBottom(element) {
    if (element) {
        element.scrollTop = element.scrollHeight;
    }
}

/**
 * Check if element is scrolled to bottom
 */
export function isScrolledToBottom(element, threshold = 100) {
    if (!element) return false;
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

/**
 * Show error message
 */
export function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

/**
 * Hide error message
 */
export function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = '';
        element.classList.remove('show');
    }
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Play notification sound
 */
export function playNotificationSound() {
    // Simple beep using Audio API
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
}

/**
 * Show browser notification
 */
export function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: '/favicon.ico',
        });
    }
}

export default {
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
    showNotification,
};
