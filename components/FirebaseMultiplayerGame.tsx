import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import WheelOfFortune from './WheelOfFortune';
import MultiplayerWheelOfFortune from './MultiplayerWheelOfFortune';
import { FirebaseGameService, Player, GameState } from '../lib/firebaseGameService';
import { vLog } from '../lib/logger';

// Simplified puzzle templates for multiplayer
const SIMPLE_PUZZLES = {
  PHRASE: [
    "GREAT IDEA", "HAPPY BIRTHDAY", "GOOD LUCK", "SWEET DREAMS", "BEST WISHES",
    "TRUE LOVE", "BRIGHT FUTURE", "PERFECT TIMING", "FRESH START", "GOLDEN OPPORTUNITY",
    "SECOND CHANCE", "WILD GUESS", "LAST RESORT", "COMMON SENSE", "PIECE OF CAKE",
    "BREAK A LEG", "BITE THE BULLET", "SPILL THE BEANS", "BREAK THE ICE", "CALL IT A DAY",
    "CROSS YOUR FINGERS", "EASY AS PIE", "ONCE IN A LIFETIME", "BETTER LATE THAN NEVER",
    "ACTIONS SPEAK LOUDER THAN WORDS", "PRACTICE MAKES PERFECT", "TIME IS MONEY",
    "KNOWLEDGE IS POWER", "LAUGHTER IS THE BEST MEDICINE", "HONESTY IS THE BEST POLICY"
  ],
  PERSON: [
    "FAMOUS ACTOR", "MOVIE STAR", "ROCK STAR", "BASKETBALL PLAYER", "FOOTBALL PLAYER",
    "TENNIS PLAYER", "GOLF PLAYER", "RACE CAR DRIVER", "ASTRONAUT", "SCIENTIST",
    "INVENTOR", "ARTIST", "MUSICIAN", "SINGER", "DANCER", "COMEDIAN", "MAGICIAN"
  ],
  PLACE: [
    "NEW YORK CITY", "LOS ANGELES", "CHICAGO", "MIAMI", "SEATTLE", "DENVER",
    "GRAND CANYON", "YELLOWSTONE", "CENTRAL PARK", "TIMES SQUARE", "GOLDEN GATE BRIDGE",
    "STATUE OF LIBERTY", "WHITE HOUSE", "EMPIRE STATE BUILDING", "HOLLYWOOD SIGN"
  ],
  THING: [
    "BIRTHDAY CAKE", "WEDDING DRESS", "SPORTS CAR", "LAPTOP COMPUTER", "CELL PHONE",
    "TELEVISION", "REFRIGERATOR", "WASHING MACHINE", "VACUUM CLEANER", "MICROWAVE OVEN",
    "COFFEE MAKER", "ALARM CLOCK", "CAMERA", "BICYCLE", "MOTORCYCLE"
  ]
};

