# Multiplayer Wheel of Fortune - WebSocket Setup

This implementation adds true cross-device multiplayer functionality using WebSockets and Socket.IO.

## Features

- **Real-time multiplayer**: Players can join from different devices
- **Game state synchronization**: All game actions are synchronized across devices
- **Player management**: Automatic player assignment and host designation
- **Connection status**: Visual indicators for connection status
- **Error handling**: Graceful handling of connection issues

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Full Stack

To run both the frontend (Next.js) and backend (WebSocket server) simultaneously:

```bash
npm run dev:full
```

This will start:
- **Backend server**: `http://localhost:3001` (WebSocket server)
- **Frontend**: `http://localhost:3000` (Next.js app)

### 3. Alternative: Run Servers Separately

If you prefer to run them separately:

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

## How to Play Multiplayer

### For the Host:
1. Go to `http://localhost:3000`
2. Click "Multiplayer"
3. Click "Create Game"
4. Enter a game code (e.g., "ABC123")
5. Enter your name
6. Share the game code with other players

### For Other Players:
1. Go to `http://localhost:3000`
2. Click "Multiplayer"
3. Click "Join Game"
4. Enter the game code provided by the host
5. Enter your name
6. Wait for the game to start

## Architecture

### Backend (`server.js`)
- **Express server** with Socket.IO for WebSocket connections
- **Game state management** in memory
- **Player management** with automatic host assignment
- **Real-time event handling** for game actions

### Frontend (`components/MultiplayerGame.tsx`)
- **Socket.IO client** for real-time communication
- **Game state synchronization** across devices
- **Connection status monitoring**
- **Error handling** for network issues

## WebSocket Events

### Client to Server:
- `joinGame`: Player joins a game
- `gameStateUpdate`: Update game state
- `wheelSpin`: Player spins the wheel
- `letterGuess`: Player guesses a letter
- `solveAttempt`: Player attempts to solve
- `playerReady`: Player indicates readiness

### Server to Client:
- `gameStateUpdate`: Broadcast game state changes
- `playerJoined`: Notify when player joins
- `playerLeft`: Notify when player leaves
- `joinError`: Error joining game
- `wheelSpin`: Synchronize wheel spins
- `letterGuess`: Synchronize letter guesses
- `solveAttempt`: Synchronize solve attempts

## Game Flow

1. **Host creates game** → Game code generated
2. **Players join** → Added to player list
3. **Game starts** → When minimum players reached
4. **Turns synchronized** → All players see same game state
5. **Real-time updates** → All actions broadcast to all players

## Technical Details

### Game State Structure
```javascript
{
  id: string,
  code: string,
  status: 'waiting' | 'active',
  players: Player[],
  currentPlayer: number,
  // ... other game properties
}
```

### Player Structure
```javascript
{
  id: string,
  name: string,
  isHost: boolean,
  isHuman: boolean,
  roundMoney: number,
  totalMoney: number,
  // ... other player properties
}
```

## Deployment Notes

For production deployment:
1. Update WebSocket server URL in `MultiplayerGame.tsx`
2. Configure CORS settings in `server.js`
3. Use environment variables for ports
4. Consider using Redis for game state persistence
5. Add authentication if needed

## Troubleshooting

### Common Issues:
- **Connection failed**: Ensure backend server is running on port 3001
- **Game not found**: Check game code spelling
- **Players not syncing**: Check WebSocket connection status
- **Port conflicts**: Change ports in `server.js` and update frontend URL

### Debug Mode:
Check browser console and server logs for detailed error messages. 