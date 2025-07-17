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

  // HOST VIEW – full controls
  if (isActiveHuman) {
    const passTurn = () => {
      const humanIds = Object.values(gameState.players)
        .filter((p): p is Player => (p as Player).isHuman)
        .map(p => p.id);
      const currentIdx = humanIds.indexOf(gameState.currentPlayer);
      if (currentIdx === -1) return;
      const nextId = humanIds[(currentIdx + 1) % humanIds.length];
      service.endTurn(nextId);
    };

    return (
      <div className="max-w-4xl mx-auto space-y-4">
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
            // Rotate among human players only – skip computers
            const humanIds = Object.values(gameState.players)
              .filter((p): p is Player => (p as Player).isHuman)
              .map(p => p.id);
            const currIdx = humanIds.indexOf(gameState.currentPlayer);
            if (currIdx === -1) return;
            const nextId = humanIds[(currIdx + 1) % humanIds.length];
            service.endTurn(nextId);
          }}
        />

        {/* Manual Pass Turn – lets the active human yield control explicitly */}
        <div className="text-center">
          <button
            onClick={passTurn}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Pass Turn ➜
          </button>
        </div>
      </div>
    );
  }

  // GUEST / Waiting VIEW – read-only summary
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