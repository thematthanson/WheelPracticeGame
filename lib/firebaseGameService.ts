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
    console.log(`Firebase: Game reference created for ${gameCode}, player ${playerId}`);
    console.log(`Firebase: Game path: games/${gameCode}`);
  }

  // Create a new game
  async createGame(hostPlayer: Player): Promise<GameState> {
    console.log(`Firebase: Creating new game ${this.gameCode} with host ${hostPlayer.name}`);
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
      maxPlayers: 3,
      lastUpdated: Date.now()
    };

    await set(this.gameRef, gameState);
    
    // Add computer players to fill remaining slots
    await this.addComputerPlayers();
    
    // Re-read game state (once computers added) – decide status
    const snapshotAfterComputers = await get(this.gameRef);
    const gameAfterComputers = snapshotAfterComputers.val() as GameState;
    const playerTotal = Object.keys(gameAfterComputers.players).length;

    await update(this.gameRef, {
      status: playerTotal === 3 ? 'active' : 'waiting',
      message: playerTotal === 3 ? 'Game starting with 3 players...' : `Waiting for players... (${playerTotal}/3)`,
      lastUpdated: Date.now()
    });

    return gameAfterComputers;
  }

  // Join an existing game
  async joinGame(player: Player): Promise<{ game: GameState; player: Player }> {
    console.log(`Firebase: Attempting to join game ${this.gameCode} as ${player.name}`);
    const snapshot = await get(this.gameRef);
    
    if (!snapshot.exists()) {
      console.log(`Firebase: Game ${this.gameCode} not found`);
      throw new Error('Game not found');
    }

    const game = snapshot.val() as GameState;
    console.log(`Firebase: Found game ${this.gameCode}, current players:`, Object.keys(game.players));
    
    // Check if this player is already in the game (by ID)
    if (game.players[player.id]) {
      console.log(`Firebase: Player ${player.name} already in game, returning existing player`);
      return { game, player: game.players[player.id] };
    }
    
    // Check if a player with the same name is already in the game
    const existingPlayerWithName = Object.values(game.players).find(p => p.name === player.name);
    if (existingPlayerWithName) {
      console.log(`Firebase: Player with name ${player.name} already exists, returning existing player`);
      return { game, player: existingPlayerWithName };
    }
    
    // Check if game is full - only count human players
    const humanCountBeforeJoin = Object.values(game.players).filter(p => p.isHuman).length;
    if (humanCountBeforeJoin >= game.maxPlayers) {
      throw new Error(`Game is full - maximum ${game.maxPlayers} human players allowed`);
    }

    // Use the original player name since we've already checked for duplicates
    const finalPlayerName = player.name;

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

    // Add computer players to fill remaining slots (always 3 total players)
    await this.addComputerPlayers();

    // Re-read game state (once computers added) – decide status
    const checkGame = await get(this.gameRef);
    const checkGameState = checkGame.val() as GameState;
    const totalPlayers = Object.keys(checkGameState.players).length;
    const humanCountAfterCheck = Object.values(checkGameState.players).filter(p => p.isHuman).length;

    // Only start the game if we have exactly 3 players and at least 1 human
    if (totalPlayers === 3 && humanCountAfterCheck >= 1) {
      await update(this.gameRef, {
        status: 'active',
        message: 'Game starting with 3 players...',
        lastUpdated: Date.now()
      });
    } else {
      await update(this.gameRef, {
        status: 'waiting',
        message: `Waiting for players... (${totalPlayers}/3)`,
        lastUpdated: Date.now()
      });
    }

    return { game: checkGameState, player: newPlayer };
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

  // Update game state (for synchronizing puzzle, turns, etc.)
  async updateGameState(updates: Partial<GameState>): Promise<void> {
    console.log(`Firebase: Updating game ${this.gameCode} with:`, updates);
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

  // ---- Multiplayer helper wrappers (used by host UI) ----

  /**
   * Host pushes the result of a wheel spin (value + rotation angle).
   * Guests will receive these via the onGameStateChange listener.
   */
  async pushSpin(spinData: { value: number | string; rotation: number }): Promise<void> {
    await this.handleWheelSpin(spinData);
  }

  /**
   * Host pushes a consonant or vowel guess. The Firebase document maintains
   * a union set of usedLetters so all clients stay in sync.
   */
  async pushLetterGuess(letter: string, playerId: string): Promise<void> {
    await this.handleLetterGuess(letter, playerId);
  }

  /**
   * Host attempts to solve the current puzzle. If correct, the game status
   * is set to "finished" and a winning message is broadcast.
   */
  async pushSolveAttempt(solution: string, playerId: string): Promise<void> {
    await this.handleSolveAttempt(solution, playerId);
  }

  /**
   * End the current player’s turn and move play to the next player.
   * This uses a simple round-robin advance based on the players object.
   */
  async endTurn(nextPlayerId: string): Promise<void> {
    await update(this.gameRef, {
      currentPlayer: nextPlayerId,
      turnInProgress: false,
      lastUpdated: Date.now()
    });
  }

  // Add computer players to fill remaining slots (always 3 total players)
  async addComputerPlayers(): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (!snapshot.exists()) return;

    const game = snapshot.val() as GameState;
    const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
    const computerPlayers = Object.values(game.players).filter(p => !p.isHuman);
    
    const humanPlayerCount = humanPlayers.length;
    const computerPlayerCount = computerPlayers.length;
    
    // We want exactly 3 total players: humans + computers
    const totalPlayersNeeded = 3;
    const computersNeeded = Math.max(0, totalPlayersNeeded - humanPlayerCount);
    const computersToRemove = Math.max(0, computerPlayerCount - computersNeeded);

    console.log(`Firebase: Player counts - ${humanPlayerCount} humans, ${computerPlayerCount} computers`);
    console.log(`Firebase: Need ${computersNeeded} computers, removing ${computersToRemove} excess computers`);

    // Only manage computer players if game is still in waiting state
    if (game.status === 'waiting') {
      // Remove excess computer players first
      if (computersToRemove > 0) {
        const computersToDelete = computerPlayers.slice(0, computersToRemove);
        const deleteUpdates: { [key: string]: any } = {};
        
        for (const computer of computersToDelete) {
          deleteUpdates[computer.id] = null;
        }
        
        await update(ref(database, `games/${this.gameCode}/players`), deleteUpdates);
        console.log(`Firebase: Removed ${computersToRemove} excess computer players`);
      }

      // Add needed computer players
      const currentComputerCount = computerPlayerCount - computersToRemove;
      const newComputersNeeded = computersNeeded - currentComputerCount;
      
      if (newComputersNeeded > 0) {
        const newComputerPlayers: { [key: string]: Player } = {};
        
        for (let i = 0; i < newComputersNeeded; i++) {
          const computerId = `computer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const computerName = `Computer ${i + 1}`;
          
          newComputerPlayers[computerId] = {
            id: computerId,
            name: computerName,
            isHost: false,
            isHuman: false,
            roundMoney: 0,
            totalMoney: 0,
            prizes: [],
            specialCards: [],
            freeSpins: 0,
            lastSeen: Date.now()
          };
        }

        if (Object.keys(newComputerPlayers).length > 0) {
          await update(ref(database, `games/${this.gameCode}/players`), newComputerPlayers);
          console.log(`Firebase: Added ${newComputersNeeded} computer players:`, Object.keys(newComputerPlayers));
        }
      }
    } else {
      console.log(`Firebase: Game is ${game.status}, skipping computer player management`);
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

  // Debug method to clear the game completely
  async clearGame(): Promise<void> {
    try {
      await remove(this.gameRef);
      console.log('Game data cleared');
    } catch (error) {
      console.error('Error clearing game:', error);
    }
  }
} 