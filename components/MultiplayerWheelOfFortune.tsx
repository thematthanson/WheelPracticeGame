import React from 'react';
import WheelOfFortune from './WheelOfFortune';
import { Player, GameHistoryEntry } from '../lib/firebaseGameService';

interface MultiplayerWheelProps {
  gameState: any;
  currentPlayer: any;
  isHost: boolean;
  service: any;
}

/**
 * MultiplayerWheelOfFortune
 * ----------------------------------
 * Both players always see the full game board with puzzle, wheel, and controls.
 * Controls are enabled/disabled based on whose turn it is.
 * All actions are synced via Firebase through the service helper methods.
 */
const MultiplayerWheelOfFortune: React.FC<MultiplayerWheelProps> = ({
  gameState,
  currentPlayer,
  isHost,
  service
}) => {
  // Derive deterministic order: all humans (host first) then computers — keeps human turns contiguous
  const ordered: Player[] = [...Object.values(gameState.players)] as Player[];
  ordered.sort((a, b) => {
    // Humans before computers
    if (a.isHuman && !b.isHuman) return -1;
    if (!a.isHuman && b.isHuman) return 1;
    // Within humans, host (current player) first
    if (a.id === currentPlayer?.id) return -1;
    if (b.id === currentPlayer?.id) return 1;
    return a.name.localeCompare(b.name);
  });

  const isActiveHuman = currentPlayer && currentPlayer.isHuman && currentPlayer.id === gameState.currentPlayer;

  // Debug info
  const debugInfo = (
    <div className="bg-gray-900 text-gray-200 text-xs p-2 rounded mb-2">
      <div><b>Debug Info:</b></div>
      <div>Your playerId: <span className="font-mono">{currentPlayer?.id}</span></div>
      <div>gameState.currentPlayer: <span className="font-mono">{gameState.currentPlayer}</span></div>
      <div>Resolved current turn: <span className="font-mono">{gameState?.players?.[gameState?.currentPlayer]?.name || '—'}</span></div>
      <div>All player IDs: {Object.values(gameState.players).map((p: any) => p.id).join(', ')}</div>
    </div>
  );

  // Prominent turn indicator
  const turnBanner = isActiveHuman ? (
    <div className="bg-green-600 text-white text-lg font-bold py-2 px-4 rounded-lg text-center mb-2 shadow-lg animate-pulse">
      YOUR TURN!
    </div>
  ) : (
    <div className="bg-yellow-500 text-yellow-900 text-lg font-bold py-2 px-4 rounded-lg text-center mb-2 shadow-lg">
      Waiting for {gameState?.players?.[gameState?.currentPlayer]?.name || 'other player'}'s turn…
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {debugInfo}
      {turnBanner}
      {/* Status indicator for non-active players */}
      {!isActiveHuman && currentPlayer?.isHuman && (
        <div className="bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg p-3 text-center mb-4">
          <div className="text-yellow-200 font-semibold">
            🕐 Waiting for {gameState?.players?.[gameState?.currentPlayer]?.name || 'other player'}'s turn...
          </div>
          <div className="text-sm text-yellow-300 mt-1">
            You can see the game board but controls are disabled until your turn
          </div>
        </div>
      )}

      {/* Game History */}
      {gameState?.gameHistory && gameState.gameHistory.length > 0 && (
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-bold text-yellow-200 mb-3">Game History</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameState.gameHistory.slice(-10).map((entry: GameHistoryEntry, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    entry.type === 'letter' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {entry.type === 'letter' ? '🔤' : '💭'}
                  </span>
                  <span className="text-gray-300">{entry.playerName}</span>
                  <span className="text-white font-mono">{entry.value}</span>
                </div>
                {entry.result && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    entry.result === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    {entry.result === 'correct' ? '✓' : '✗'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <WheelOfFortune
        initialPlayers={ordered.map((p) => ({ name: p.name, isHuman: p.isHuman }))}
        isActivePlayer={isActiveHuman}
        firebaseGameState={gameState}
        firebaseService={service}
        onSpin={(data) => {
          if (isActiveHuman) {
            service.pushSpin(data);
          }
        }}
        onLetterGuess={(letter) => {
          if (isActiveHuman && currentPlayer?.id) {
            service.pushLetterGuess(letter, currentPlayer.id);
          }
        }}
        onSolveAttempt={(attempt, correct) => {
          if (isActiveHuman && currentPlayer?.id) {
            service.pushSolveAttempt(attempt, currentPlayer.id);
          }
        }}
        onEndTurn={(nextPlayerIndex) => {
          if (isActiveHuman) {
            // Rotate among human players only – skip computers
            const humanIds = Object.values(gameState.players)
              .filter((p): p is Player => (p as Player).isHuman)
              .map(p => p.id);
            const currIdx = humanIds.indexOf(gameState.currentPlayer);
            if (currIdx === -1) return;
            const nextId = humanIds[(currIdx + 1) % humanIds.length];
            service.endTurn(nextId);
          }
        }}
      />

      {/* Manual Pass Turn button - only visible to active human player */}
      {isActiveHuman && (
        <div className="text-center">
          <button
            onClick={() => {
              const humanIds = Object.values(gameState.players)
                .filter((p): p is Player => (p as Player).isHuman)
                .map(p => p.id);
              const currentIdx = humanIds.indexOf(gameState.currentPlayer);
              if (currentIdx === -1) return;
              const nextId = humanIds[(currentIdx + 1) % humanIds.length];
              service.endTurn(nextId);
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Pass Turn ➜
          </button>
        </div>
      )}

      {/* Fallback Claim Turn button — visible only if this human player is not the currentPlayer but the game is active */}
      {!isHost && currentPlayer?.id !== gameState.currentPlayer && gameState.status === 'active' && currentPlayer?.isHuman && (
        <div className="text-center mt-4">
          <button
            onClick={() => service.endTurn(currentPlayer!.id)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Ready – take my turn
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiplayerWheelOfFortune; 