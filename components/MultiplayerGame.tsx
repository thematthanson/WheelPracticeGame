import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { io, Socket } from 'socket.io-client';
import WheelOfFortune from './WheelOfFortune';

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isHuman: boolean;
  roundMoney: number;
  totalMoney: number;
  prizes: any[];
  specialCards: string[];
  freeSpins: number;
}

interface GameState {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  players: Player[];
  currentPlayer: number;
  currentRound: number;
  puzzle: any;
  usedLetters: string[];
  wheelValue: any;
  isSpinning: boolean;
  wheelRotation: number;
  turnInProgress: boolean;
  lastSpinResult: any;
  landedSegmentIndex: number;
  message: string;
  isFinalRound: boolean;
  finalRoundLettersRemaining: number;
  finalRoundVowelsRemaining: number;
  isBonusRound: boolean;
  bonusRoundTimeRemaining: number;
  bonusRoundPuzzle: any;
  bonusRoundEnvelope: any;
  bonusRoundEnvelopeValue: any;
  maxPlayers: number;
}

interface MultiplayerGameProps {
  gameCode: string;
  playerName: string;
}

export default function MultiplayerGame({ gameCode, playerName }: MultiplayerGameProps) {
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get WebSocket server URL from environment or default to localhost
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3005';
    
    // Connect to WebSocket server
    const newSocket = io(wsUrl);
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Handle connection
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      
      // Join the game
      const player = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: playerName,
        isHost: false,
        isHuman: true,
        roundMoney: 0,
        totalMoney: 0,
        prizes: [],
        specialCards: [],
        freeSpins: 0
      };

      newSocket.emit('joinGame', { gameCode, player });
    });

    // Handle game state updates
    newSocket.on('gameStateUpdate', (updatedGameState: GameState) => {
      console.log('Game state updated:', updatedGameState);
      setGameState(updatedGameState);
      
      // Find current player
      const player = updatedGameState.players.find(p => p.name === playerName);
      setCurrentPlayer(player || null);
    });

    // Handle join errors
    newSocket.on('joinError', (error: string) => {
      console.error('Join error:', error);
      setError(error);
    });

    // Handle player joined
    newSocket.on('playerJoined', ({ player, game }) => {
      console.log('Player joined:', player.name);
      setGameState(game);
    });

    // Handle player left
    newSocket.on('playerLeft', ({ playerId }) => {
      console.log('Player left:', playerId);
      // Update game state to remove the player
      if (gameState) {
        const updatedGameState = {
          ...gameState,
          players: gameState.players.filter(p => p.id !== playerId)
        };
        setGameState(updatedGameState);
      }
    });

    // Handle wheel spin
    newSocket.on('wheelSpin', (spinData) => {
      console.log('Wheel spin received:', spinData);
      // Handle wheel spin synchronization
    });

    // Handle letter guess
    newSocket.on('letterGuess', (guessData) => {
      console.log('Letter guess received:', guessData);
      // Handle letter guess synchronization
    });

    // Handle solve attempt
    newSocket.on('solveAttempt', (solveData) => {
      console.log('Solve attempt received:', solveData);
      // Handle solve attempt synchronization
    });

    // Handle disconnect
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    return () => {
      newSocket.close();
    };
  }, [gameCode, playerName]);

  const handleBack = () => {
    if (socket) {
      socket.disconnect();
    }
    router.push('/multiplayer');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Connection Error</h1>
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Multiplayer
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Connecting to server...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
      {/* Game Header */}
      <div className="bg-purple-800 bg-opacity-50 p-4 text-center">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            ← Back
          </button>
          <div>
            <h1 className="text-xl font-bold">Game Code: {gameCode}</h1>
            <p className="text-sm text-purple-200">
              {gameState.players.length} players joined
            </p>
            <p className="text-xs text-green-300">
              {connected ? '🟢 Connected' : '🔴 Disconnected'}
            </p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Players List */}
      <div className="bg-blue-800 bg-opacity-30 p-4 mb-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-200 mb-2">Players:</h3>
          <div className="flex flex-wrap gap-2">
            {gameState.players.map((player, index) => (
              <div
                key={player.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  player.name === playerName
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {player.name} {player.isHost ? '(Host)' : ''}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Status */}
      {gameState.status === 'waiting' && (
        <div className="bg-yellow-600 bg-opacity-30 p-4 text-center">
          <p className="text-yellow-200">
            Waiting for players to join... ({gameState.players.length}/{gameState.maxPlayers})
          </p>
        </div>
      )}

      {/* Game Component */}
      {gameState.status === 'active' && (
        <WheelOfFortune />
      )}
    </div>
  );
} 