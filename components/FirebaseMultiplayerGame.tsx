import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import WheelOfFortune from './WheelOfFortune';
import { FirebaseGameService, Player, GameState } from '../lib/firebaseGameService';

interface FirebaseMultiplayerGameProps {
  gameCode: string;
  playerName: string;
}

export default function FirebaseMultiplayerGame({ gameCode, playerName }: FirebaseMultiplayerGameProps) {
  const router = useRouter();
  const [gameService, setGameService] = useState<FirebaseGameService | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isJoining, setIsJoining] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const playerId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const service = new FirebaseGameService(gameCode, playerId);
    setGameService(service);

    const joinGame = async () => {
      try {
        setIsJoining(true);
        setError('');

        const player: Player = {
          id: playerId,
          name: playerName,
          isHost: false,
          isHuman: true,
          roundMoney: 0,
          totalMoney: 0,
          prizes: [],
          specialCards: [],
          freeSpins: 0,
          lastSeen: Date.now()
        };

        // Check if game exists
        const gameExists = await service.gameExists();
        
        if (gameExists) {
          // Join existing game
          const result = await service.joinGame(player);
          setGameState(result.game);
          setCurrentPlayer(result.player);
        } else {
          // Create new game
          const newGame = await service.createGame({
            ...player,
            isHost: true
          });
          setGameState(newGame);
          setCurrentPlayer({
            ...player,
            isHost: true
          });
        }

        setConnected(true);

        // Set up real-time listener
        const cleanup = service.onGameStateChange((updatedGameState) => {
          console.log('Game state updated:', updatedGameState);
          setGameState(updatedGameState);
          
          // Find current player
          const player = updatedGameState.players[playerId];
          setCurrentPlayer(player || null);
        });

        cleanupRef.current = cleanup;

      } catch (err) {
        console.error('Error joining game:', err);
        setError(err instanceof Error ? err.message : 'Failed to join game');
      } finally {
        setIsJoining(false);
      }
    };

    joinGame();

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (service) {
        service.removePlayer();
        service.cleanup();
      }
    };
  }, [gameCode, playerName]);

  const handleBack = () => {
    if (gameService) {
      gameService.removePlayer();
      gameService.cleanup();
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

  if (isJoining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Joining game...</p>
        </div>
      </div>
    );
  }

  if (!connected || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  const players = Object.values(gameState.players);
  const playerCount = players.length;

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
              {playerCount} players joined
            </p>
            <p className="text-xs text-green-300">
              {connected ? '🟢 Connected to Firebase' : '🔴 Disconnected'}
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
            {players.map((player) => (
              <div
                key={player.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  player.name === playerName
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                {player.name} {player.isHost ? '(Host)' : ''}
                {player.roundMoney > 0 && ` - $${player.roundMoney}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Game Status */}
      {gameState.status === 'waiting' && (
        <div className="bg-yellow-600 bg-opacity-30 p-4 text-center">
          <p className="text-yellow-200">
            Waiting for players to join... ({playerCount}/{gameState.maxPlayers})
          </p>
          <p className="text-sm text-yellow-100 mt-2">
            Share this game code with other players: <span className="font-mono bg-yellow-800 px-2 py-1 rounded">{gameCode}</span>
          </p>
        </div>
      )}

      {gameState.status === 'finished' && (
        <div className="bg-green-600 bg-opacity-30 p-4 text-center">
          <p className="text-green-200 text-lg font-bold">{gameState.message}</p>
        </div>
      )}

      {/* Game Component */}
      {gameState.status === 'active' && (
        <div className="max-w-4xl mx-auto">
          <WheelOfFortune />
        </div>
      )}

      {/* Game Message */}
      {gameState.message && gameState.status !== 'waiting' && (
        <div className="bg-blue-600 bg-opacity-30 p-4 text-center">
          <p className="text-blue-200">{gameState.message}</p>
        </div>
      )}
    </div>
  );
} 