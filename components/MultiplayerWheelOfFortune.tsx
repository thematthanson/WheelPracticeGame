import React from 'react';
import WheelOfFortune from './WheelOfFortune';
import { Player } from '../lib/firebaseGameService';

interface MultiplayerWheelProps {
  gameState: any;
  currentPlayer: any;
  isHost: boolean;
  service: any;
}

/**
 * MultiplayerWheelOfFortune
 * ----------------------------------
 * Host: renders the full interactive WheelOfFortune component. All actions
 *       are mirrored to Firebase via the passed service helper methods.
 * Guest: renders a passive read-only view of the puzzle + basic info so
 *        they can watch the game progress in real-time.
 */
const MultiplayerWheelOfFortune: React.FC<MultiplayerWheelProps> = ({
  gameState,
  currentPlayer,
  isHost,
  service
}) => {
  // Derive deterministic order: host first (current), then remaining by name
  const ordered: Player[] = [...Object.values(gameState.players)] as Player[];
  ordered.sort((a, b) => {
    if (a.id === currentPlayer?.id) return -1;
    if (b.id === currentPlayer?.id) return 1;
    return a.name.localeCompare(b.name);
  });

  // HOST VIEW – full controls
  if (isHost) {
    return (
      <div className="max-w-4xl mx-auto">
        <WheelOfFortune
          initialPlayers={ordered.map((p) => ({ name: p.name, isHuman: p.isHuman }))}
          onSpin={(data) => {
            service.pushSpin(data);
          }}
          onLetterGuess={(letter) => {
            if (currentPlayer?.id) {
              service.pushLetterGuess(letter, currentPlayer.id);
            }
          }}
          onSolveAttempt={(attempt, correct) => {
            if (currentPlayer?.id) {
              service.pushSolveAttempt(attempt, currentPlayer.id);
            }
          }}
          onEndTurn={(nextPlayerIndex) => {
            const playerIds = Object.keys(gameState.players);
            const currentIdx = playerIds.indexOf(gameState.currentPlayer);
            if (currentIdx === -1) return;
            const nextId = playerIds[(currentIdx + 1) % playerIds.length];
            service.endTurn(nextId);
          }}
        />
      </div>
    );
  }

  // GUEST VIEW – read-only summary
  return (
    <div className="max-w-2xl mx-auto text-center space-y-4 p-4 bg-gray-800 bg-opacity-40 rounded-lg">
      <h2 className="text-lg font-semibold text-yellow-200">Watching the Game…</h2>
      <p className="text-xl font-bold text-white tracking-wide">
        {gameState?.puzzle?.text || 'Loading…'}
      </p>
      <p className="text-sm uppercase text-gray-300">
        Category: {gameState?.puzzle?.category || '—'}
      </p>
      <p className="text-sm text-gray-400">
        Current Turn: {gameState?.players?.[gameState?.currentPlayer]?.name || '—'}
      </p>
      <p className="text-xs text-gray-500">Waiting for host actions…</p>

      {/* Fallback Claim Turn button — visible only if this human player is not the currentPlayer but the game is active. */}
      {!isHost && currentPlayer?.id !== gameState.currentPlayer && gameState.status === 'active' && (
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