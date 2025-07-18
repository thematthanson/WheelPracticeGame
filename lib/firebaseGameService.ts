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
import { vLog } from './logger';

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
  gameHistory: GameHistoryEntry[];
}

export interface GameHistoryEntry {
  type: 'letter' | 'solve';
  playerId: string;
  playerName: string;
  value: string;
  timestamp: number;
  result?: 'correct' | 'incorrect';
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
    vLog(`Firebase: Game reference created for ${gameCode}, player ${playerId}`);
    vLog(`Firebase: Game path: games/${gameCode}`);
  }

  // Create a new game
  async createGame(hostPlayer: Player): Promise<GameState> {
    vLog(`Firebase: Creating new game ${this.gameCode} with host ${hostPlayer.name}`);
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
      lastUpdated: Date.now(),
      gameHistory: []
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
    vLog(`Firebase: Attempting to join game ${this.gameCode} as ${player.name}`);
    const snapshot = await get(this.gameRef);
    
    if (!snapshot.exists()) {
      console.log(`Firebase: Game ${this.gameCode} not found`);
      throw new Error('Game not found');
    }

    const game = snapshot.val() as GameState;
    vLog(`Firebase: Found game ${this.gameCode}, current players:`, Object.keys(game.players));
    
    // Check if this player is already in the game (by ID)
    if (game.players[player.id]) {
      vLog(`Firebase: Player ${player.name} already in game, returning existing player`);
      return { game, player: game.players[player.id] };
    }
    
    // Check if a player with the same name is already in the game
    const existingPlayerWithName = Object.values(game.players).find(p => p.name === player.name);
    if (existingPlayerWithName) {
      vLog(`Firebase: Player with name ${player.name} already exists, returning existing player`);
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
    const postAddSnap = await get(this.gameRef);
    const postAddGame = postAddSnap.val() as GameState;
    const totalPlayers = Object.keys(postAddGame.players).length;
    const humanPlayerCount = Object.values(postAddGame.players).filter(p => p.isHuman).length;

    // Only start the game if we have exactly 3 players and at least 1 human
    if (totalPlayers === 3 && humanPlayerCount >= 1) {
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

    return { game: postAddGame, player: newPlayer };
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
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      
      console.log('🎯 WHEEL SPIN HANDLER:', {
        currentPlayer: game.currentPlayer,
        spinValue: spinData.value,
        spinRotation: spinData.rotation,
        timestamp: new Date().toISOString()
      });
      
      // Handle special wheel segments
      let nextPlayerId = game.currentPlayer;
      let message = '';
      
      if (spinData.value === 'BANKRUPT' || (typeof spinData.value === 'object' && spinData.value && spinData.value.type === 'BANKRUPT')) {
        console.log('💸 BANKRUPT detected - resetting player money and advancing turn');
        
        // Reset current player's round money
        if (game.players[game.currentPlayer]) {
          await update(ref(database, `games/${this.gameCode}/players/${game.currentPlayer}`), {
            roundMoney: 0,
            lastSeen: Date.now()
          });
        }
        
        // Find next human player
        const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
        
        console.log('👥 Human players for BANKRUPT turn advancement:', humanPlayers.map(p => ({ id: p.id, name: p.name })));
        
        // Validate we have human players
        if (humanPlayers.length === 0) {
          console.error('❌ No human players found for BANKRUPT turn advancement');
          return;
        }
        
        // If only one human player, they keep their turn
        if (humanPlayers.length === 1) {
          nextPlayerId = humanPlayers[0].id;
          console.log('👤 Single human player - keeping turn:', nextPlayerId);
        } else {
          // Find current player in human players list
          const currentPlayerIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          console.log('🔍 Current player index in human players:', currentPlayerIndex);
          
          if (currentPlayerIndex !== -1) {
            const nextIndex = (currentPlayerIndex + 1) % humanPlayers.length;
            nextPlayerId = humanPlayers[nextIndex].id;
            console.log('➡️ Advancing to next human player:', {
              currentIndex: currentPlayerIndex,
              nextIndex,
              nextPlayerId,
              nextPlayerName: humanPlayers[nextIndex].name
            });
          } else {
            // Current player not found in human players, default to first human
            nextPlayerId = humanPlayers[0].id;
            console.log('⚠️ Current player not found in human players, defaulting to first:', nextPlayerId);
          }
        }
        
        // Validate the next player is different from current
        if (nextPlayerId === game.currentPlayer && humanPlayers.length > 1) {
          console.warn('⚠️ BANKRUPT turn advancement would result in same player, forcing advancement');
          const currentIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          const nextIndex = (currentIndex + 1) % humanPlayers.length;
          nextPlayerId = humanPlayers[nextIndex].id;
          console.log('🔄 Forced advancement to:', nextPlayerId);
        }
        
        message = 'BANKRUPT! You lose your round money and any prizes from this round.';
      } else if (spinData.value === 'LOSE A TURN' || (typeof spinData.value === 'object' && spinData.value && spinData.value.type === 'LOSE A TURN')) {
        console.log('⏭️ LOSE A TURN detected - advancing to next human player');
        
        // Find next human player
        const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
        
        console.log('👥 Human players for LOSE A TURN advancement:', humanPlayers.map(p => ({ id: p.id, name: p.name })));
        
        // Validate we have human players
        if (humanPlayers.length === 0) {
          console.error('❌ No human players found for LOSE A TURN advancement');
          return;
        }
        
        // If only one human player, they keep their turn
        if (humanPlayers.length === 1) {
          nextPlayerId = humanPlayers[0].id;
          console.log('👤 Single human player - keeping turn:', nextPlayerId);
        } else {
          // Find current player in human players list
          const currentPlayerIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          console.log('🔍 Current player index in human players:', currentPlayerIndex);
          
          if (currentPlayerIndex !== -1) {
            const nextIndex = (currentPlayerIndex + 1) % humanPlayers.length;
            nextPlayerId = humanPlayers[nextIndex].id;
            console.log('➡️ Advancing to next human player:', {
              currentIndex: currentPlayerIndex,
              nextIndex,
              nextPlayerId,
              nextPlayerName: humanPlayers[nextIndex].name
            });
          } else {
            // Current player not found in human players, default to first human
            nextPlayerId = humanPlayers[0].id;
            console.log('⚠️ Current player not found in human players, defaulting to first:', nextPlayerId);
          }
        }
        
        // Validate the next player is different from current
        if (nextPlayerId === game.currentPlayer && humanPlayers.length > 1) {
          console.warn('⚠️ LOSE A TURN advancement would result in same player, forcing advancement');
          const currentIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          const nextIndex = (currentIndex + 1) % humanPlayers.length;
          nextPlayerId = humanPlayers[nextIndex].id;
          console.log('🔄 Forced advancement to:', nextPlayerId);
        }
        
        message = 'LOSE A TURN!';
      }
      
      console.log('✅ Final turn advancement result:', {
        from: game.currentPlayer,
        to: nextPlayerId,
        message
      });
      
      // Persist spin result and immediately mark the wheel as stopped so all clients stay in sync
      await update(this.gameRef, {
        isSpinning: false,
        wheelValue: spinData.value,
        wheelRotation: spinData.rotation,
        lastSpinResult: spinData.value,
        currentPlayer: nextPlayerId,
        message: message || game.message,
        lastUpdated: Date.now()
      });
    }
  }

  // Handle letter guess
  async handleLetterGuess(letter: string, playerId: string): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      
      console.log('🔤 LETTER GUESS HANDLER:', {
        letter,
        playerId,
        currentPlayer: game.currentPlayer,
        isCurrentPlayer: playerId === game.currentPlayer,
        timestamp: new Date().toISOString()
      });
      
      // Validate it's the current player's turn
      if (playerId !== game.currentPlayer) {
        console.warn('⚠️ Letter guess from wrong player:', {
          guessPlayerId: playerId,
          currentPlayerId: game.currentPlayer
        });
        return;
      }
      
      const puzzle = game.puzzle;
      if (!puzzle) {
        console.error('❌ No puzzle available for letter guess');
        return;
      }
      
      // Check if letter is in puzzle
      const letterInPuzzle = puzzle.text.includes(letter);
      console.log('🔍 Letter check result:', {
        letter,
        puzzleText: puzzle.text,
        letterInPuzzle,
        usedLetters: game.usedLetters
      });
      
      // Update used letters – tolerate Set, object, or undefined
      const currentUsedLetters = Array.isArray(game.usedLetters)
        ? game.usedLetters
        : game.usedLetters && typeof game.usedLetters === 'object'
          ? Object.values(game.usedLetters as any)
          : [];
      const usedLetters = [...currentUsedLetters, letter];
      
      // Update game history
      const gameHistory = [...(game.gameHistory || []), {
        type: 'letter',
        playerId,
        playerName: game.players[playerId]?.name || 'Unknown',
        value: letter,
        timestamp: Date.now(),
        result: letterInPuzzle ? 'correct' : 'incorrect'
      }];
      
      let nextPlayerId = game.currentPlayer;
      
      if (letterInPuzzle) {
        console.log('✅ Correct letter guess - player continues turn');
        // Player continues their turn
        nextPlayerId = game.currentPlayer;
      } else {
        console.log('❌ Incorrect letter guess - advancing to next human player');
        
        // Find next human player for turn advancement
        const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
        
        console.log('👥 Human players for letter guess turn advancement:', humanPlayers.map(p => ({ id: p.id, name: p.name })));
        
        // Validate we have human players
        if (humanPlayers.length === 0) {
          console.error('❌ No human players found for turn advancement');
          return;
        }
        
        // If only one human player, they keep their turn
        if (humanPlayers.length === 1) {
          nextPlayerId = humanPlayers[0].id;
          console.log('👤 Single human player - keeping turn:', nextPlayerId);
        } else {
          // Find current player in human players list
          const currentPlayerIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          console.log('🔍 Current player index in human players:', currentPlayerIndex);
          
          if (currentPlayerIndex !== -1) {
            const nextIndex = (currentPlayerIndex + 1) % humanPlayers.length;
            nextPlayerId = humanPlayers[nextIndex].id;
            console.log('➡️ Advancing to next human player:', {
              currentIndex: currentPlayerIndex,
              nextIndex,
              nextPlayerId,
              nextPlayerName: humanPlayers[nextIndex].name
            });
          } else {
            // Current player not found in human players, default to first human
            nextPlayerId = humanPlayers[0].id;
            console.log('⚠️ Current player not found in human players, defaulting to first:', nextPlayerId);
          }
        }
        
        // Validate the next player is different from current
        if (nextPlayerId === game.currentPlayer && humanPlayers.length > 1) {
          console.warn('⚠️ Turn advancement would result in same player, forcing advancement');
          const currentIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          const nextIndex = (currentIndex + 1) % humanPlayers.length;
          nextPlayerId = humanPlayers[nextIndex].id;
          console.log('🔄 Forced advancement to:', nextPlayerId);
        }
      }
      
      console.log('✅ Final letter guess turn result:', {
        letter,
        correct: letterInPuzzle,
        from: game.currentPlayer,
        to: nextPlayerId
      });
      
      await update(this.gameRef, {
        usedLetters,
        gameHistory,
        currentPlayer: nextPlayerId,
        wheelValue: letterInPuzzle ? game.wheelValue : null, // Reset wheel value for incorrect guesses
        lastUpdated: Date.now()
      });
    }
  }

  // Handle solve attempt
  async handleSolveAttempt(solution: string, playerId: string): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      
      console.log('🧩 SOLVE ATTEMPT HANDLER:', {
        solution,
        playerId,
        currentPlayer: game.currentPlayer,
        isCurrentPlayer: playerId === game.currentPlayer,
        puzzleText: game.puzzle?.text,
        timestamp: new Date().toISOString()
      });
      
      // Validate it's the current player's turn
      if (playerId !== game.currentPlayer) {
        console.warn('⚠️ Solve attempt from wrong player:', {
          attemptPlayerId: playerId,
          currentPlayerId: game.currentPlayer
        });
        return;
      }
      
      const puzzle = game.puzzle;
      if (!puzzle) {
        console.error('❌ No puzzle available for solve attempt');
        return;
      }
      
      const player = game.players[playerId];
      const isCorrect = solution.toUpperCase() === puzzle.text.toUpperCase();
      
      console.log('🔍 Solve attempt result:', {
        attempt: solution,
        correctAnswer: puzzle.text,
        isCorrect,
        playerName: player?.name
      });
      
      // Update game history
      const gameHistory = [...(game.gameHistory || []), {
        type: 'solve',
        playerId,
        playerName: player?.name || 'Unknown',
        value: solution,
        timestamp: Date.now(),
        result: isCorrect ? 'correct' : 'incorrect'
      }];
      
      if (isCorrect) {
        console.log('🎉 Correct solve attempt - game finished!');
        
        // Update player money and game state
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
          gameHistory,
          lastUpdated: Date.now()
        });
      } else {
        console.log('❌ Incorrect solve attempt - advancing to next human player');
        
        // Handle incorrect solve attempt - advance to next human player
        const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
        
        console.log('👥 Human players for solve attempt turn advancement:', humanPlayers.map(p => ({ id: p.id, name: p.name })));
        
        // Validate we have human players
        if (humanPlayers.length === 0) {
          console.error('❌ No human players found for solve attempt turn advancement');
          return;
        }
        
        let nextPlayerId = game.currentPlayer;
        
        // If only one human player, they keep their turn
        if (humanPlayers.length === 1) {
          nextPlayerId = humanPlayers[0].id;
          console.log('👤 Single human player - keeping turn:', nextPlayerId);
        } else {
          // Find current player in human players list
          const currentPlayerIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          console.log('🔍 Current player index in human players:', currentPlayerIndex);
          
          if (currentPlayerIndex !== -1) {
            const nextIndex = (currentPlayerIndex + 1) % humanPlayers.length;
            nextPlayerId = humanPlayers[nextIndex].id;
            console.log('➡️ Advancing to next human player:', {
              currentIndex: currentPlayerIndex,
              nextIndex,
              nextPlayerId,
              nextPlayerName: humanPlayers[nextIndex].name
            });
          } else {
            // Current player not found in human players, default to first human
            nextPlayerId = humanPlayers[0].id;
            console.log('⚠️ Current player not found in human players, defaulting to first:', nextPlayerId);
          }
        }
        
        // Validate the next player is different from current
        if (nextPlayerId === game.currentPlayer && humanPlayers.length > 1) {
          console.warn('⚠️ Solve attempt turn advancement would result in same player, forcing advancement');
          const currentIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
          const nextIndex = (currentIndex + 1) % humanPlayers.length;
          nextPlayerId = humanPlayers[nextIndex].id;
          console.log('🔄 Forced advancement to:', nextPlayerId);
        }
        
        console.log('✅ Final solve attempt turn result:', {
          correct: isCorrect,
          from: game.currentPlayer,
          to: nextPlayerId
        });
        
        // Update game history and turn for incorrect solve attempt
        await update(this.gameRef, {
          gameHistory,
          currentPlayer: nextPlayerId,
          message: `Incorrect solve attempt! ${game.players[nextPlayerId]?.name || 'Next player'}'s turn.`,
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
   * End the current player's turn and move play to the next player.
   * This uses a simple round-robin advance based on the players object.
   */
  async endTurn(nextPlayerId: string): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (snapshot.exists()) {
      const game = snapshot.val() as GameState;
      
      console.log('🔄 END TURN HANDLER:', {
        currentPlayer: game.currentPlayer,
        nextPlayerId,
        currentPlayerName: game.players[game.currentPlayer]?.name,
        nextPlayerName: game.players[nextPlayerId]?.name,
        timestamp: new Date().toISOString()
      });
      
      // Validate the next player exists
      if (!game.players[nextPlayerId]) {
        console.error('❌ Next player not found in game:', nextPlayerId);
        return;
      }
      
      // Validate turn advancement is different (unless single player scenario)
      if (nextPlayerId === game.currentPlayer) {
        const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
        if (humanPlayers.length > 1) {
          console.warn('⚠️ Manual turn advancement would result in same player');
        } else {
          console.log('👤 Single human player - keeping turn is expected');
        }
      }
      
      console.log('✅ Executing turn advancement:', {
        from: game.currentPlayer,
        to: nextPlayerId,
        fromName: game.players[game.currentPlayer]?.name,
        toName: game.players[nextPlayerId]?.name
      });
    }
    
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
    
    // For multiplayer with 3+ humans, we only want human players - no computers
    if (humanPlayerCount >= 3) {
      // Remove all computer players when we have 3+ humans
      if (computerPlayerCount > 0) {
        const deleteUpdates: { [key: string]: any } = {};
        for (const computer of computerPlayers) {
          deleteUpdates[computer.id] = null;
        }
        await update(ref(database, `games/${this.gameCode}/players`), deleteUpdates);
        vLog(`Firebase: Removed ${computerPlayerCount} computer players for 3+ human multiplayer mode`);
      }
      return;
    }
    
    // For 2 humans, allow 1 computer player to fill the 3rd slot
    if (humanPlayerCount === 2) {
      const computersNeeded = 1;
      const computersToRemove = Math.max(0, computerPlayerCount - computersNeeded);
      
      // Remove excess computer players (keep only 1)
      if (computersToRemove > 0) {
        const computersToDelete = computerPlayers.slice(0, computersToRemove);
        const deleteUpdates: { [key: string]: any } = {};
        for (const computer of computersToDelete) {
          deleteUpdates[computer.id] = null;
        }
        await update(ref(database, `games/${this.gameCode}/players`), deleteUpdates);
        vLog(`Firebase: Removed ${computersToRemove} excess computer players, keeping 1 for 2-human game`);
      }
      
      // Add 1 computer player if none exist
      if (computerPlayerCount === 0) {
        const computerId = `computer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const computerName = 'Computer Player';
        
        const computerPlayer: Player = {
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
        
        await update(ref(database, `games/${this.gameCode}/players`), {
          [computerId]: computerPlayer
        });
        vLog(`Firebase: Added computer player for 2-human game`);
      }
      return;
    }
    
    // Single player mode: We want exactly 3 total players: humans + computers
    const totalPlayersNeeded = 3;
    const computersNeeded = Math.max(0, totalPlayersNeeded - humanPlayerCount);
    const computersToRemove = Math.max(0, computerPlayerCount - computersNeeded);

    vLog(`Firebase: Player counts - ${humanPlayerCount} humans, ${computerPlayerCount} computers`);
    vLog(`Firebase: Need ${computersNeeded} computers, removing ${computersToRemove} excess computers`);

    // --- 1. Always REMOVE excess computer players -------------------------
    if (computersToRemove > 0) {
      const computersToDelete = computerPlayers.slice(0, computersToRemove);
      const deleteUpdates: { [key: string]: any } = {};

      for (const computer of computersToDelete) {
        deleteUpdates[computer.id] = null;
      }

      await update(ref(database, `games/${this.gameCode}/players`), deleteUpdates);
      vLog(`Firebase: Removed ${computersToRemove} excess computer players`);
    }

    // --- 2. Only ADD computer players while the lobby is still "waiting" --
    const currentComputerCount = computerPlayerCount - computersToRemove;
    const newComputersNeeded = computersNeeded - currentComputerCount;

    if (game.status === 'waiting' && newComputersNeeded > 0) {
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
        vLog(`Firebase: Added ${newComputersNeeded} computer players:`, Object.keys(newComputerPlayers));
      }
    } else if (newComputersNeeded > 0) {
      vLog(`Firebase: Game is ${game.status}; not adding computers mid-game.`);
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

  // Test function to validate turn mechanics
  async testTurnMechanics(): Promise<void> {
    const snapshot = await get(this.gameRef);
    if (!snapshot.exists()) {
      console.log('❌ No game found for turn mechanics test');
      return;
    }
    
    const game = snapshot.val() as GameState;
    
    console.log('🧪 TURN MECHANICS TEST:', {
      gameCode: this.gameCode,
      currentPlayer: game.currentPlayer,
      currentPlayerName: game.players[game.currentPlayer]?.name,
      totalPlayers: Object.keys(game.players).length,
      humanPlayers: Object.values(game.players).filter(p => p.isHuman).map(p => ({ id: p.id, name: p.name })),
      computerPlayers: Object.values(game.players).filter(p => !p.isHuman).map(p => ({ id: p.id, name: p.name })),
      gameStatus: game.status,
      hasPuzzle: !!game.puzzle,
      isSpinning: game.isSpinning,
      turnInProgress: game.turnInProgress,
      timestamp: new Date().toISOString()
    });
    
    // Test turn advancement logic
    const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
    const currentPlayerIndex = humanPlayers.findIndex(p => p.id === game.currentPlayer);
    
    console.log('🔍 TURN ADVANCEMENT ANALYSIS:', {
      humanPlayerCount: humanPlayers.length,
      currentPlayerIndex,
      currentPlayerInHumanList: currentPlayerIndex !== -1,
      nextPlayerIndex: currentPlayerIndex !== -1 ? (currentPlayerIndex + 1) % humanPlayers.length : -1,
      nextPlayerId: currentPlayerIndex !== -1 ? humanPlayers[(currentPlayerIndex + 1) % humanPlayers.length]?.id : 'N/A',
      nextPlayerName: currentPlayerIndex !== -1 ? humanPlayers[(currentPlayerIndex + 1) % humanPlayers.length]?.name : 'N/A'
    });
    
    // Test potential issues
    const issues = [];
    
    if (humanPlayers.length === 0) {
      issues.push('❌ No human players found');
    }
    
    if (currentPlayerIndex === -1 && humanPlayers.length > 0) {
      issues.push('⚠️ Current player not found in human players list');
    }
    
    if (game.isSpinning && game.turnInProgress) {
      issues.push('⚠️ Game is spinning and turn is in progress simultaneously');
    }
    
    if (!game.puzzle && game.status === 'active') {
      issues.push('⚠️ Game is active but no puzzle is set');
    }
    
    if (issues.length > 0) {
      console.log('🚨 POTENTIAL ISSUES DETECTED:', issues);
    } else {
      console.log('✅ Turn mechanics appear healthy');
    }
  }

  // Generate a new puzzle for the game
  async generateNewPuzzle(category?: string): Promise<void> {
    const puzzle = this.generatePuzzle(category);
    
    // Get current game state to find the host
    const snapshot = await get(this.gameRef);
    const game = snapshot.val() as GameState;
    const hostPlayer = Object.values(game.players).find(p => p.isHost);
    
    await update(this.gameRef, {
      puzzle,
      usedLetters: [],
      currentPlayer: hostPlayer?.id || this.playerId, // Ensure host goes first
      message: 'New puzzle generated! Host goes first!',
      lastUpdated: Date.now()
    });
  }

  // Generate puzzle locally (helper method)
  private generatePuzzle(category?: string): any {
    // Simple puzzle generation - in a real app, you'd have a proper puzzle database
    const puzzles = {
      'PHRASE': [
        'BREAK THE ICE', 'GREAT IDEA', 'HAPPY BIRTHDAY', 'GOOD LUCK', 'SWEET DREAMS',
        'BEST WISHES', 'TRUE LOVE', 'BRIGHT FUTURE', 'PERFECT TIMING', 'FRESH START'
      ],
      'BEFORE & AFTER': [
        { text: 'BLUE MOON WALK', category: 'BEFORE & AFTER', solution: 'BLUE MOON WALK' },
        { text: 'BIRTHDAY PARTY ANIMAL', category: 'BEFORE & AFTER', solution: 'BIRTHDAY PARTY ANIMAL' },
        { text: 'COFFEE BREAK DANCING', category: 'BEFORE & AFTER', solution: 'COFFEE BREAK DANCING' }
      ],
      'RHYME TIME': [
        'MAKE A BREAK', 'TIME TO RHYME', 'BEST TEST', 'QUICK TRICK',
        'BRIGHT LIGHT', 'SWEET TREAT', 'FAIR SHARE', 'TRUE BLUE'
      ],
      // Custom themes with generated puzzles
      'MOVIES': [
        'STAR WARS', 'JURASSIC PARK', 'TITANIC', 'AVATAR', 'FROZEN',
        'THE LION KING', 'TOY STORY', 'FINDING NEMO', 'SHREK', 'HARRY POTTER'
      ],
      'FOOD': [
        'PIZZA HUT', 'MCDONALDS', 'BURGER KING', 'KFC', 'SUBWAY',
        'TACO BELL', 'WENDYS', 'DOMINOS', 'PAPA JOHNS', 'LITTLE CAESARS'
      ],
      'SPORTS': [
        'FOOTBALL', 'BASKETBALL', 'BASEBALL', 'SOCCER', 'TENNIS',
        'GOLF', 'HOCKEY', 'VOLLEYBALL', 'SWIMMING', 'RUNNING'
      ],
      'MUSIC': [
        'ROCK AND ROLL', 'JAZZ MUSIC', 'COUNTRY SONG', 'POP MUSIC', 'RAP MUSIC',
        'CLASSICAL MUSIC', 'BLUES MUSIC', 'REGGAE MUSIC', 'FOLK MUSIC', 'ELECTRONIC MUSIC'
      ],
      'ANIMALS': [
        'LION KING', 'ELEPHANT', 'GIRAFFE', 'ZEBRA', 'TIGER',
        'BEAR', 'WOLF', 'FOX', 'DEER', 'RABBIT'
      ],
      'CITIES': [
        'NEW YORK', 'LOS ANGELES', 'CHICAGO', 'HOUSTON', 'PHOENIX',
        'PHILADELPHIA', 'SAN ANTONIO', 'SAN DIEGO', 'DALLAS', 'SAN JOSE'
      ]
    };

    const categories = category ? [category] : Object.keys(puzzles);
    const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    const categoryPuzzles = puzzles[selectedCategory as keyof typeof puzzles];
    
    // If category doesn't exist in puzzles, generate a simple puzzle
    if (!categoryPuzzles) {
      return {
        text: `${selectedCategory.toUpperCase()} PUZZLE`,
        category: selectedCategory,
        solution: `${selectedCategory.toUpperCase()} PUZZLE`,
        revealed: []
      };
    }
    
    const selectedPuzzle = categoryPuzzles[Math.floor(Math.random() * categoryPuzzles.length)];

    if (typeof selectedPuzzle === 'string') {
      return {
        text: selectedPuzzle,
        category: selectedCategory,
        solution: selectedPuzzle,
        revealed: []
      };
    } else {
      return {
        ...selectedPuzzle,
        revealed: []
      };
    }
  }

  // Set puzzle theme/category for the game
  async setPuzzleTheme(category: string): Promise<void> {
    await this.generateNewPuzzle(category);
  }

  // Start the game and ensure host goes first
  async startGame(): Promise<void> {
    const snapshot = await get(this.gameRef);
    const game = snapshot.val() as GameState;
    const hostPlayer = Object.values(game.players).find(p => p.isHost);
    
    // Check if we need to add a computer player
    const humanPlayers = Object.values(game.players).filter(p => p.isHuman);
    const computerPlayers = Object.values(game.players).filter(p => !p.isHuman);
    
    // If we have exactly 2 human players and no computer players, add one computer player
    if (humanPlayers.length === 2 && computerPlayers.length === 0) {
      const computerId = `computer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const computerName = 'Computer Player';
      
      const computerPlayer: Player = {
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
      
      // Add the computer player to the game
      await update(ref(database, `games/${this.gameCode}/players`), {
        [computerId]: computerPlayer
      });
      
      console.log(`🤖 Added computer player "${computerName}" to fill the 3rd slot`);
    }
    
    if (hostPlayer) {
      await update(this.gameRef, {
        status: 'active',
        currentPlayer: hostPlayer.id,
        message: 'Game started! Host goes first!',
        lastUpdated: Date.now()
      });
    }
  }
} 