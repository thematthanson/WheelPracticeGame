import { 
  ref, 
  set, 
  get, 
  onValue, 
  off, 
  push, 
  remove,
  update,
  serverTimestamp 
} from 'firebase/database';
import { database } from './firebase';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isHuman: boolean;
  roundMoney: number;
  totalMoney: number;
  prizes: any[];
  specialCards: string[];
  freeSpins: number;
  lastSeen: number;
}

export interface GameState {
  id: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  createdAt: number;
  players: { [key: string]: Player };
  currentPlayer: string;
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
  lastUpdated: number;
}

export class FirebaseGameService {
  private gameRef: any;
  private playerRef: any;
  private gameCode: string;
  private playerId: string;
  private listeners: { [key: string]: any } = {};

  constructor(gameCode: string, playerId: string) {
    this.gameCode = gameCode;
    this.playerId = playerId;
    this.gameRef = ref(database, `games/${gameCode}`);
    this.playerRef = ref(database, `games/${gameCode}/players/${playerId}`);
  }

  // Create a new game
  async createGame(hostPlayer: Player): Promise<GameState> {
    const gameState: GameState = {
      id: Date.now().toString(),
      code: this.gameCode,
      status: 'waiting',
      createdAt: Date.now(),
      players: {
        [hostPlayer.id]: {
          ...hostPlayer,
          isHost: true,
          lastSeen: Date.now()
        }
      },
      currentPlayer: hostPlayer.id,
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
      maxPlayers: 2,
      lastUpdated: Date.now()
    };

    await set(this.gameRef, gameState);
    return gameState;
  }

  // Join an existing game
  async joinGame(player: Player): Promise<{ game: GameState; player: Player }> {
    const snapshot = await get(this.gameRef);
    
    if (!snapshot.exists()) {
      throw new Error('Game not found');
    }

    const game = snapshot.val() as GameState;
    
    // Check if game is full
    if (Object.keys(game.players).length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    // Check if player name is already taken
    let finalPlayerName = player.name;
    let counter = 1;
    while (Object.values(game.players).some(p => p.name === finalPlayerName)) {
      finalPlayerName = `${player.name} ${counter}`;
      counter++;
    }

    const newPlayer = {
      ...player,
      name: finalPlayerName,
      isHost: false,
      lastSeen: Date.now()
    };

    // Add player to game
    await update(ref(database, `games/${this.gameCode}/players`), {
      [player.id]: newPlayer
    });

    // Update game status if we have enough players
    if (Object.keys(game.players).length + 1 >= game.maxPlayers) {
      await update(this.gameRef, {
        status: 'active',
        message: 'Game starting...',
        lastUpdated: Date.now()
      });
    }

    return { game, player: newPlayer };
  }

  // Listen to game state changes
  onGameStateChange(callback: (gameState: GameState) => void): () => void {
    const listener = onValue(this.gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameState = snapshot.val() as GameState;
        callback(gameState);
      }
    });

    this.listeners['gameState'] = listener;
    
    return () => {
      off(this.gameRef, 'value', listener);
      delete this.listeners['gameState'];
    };
  }

  // Update game state
  async updateGameState(updates: Partial<GameState>): Promise<void> {
    await update(this.gameRef, {
      ...updates,
      lastUpdated: Date.now()
    });
  }

  // Update player info
  async updatePlayer(updates: Partial<Player>): Promise<void> {
    await update(this.playerRef, {
      ...updates,
      lastSeen: Date.now()
    });
  }

  // Remove player from game
  async removePlayer(): Promise<void> {
    await remove(this.playerRef);
    
    // Check if game should be deleted
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      if (Object.keys(game.players).length === 0) {
        await remove(this.gameRef);
      }
    }
  }

  // Handle wheel spin
  async handleWheelSpin(spinData: any): Promise<void> {
    await update(this.gameRef, {
      isSpinning: true,
      wheelValue: spinData.value,
      wheelRotation: spinData.rotation,
      lastUpdated: Date.now()
    });
  }

  // Handle letter guess
  async handleLetterGuess(letter: string, playerId: string): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      const usedLetters = [...(game.usedLetters || []), letter];
      
      await update(this.gameRef, {
        usedLetters,
        lastUpdated: Date.now()
      });
    }
  }

  // Handle solve attempt
  async handleSolveAttempt(solution: string, playerId: string): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      
      // Check if solution is correct
      const isCorrect = game.puzzle?.solution?.toLowerCase() === solution.toLowerCase();
      
      if (isCorrect) {
        // Update player money and game state
        const player = game.players[playerId];
        if (player) {
          const newRoundMoney = player.roundMoney + (game.wheelValue?.value || 0);
          await update(ref(database, `games/${this.gameCode}/players/${playerId}`), {
            roundMoney: newRoundMoney,
            lastSeen: Date.now()
          });
        }
        
        await update(this.gameRef, {
          status: 'finished',
          message: `${player?.name || 'Player'} solved the puzzle!`,
          lastUpdated: Date.now()
        });
      }
    }
  }

  // Clean up listeners
  cleanup(): void {
    Object.values(this.listeners).forEach(listener => {
      if (listener) {
        off(this.gameRef, 'value', listener);
      }
    });
    this.listeners = {};
  }

  // Get current game state
  async getGameState(): Promise<GameState | null> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      return snapshot.val() as GameState;
    }
    return null;
  }

  // Check if game exists
  async gameExists(): Promise<boolean> {
    const snapshot = await get(this.gameRef);
    return snapshot.exists();
  }
} 