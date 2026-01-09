# MeetUp Backend Server

Backend server for the MeetUp video calling platform, built with Node.js, Express, and Socket.IO.

## Features

- **Real-time Communication**: Socket.IO for instant messaging and signaling
- **User Management**: Online users tracking and presence
- **Call Management**: Create, join, and manage video/audio calls
- **WebRTC Signaling**: Peer-to-peer connection establishment
- **Room System**: Call rooms with participant management
- **CORS Support**: Configured for frontend integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Environment**: dotenv for configuration

## API Endpoints

### REST Endpoints

- `GET /` - Server status and statistics

### Socket.IO Events

#### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `user-joined` | User joins the platform | `{ id, username, joinedAt }` |
| `start-call` | Initiate a new call | `{ id, initiator, participants, isVideo }` |
| `join-call` | Join an existing call | `{ callId, user }` |
| `leave-call` | Leave a call | `{ callId, userId }` |
| `webrtc-offer` | WebRTC offer for peer connection | `{ callId, targetUserId, offer }` |
| `webrtc-answer` | WebRTC answer for peer connection | `{ callId, targetUserId, answer }` |
| `webrtc-ice-candidate` | ICE candidate for connection | `{ callId, targetUserId, candidate }` |

#### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `users-list` | List of online users | `[{ id, username, joinedAt }]` |
| `user-joined` | New user joined | `{ id, username, joinedAt }` |
| `user-left` | User left the platform | `userId` |
| `incoming-call` | Incoming call notification | `{ callId, initiator, isVideo }` |
| `call-started` | Call successfully started | `{ callId }` |
| `user-joined-call` | User joined the call | `{ callId, user, participants }` |
| `user-left-call` | User left the call | `{ callId, userId, participants }` |
| `call-participants` | Current call participants | `{ callId, participants }` |
| `webrtc-offer` | WebRTC offer received | `{ callId, fromUserId, offer }` |
| `webrtc-answer` | WebRTC answer received | `{ callId, fromUserId, answer }` |
| `webrtc-ice-candidate` | ICE candidate received | `{ callId, fromUserId, candidate }` |

## Installation & Setup

1. **Navigate to backend directory**
   ```bash
   cd MeetUp-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start production server**
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |

## Data Structures

### Online Users
```javascript
Map<socketId, {
  id: string,
  username: string,
  socketId: string,
  joinedAt: string
}>
```

### Active Calls
```javascript
Map<callId, {
  id: string,
  initiator: User,
  participants: Map<socketId, User>,
  isVideo: boolean,
  createdAt: string
}>
```

## WebRTC Integration

The server handles WebRTC signaling for:
- **Offer/Answer Exchange**: Peer connection negotiation
- **ICE Candidates**: Network connectivity establishment
- **Multi-peer Support**: Group calls with multiple participants

## Error Handling

- **Call Not Found**: When joining non-existent calls
- **User Disconnection**: Automatic cleanup of calls and user lists
- **Connection Errors**: Graceful handling of socket disconnections

## Security Considerations

- **CORS Configuration**: Restricts origins to frontend URL
- **Input Validation**: Basic validation on socket events
- **Rate Limiting**: Consider implementing for production use

## Scaling Considerations

For production deployment, consider:
- **Redis Adapter**: For multi-server Socket.IO scaling
- **Load Balancing**: Sticky sessions for WebSocket connections
- **Database Integration**: Persistent user and call history
- **TURN Servers**: For NAT traversal in production

## Development

### Project Structure
```
MeetUp-Backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variables template
└── README.md          # This file
```

### Adding Features

1. **Database Integration**: Add MongoDB/PostgreSQL for persistence
2. **Authentication**: JWT-based user authentication
3. **Call Recording**: Media server integration
4. **Chat Messages**: Text messaging during calls
5. **File Sharing**: Document sharing in calls

## Testing

Test the server using:
- **Socket.IO Client**: For event testing
- **Postman**: For REST endpoint testing
- **Frontend Integration**: With the MeetUp React app

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## License

MIT License - see LICENSE file for details