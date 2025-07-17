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
            // Map numeric index from local game to actual Firebase player ID order
            const allPlayers = Object.values(gameState.players) as Player[];
            // Ensure deterministic ordering: host first, then others by name
            const ordered = allPlayers.sort((playerA, playerB) => {
              if (playerA.id === currentPlayer?.id) return -1;
              if (playerB.id === currentPlayer?.id) return 1;
              return playerA.name.localeCompare(playerB.name);
            });
            const next = ordered[nextPlayerIndex];
            if (next) {
              service.endTurn(next.id);
            }
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
    </div>
  );
};

export default MultiplayerWheelOfFortune; 