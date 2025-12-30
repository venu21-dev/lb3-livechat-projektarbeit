# LiveChat

Modern real-time chat application built with vanilla JavaScript, HTML, and CSS.

## 📋 Description

LiveChat is a real-time messaging application developed as part of the LB3 project at GIBB Bern. The application features JWT authentication, WebSocket real-time communication, and a modern dark-themed user interface.

## 👥 Team

- **Venu** - Frontend Development
- **Mathu** - Frontend Development

## 🚀 Features

- User Authentication (Login/Register)
- Real-time Messaging
- User Management
- Modern Dark Theme UI
- Responsive Design
- WebSocket Communication

## 🛠️ Technologies

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend API:** https://chat.ndum.ch/api/v1
- **Real-time:** WebSocket
- **Authentication:** JWT (JSON Web Tokens)

## 📦 Installation

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (optional, for local server)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/venu21-dev/lb3-livechat-projektarbeit.git
cd livechat-projektarbeit
```

## 📁 Project Structure

```
livechat-projektarbeit/
├── index.html              # Main HTML file
├── css/
│   ├── style.css          # Global styles & variables
│   ├── login.css          # Authentication page styles
│   └── chat.css           # Chat interface styles
├── js/
│   ├── main.js            # Application entry point
│   ├── auth.js            # Authentication logic
│   ├── api.js             # API service layer
│   ├── chat.js            # Chat management
│   ├── websocket.js       # WebSocket service
│   └── utils.js           # Utility functions
├── config/
│   └── api.config.js      # API configuration
├── assets/
│   ├── icons/             # UI icons
│   └── images/            # Background images
└── docs/                  # Documentation
```

## 🔧 Configuration

The application connects to the backend API at `https://chat.ndum.ch/api/v1`. 

Configuration can be modified in `config/api.config.js`:

```javascript
export const API_CONFIG = {
    BASE_URL: 'https://chat.ndum.ch/api/v1',
    WS_URL: 'wss://chat.ndum.ch',
    // ...
};
```

## 🎨 Features Overview

### Authentication
- User registration with email validation
- Secure login with JWT tokens
- Token-based session management
- Logout functionality

### Real-time Chat
- WebSocket-based real-time messaging
- Message history
- User online status
- Auto-reconnection

### User Interface
- Modern dark theme
- Responsive design (Mobile/Tablet/Desktop)
- Avatar system with color gradients
- Smooth animations and transitions

## 🔐 Security

- JWT token authentication
- XSS protection (HTML escaping)
- Secure password handling
- HTTPS/WSS encrypted communication

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Development

### Running Locally
Access at: `http://localhost:3000`

### Code Style

- ES6+ JavaScript modules
- CSS custom properties (variables)
- Semantic HTML5
- Mobile-first responsive design

## 🐛 Known Limitations

- Backend API does not support direct message filtering (implemented via frontend cache)
- Browser notification requires user permission
- LocalStorage used for cache (cleared on browser cache clear)

## 📚 Documentation

For more detailed documentation, see:
- [Cache System](docs/CACHE_SYSTEM.md)
- [API Documentation](https://chat.ndum.ch/api/docs/)

## 🤝 Contributing

This is a school project. Contributions are limited to team members.

## 📄 License

MIT License - See LICENSE file for details

## 📧 Contact

- **Institution:** GIBB Bern
- **Module:** M294 - Frontend Development
- **Project:** LB3 - LiveChat Application

## 🎓 Academic Information

**Course:**  Web Development  
**Institution:** GIBB Berufsfachschule Bern  
**Instructor:** Nicolas Dumermuth  
**Project Type:** LB3 - Practical Assessment  
**Deadline:** January 18, 2026  

---

**Built by Venu & Mathu**
