import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Player, GameState } from '../../lib/firebaseGameService'

export default function MultiplayerHub() {
  const router = useRouter()
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleBack = () => {
    router.push('/')
  }

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      // Generate a random 6-character game code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      const gameState: Partial<GameState> = {
        id: Date.now().toString(),
        code: code,
        status: 'waiting',
        createdAt: Date.now(),
        players: {} as { [key: string]: Player },
        currentPlayer: '',
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
      }

      // Add the host player
      const hostPlayer: Player = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: playerName.trim(),
        isHost: true,
        isHuman: true,
        roundMoney: 0,
        totalMoney: 0,
        prizes: [],
        specialCards: [],
        freeSpins: 0,
        lastSeen: Date.now()
      }

      gameState.players![hostPlayer.id] = hostPlayer
      gameState.currentPlayer = hostPlayer.id

      // Store the game state
      localStorage.setItem(`game_${code}`, JSON.stringify(gameState))
      
      // Redirect to the game
      router.push(`/multiplayer/game?code=${code}`)

    } catch (error) {
      console.error('Error creating game:', error)
      setError('Failed to create game')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      setError('Please enter a game code')
      return
    }

    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    router.push(`/multiplayer/join?code=${gameCode.trim().toUpperCase()}&name=${encodeURIComponent(playerName.trim())}`)
  }

  return (
    <>
      <Head>
        <title>Multiplayer Hub - Wheel of Fortune</title>
        <meta name="description" content="Create or join a multiplayer Wheel of Fortune game" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <button 
              onClick={handleBack}
              className="absolute top-4 left-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 touch-manipulation"
            >
              ← Back
            </button>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              MULTIPLAYER
            </h1>
            <p className="text-lg sm:text-xl text-yellow-200 mb-2">
              Play with friends online!
            </p>
          </div>

          {/* Player Name Input */}
          <div className="bg-blue-800 bg-opacity-30 rounded-lg p-4 sm:p-8 max-w-2xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-yellow-200 mb-4">Your Name</h2>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-yellow-400 transition-colors"
              placeholder="Enter your name..."
              maxLength={20}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-600 bg-opacity-30 border border-red-400 rounded-lg p-3 text-red-200 mb-4 max-w-2xl mx-auto">
              {error}
            </div>
          )}

          {/* Create Game Section */}
          <div className="bg-green-800 bg-opacity-30 rounded-lg p-4 sm:p-8 max-w-2xl mx-auto mb-6">
            <h2 className="text-xl font-semibold text-green-200 mb-4">🎮 Create New Game</h2>
            <p className="text-green-100 mb-4">
              Start a new game and invite friends to join with the generated code.
            </p>
            <button
              onClick={handleCreateGame}
              disabled={isCreating || !playerName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 touch-manipulation"
            >
              {isCreating ? 'Creating Game...' : 'Create Game'}
            </button>
          </div>

          {/* Join Game Section */}
          <div className="bg-purple-800 bg-opacity-30 rounded-lg p-4 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-purple-200 mb-4">👥 Join Existing Game</h2>
            <p className="text-purple-100 mb-4">
              Enter a game code to join an existing game.
            </p>
            
            <div className="space-y-4">
              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-purple-400 transition-colors font-mono"
                placeholder="Enter 6-character code..."
                maxLength={6}
              />
              
              <button
                onClick={handleJoinGame}
                disabled={!gameCode.trim() || !playerName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 touch-manipulation"
              >
                Join Game
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 bg-blue-700 bg-opacity-30 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-yellow-200 mb-2">How multiplayer works:</h3>
            <ul className="text-blue-100 space-y-1 text-sm">
              <li>• Create a game to get a unique 6-character code</li>
              <li>• Share the code with friends to join</li>
              <li>• Games support up to 2 human players</li>
              <li>• Computer players will be added automatically</li>
              <li>• Games are stored locally in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
} 