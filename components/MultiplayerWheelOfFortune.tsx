import React from 'react';
import WheelOfFortune from './WheelOfFortune';

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
  // HOST VIEW – full controls
  if (isHost) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* TODO: In Phase B we will intercept WheelOfFortune callbacks and pipe them to Firebase */}
        <WheelOfFortune />
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