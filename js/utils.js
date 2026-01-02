/**
 * Utility Functions
 * Helper functions used throughout the application
 */

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'Gerade eben';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `vor ${minutes} Min.`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `vor ${hours} Std.`;
    }
    
    // Same year
    if (d.getFullYear() === now.getFullYear()) {
        return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
    
    // Different year
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Format time to HH:MM
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get initials from a name
 * @param {string} name - The name
 * @returns {string} Initials (max 2 characters)
 */
export function getInitials(name) {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate a random color for avatar
 * @param {string} str - String to generate color from
 * @returns {string} CSS gradient string
 */
export function getAvatarGradient(str) {
    // Generate a hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to colors
    const hue1 = hash % 360;
    const hue2 = (hash + 120) % 360;
    
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%) 0%, hsl(${hue2}, 70%, 50%) 100%)`;
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Parse markdown-like formatting
 * @param {string} text - Text with markdown
 * @returns {string} HTML string
 */
export function parseMarkdown(text) {
    if (!text) return '';
    
    // Sanitize first
    let html = sanitizeHTML(text);
    
    // Bold: **text** or __text__
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Inline code: `text`
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
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
 * Show error message in form
 * @param {string} elementId - Error element ID
 * @param {string} message - Error message
 */
export function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
        errorElement.classList.remove('success'); // Remove success class if present
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 5000);
    }
}

/**
 * Hide error message
 * @param {string} elementId - Error element ID
 */
export function hideError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('show', 'success');
    }
}

/**
 * Show success message in form
 * @param {string} elementId - Error element ID (reuses error divs for success)
 * @param {string} message - Success message
 */
export function showSuccess(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show', 'success');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            errorElement.classList.remove('show', 'success');
        }, 3000);
    }
}

/**
 * Set loading state on button
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 */
export function setButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
    } else {
        button.disabled = false;
    }
}

/**
 * Scroll to bottom of element
 * @param {HTMLElement} element - Element to scroll
 * @param {boolean} smooth - Use smooth scrolling
 */
export function scrollToBottom(element, smooth = true) {
    if (!element) return;
    
    element.scrollTo({
        top: element.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

/**
 * Check if element is scrolled to bottom
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Threshold in pixels
 * @returns {boolean} True if at bottom
 */
export function isScrolledToBottom(element, threshold = 100) {
    if (!element) return false;
    return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
}

/**
 * Play notification sound
 */
export function playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

/**
 * Show browser notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export function showNotification(title, body) {
    if (!('Notification' in window)) {
        return;
    }
    
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/assets/images/logo.png' });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body, icon: '/assets/images/logo.png' });
            }
        });
    }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} {valid: boolean, message: string}
 */
export function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Passwort muss mindestens 8 Zeichen lang sein' };
    }
    return { valid: true, message: '' };
}

export default {
    formatDate,
    formatTime,
    getInitials,
    getAvatarGradient,
    sanitizeHTML,
    parseMarkdown,
    debounce,
    showError,
    hideError,
    showSuccess,
    setButtonLoading,
    scrollToBottom,
    isScrolledToBottom,
    playNotificationSound,
    showNotification,
    copyToClipboard,
    isValidEmail,
    validatePassword,
};