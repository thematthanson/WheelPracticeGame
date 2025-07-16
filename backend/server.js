const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://your-netlify-app.netlify.app", // Replace with your Netlify URL
      "https://wheel-of-fortune-game.netlify.app", // Example Netlify URL
      process.env.FRONTEND_URL // Environment variable for frontend URL
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Enable CORS
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://your-netlify-app.netlify.app", // Replace with your Netlify URL
    "https://wheel-of-fortune-game.netlify.app", // Example Netlify URL
    process.env.FRONTEND_URL // Environment variable for frontend URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Store active games in memory
const activeGames = new Map();

// Game state management
const GameManager = {
  createGame: (gameCode, hostPlayer) => {
    const gameState = {
      id: Date.now().toString(),
      code: gameCode,
      status: 'waiting',
      createdAt: new Date().toISOString(),
      players: [hostPlayer],
      currentPlayer: 0,
      currentRound: 1,
      puzzle: null,
      usedLetters: [],
      wheelValue: null,
      isSpinning: false,
      wheelRotation: 0,
      turnInProgress: false,
      lastSpinResult: null,
      landedSegmentIndex: 0,
      message: 'Waiting for players to join...',
      isFinalRound: false,
      finalRoundLettersRemaining: 0,
      finalRoundVowelsRemaining: 0,
      isBonusRound: false,
      bonusRoundTimeRemaining: 0,
      bonusRoundPuzzle: null,
      bonusRoundEnvelope: null,
      bonusRoundEnvelopeValue: null,
      maxPlayers: 2
    };
    
    activeGames.set(gameCode, gameState);
    return gameState;
  },

  getGame: (gameCode) => {
    return activeGames.get(gameCode);
  },

  updateGame: (gameCode, gameState) => {
    activeGames.set(gameCode, gameState);
  },

  addPlayer: (gameCode, player) => {
    const game = activeGames.get(gameCode);
    if (!game) return null;
    
    // Check if game is full
    if (game.players.length >= game.maxPlayers) {
      return { error: 'Game is full' };
    }

    // Check if player name is already taken
    const existingPlayer = game.players.find(p => p.name === player.name);
    let finalPlayerName = player.name;
    if (existingPlayer) {
      let counter = 1;
      while (game.players.find(p => p.name === finalPlayerName)) {
        finalPlayerName = `${player.name} ${counter}`;
        counter++;
      }
    }

    const newPlayer = {
      ...player,
      name: finalPlayerName,
      isHost: game.players.length === 0
    };

    game.players.push(newPlayer);

    // If we have enough players, start the game
    if (game.players.length >= game.maxPlayers) {
      game.status = 'active';
      game.message = 'Game starting...';
      
      // Add computer players if needed (for 3-player games)
      while (game.players.length < 3) {
        const computerPlayer = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: `Computer ${game.players.length}`,
          isHost: false,
          isHuman: false,
          roundMoney: 0,
          totalMoney: 0,
          prizes: [],
          specialCards: [],
          freeSpins: 0
        };
        game.players.push(computerPlayer);
      }
    }

    activeGames.set(gameCode, game);
    return { game, player: newPlayer };
  },

  removePlayer: (gameCode, playerId) => {
    const game = activeGames.get(gameCode);
    if (!game) return;
    
    game.players = game.players.filter(p => p.id !== playerId);
    
    if (game.players.length === 0) {
      activeGames.delete(gameCode);
    } else {
      activeGames.set(gameCode, game);
    }
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a game room
  socket.on('joinGame', ({ gameCode, player }) => {
    console.log(`Player ${player.name} joining game ${gameCode}`);
    
    socket.join(gameCode);
    
    let game = GameManager.getGame(gameCode);
    
    if (!game) {
      // Create new game if it doesn't exist
      game = GameManager.createGame(gameCode, player);
    } else {
      // Add player to existing game
      const result = GameManager.addPlayer(gameCode, player);
      if (result.error) {
        socket.emit('joinError', result.error);
        return;
      }
      player = result.player;
    }

    // Store player info in socket
    socket.gameCode = gameCode;
    socket.playerId = player.id;
    
    // Notify all players in the game
    io.to(gameCode).emit('gameStateUpdate', game);
    io.to(gameCode).emit('playerJoined', { player, game });
    
    console.log(`Player ${player.name} joined game ${gameCode}. Total players: ${game.players.length}`);
  });

  // Handle game state updates
  socket.on('gameStateUpdate', (gameState) => {
    const gameCode = socket.gameCode;
    if (!gameCode) return;
    
    GameManager.updateGame(gameCode, gameState);
    socket.to(gameCode).emit('gameStateUpdate', gameState);
  });

  // Handle wheel spin
  socket.on('wheelSpin', (spinData) => {
    const gameCode = socket.gameCode;
    if (!gameCode) return;
    
    io.to(gameCode).emit('wheelSpin', spinData);
  });

  // Handle letter guess
  socket.on('letterGuess', (guessData) => {
    const gameCode = socket.gameCode;
    if (!gameCode) return;
    
    io.to(gameCode).emit('letterGuess', guessData);
  });

  // Handle puzzle solve attempt
  socket.on('solveAttempt', (solveData) => {
    const gameCode = socket.gameCode;
    if (!gameCode) return;
    
    io.to(gameCode).emit('solveAttempt', solveData);
  });

  // Handle player ready
  socket.on('playerReady', () => {
    const gameCode = socket.gameCode;
    if (!gameCode) return;
    
    io.to(gameCode).emit('playerReady', { playerId: socket.playerId });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.gameCode && socket.playerId) {
      GameManager.removePlayer(socket.gameCode, socket.playerId);
      socket.to(socket.gameCode).emit('playerLeft', { playerId: socket.playerId });
    }
  });
});

// API endpoints
app.get('/api/games/:code', (req, res) => {
  const game = GameManager.getGame(req.params.code);
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

app.get('/api/games', (req, res) => {
  const games = Array.from(activeGames.values()).map(game => ({
    code: game.code,
    players: game.players.length,
    maxPlayers: game.maxPlayers,
    status: game.status,
    createdAt: game.createdAt
  }));
  res.json(games);
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for multiplayer games`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS origins: ${process.env.FRONTEND_URL || 'localhost:3000'}`);
}); 