// Simple puzzle generator
const generateMultiplayerPuzzle = () => {
  const categories = Object.keys(SIMPLE_PUZZLES);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const puzzles = SIMPLE_PUZZLES[randomCategory as keyof typeof SIMPLE_PUZZLES];
  const randomPuzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  
  return {
    text: randomPuzzle.toUpperCase(),
    category: randomCategory,
    revealed: [],
    specialFormat: null
  };
};

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
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [customTheme, setCustomTheme] = useState<string>('');
  const cleanupRef = useRef<(() => void) | null>(null);
  const hasJoinedRef = useRef(false);
  const playerIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate joins - check and set atomically
    if (hasJoinedRef.current) {
      vLog('Duplicate join attempt prevented');
      return;
    }
    hasJoinedRef.current = true;
    
    // Generate (or retrieve) a stable player ID that survives React StrictMode remounts
    if (!playerIdRef.current) {
      // Try to restore from localStorage first
      const storageKey = `wheel_playerId_${gameCode}_${playerName}`;
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem(storageKey);
        if (storedId) {
          playerIdRef.current = storedId;
        }
      }

      // If none found, generate a new one and save it
      if (!playerIdRef.current) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        const nameHash = playerName.replace(/\s+/g, '').toLowerCase();
        playerIdRef.current = `${nameHash}_${timestamp}_${random}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, playerIdRef.current);
        }
      }
    }
    
    const playerId = playerIdRef.current;
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

        // Small delay to ensure Firebase operations are complete
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if game exists
        const gameExists = await service.gameExists();
        vLog(`Game ${gameCode} exists:`, gameExists);
        vLog(`Checking for game with code: ${gameCode}`);
        
        if (gameExists) {
          // Game exists - join it
          vLog(`Player ${player.name} joining existing game ${gameCode}`);
          const result = await service.joinGame(player);
          setGameState(result.game);
          setCurrentPlayer(result.player);
        } else {
          // Game doesn't exist - create it (this player becomes host)
          vLog(`Player ${player.name} creating new game ${gameCode}`);
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
          vLog(`Real-time update for game ${gameCode}:`, updatedGameState);
          vLog(`Players in updated game:`, Object.keys(updatedGameState.players));
          setGameState(updatedGameState);
          
          // Find current player – primary by ID, fallback by name (handles rare ID mismatch)
          let player: Player | null = updatedGameState.players[playerId] || null;
          if (!player) {
            player = Object.values(updatedGameState.players).find(p => p.name === playerName) || null;
            if (player) {
              vLog('Player ID mismatch – recovered player by name');
              // Persist recovered ID to localStorage for future look-ups
              const storageKey = `wheel_playerId_${gameCode}_${playerName}`;
              if (typeof window !== 'undefined') {
                localStorage.setItem(storageKey, player.id);
              }
              playerIdRef.current = player.id;
            }
          }
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

  /* ------------------------------------------------------------------
   * Host “Begin Game” button – generates puzzle explicitly so guests
   * leave the lobby only when the host decides to start.
   * ------------------------------------------------------------------ */
  const handleBeginGame = useCallback(async () => {
    if (!gameService || !currentPlayer?.isHost || gameState?.puzzle) return;

    if (!selectedTheme) {
      setShowThemeSelector(true);
      return;
    }

    vLog('Host generating puzzle with theme:', selectedTheme);
    await gameService.generateNewPuzzle(selectedTheme);
    
    // Ensure host goes first
    await gameService.startGame();
    
    await gameService.updateGameState({
      message: 'Game started! Host goes first!',
      status: 'active'
    });
    
    setShowThemeSelector(false);
    setSelectedTheme('');
    setCustomTheme('');
  }, [gameService, currentPlayer?.isHost, gameState?.puzzle, selectedTheme]);

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
  const humanPlayerCount = players.filter(p => p.isHuman).length;
  
  vLog(`UI: Game ${gameCode} has ${playerCount} total players:`, players.map(p => p.name));
  vLog(`UI: ${humanPlayerCount} humans, ${playerCount - humanPlayerCount} computers`);
  vLog(`UI: Current player is:`, currentPlayer?.name);

  const hasPuzzle = Boolean(gameState.puzzle);

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

      {/* Players List – hide once a puzzle is available */}
      {!hasPuzzle && (
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
                    : player.isHuman
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-200'
                }`}
              >
                {player.name} {player.isHost ? '👑' : ''} {!player.isHuman && '🤖'}
                {player.roundMoney > 0 && ` - $${player.roundMoney}`}
              </div>
            ))}
          </div>
          
          <div className="mt-2 text-sm text-blue-200">
            {humanPlayerCount} human player{humanPlayerCount !== 1 ? 's' : ''}, 
            {' '}{playerCount - humanPlayerCount} computer player{playerCount - humanPlayerCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      )}

      {/* Host Begin Game button */}
      {currentPlayer?.isHost && !hasPuzzle && gameState.status === 'active' && (
        <div className="text-center my-6">
          {!showThemeSelector ? (
            <button
              onClick={handleBeginGame}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 touch-manipulation"
            >
              Begin Game
            </button>
          ) : (
            <div className="bg-blue-800 bg-opacity-50 p-6 rounded-lg max-w-md mx-auto">
              <h3 className="text-lg font-bold text-yellow-200 mb-4">Choose Puzzle Theme</h3>
              <div className="space-y-3">
                {['PHRASE', 'BEFORE & AFTER', 'RHYME TIME'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setSelectedTheme(theme);
                      handleBeginGame();
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {theme}
                  </button>
                ))}
                
                {/* Custom Theme Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-200">
                    Custom Theme (optional):
                  </label>
                  <input
                    type="text"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="e.g., MOVIES, FOOD, SPORTS..."
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  {customTheme && (
                    <button
                      onClick={() => {
                        setSelectedTheme(customTheme.toUpperCase());
                        handleBeginGame();
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Use Custom Theme: {customTheme.toUpperCase()}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={() => setShowThemeSelector(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Game Status */}
      {!hasPuzzle && gameState.status === 'waiting' && (
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
      {hasPuzzle && gameService && (
        <MultiplayerWheelOfFortune
          gameState={gameState}
          currentPlayer={currentPlayer}
          isHost={!!currentPlayer?.isHost}
          service={gameService}
        />
      )}

      {/* Game Message */}
      {gameState.message && (hasPuzzle || gameState.status !== 'waiting') && (
        <div className="bg-blue-600 bg-opacity-30 p-4 text-center">
          <p className="text-blue-200">{gameState.message}</p>
        </div>
      )}
    </div>
  );
} 