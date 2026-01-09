# MeetUp - Video Calling Platform

A modern, responsive real-time video and audio calling platform built with React.js and Tailwind CSS.

## Features

- **Real-time Communication**: Audio and video calls with WebRTC support
- **User Management**: Join with unique username, see online users
- **Call Types**: Audio-only or video calls, group calls support
- **Room System**: Create rooms or join via Room ID
- **Modern UI**: Dark theme, responsive design, smooth animations
- **Call Controls**: Mute/unmute, camera on/off, screen sharing, leave call

## Tech Stack

- **Frontend**: React.js (functional components + hooks)
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io client integration
- **Media**: WebRTC for audio/video calls
- **State Management**: React Context API

## Project Structure

```
src/
├── components/
│   ├── LandingPage.js      # Username entry page
│   ├── Dashboard.js        # Main dashboard with user list
│   ├── CallInterface.js    # Video call interface
│   ├── UserCard.js         # Individual user component
│   ├── VideoCard.js        # Video participant component
│   └── CreateRoomModal.js  # Room creation modal
├── context/
│   └── AppContext.js       # Global state management
├── App.js                  # Main app component with routing
├── index.js               # React entry point
└── index.css              # Tailwind CSS imports and custom styles
```

## Pages & Components

### 1. Landing Page
- Clean, centered card design
- Username input with validation
- Loading states and error handling
- Dark-mode friendly interface

### 2. Dashboard
- **Sidebar**: Online users list with call buttons
- **Main Area**: Create room and join room options
- **User Selection**: Multi-select for group calls
- **Real-time Updates**: Users joining/leaving

### 3. Call Interface
- **Video Grid**: Responsive layout for multiple participants
- **Control Bar**: Mute, video toggle, screen share, leave call
- **User Info**: Username labels and status indicators
- **Mobile Responsive**: Adapts to different screen sizes

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MeetUp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your backend server URL
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Backend Requirements

This frontend expects a Socket.IO backend server with the following events:

### Client → Server Events
- `user-joined`: User joins the platform
- `start-call`: Initiate a call
- `join-call`: Join an existing call
- `leave-call`: Leave a call

### Server → Client Events
- `users-list`: List of online users
- `user-joined`: New user joined
- `user-left`: User left the platform
- `call-started`: Call initiated
- `call-ended`: Call ended

## WebRTC Integration

The app includes WebRTC setup for:
- Local media stream access (camera/microphone)
- Screen sharing capabilities
- Peer connection management (ready for backend integration)

## Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update CSS custom properties in `src/index.css`
- Component-specific styles use Tailwind utility classes

### State Management
- Global state managed through `AppContext.js`
- Easy to extend with additional state properties
- Socket.IO integration built into context

## Browser Support

- Modern browsers with WebRTC support
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development Notes

- Components are modular and reusable
- Responsive design with mobile-first approach
- Accessibility considerations included
- Production-ready code structure
- Clean separation of concerns

## Future Enhancements

- Chat messaging during calls
- Recording functionality
- Virtual backgrounds
- Breakout rooms
- Call quality indicators
- User profiles and avatars

## License

MIT License - see LICENSE file for details