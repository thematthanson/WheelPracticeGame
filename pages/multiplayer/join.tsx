import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function JoinGame() {
  const router = useRouter()
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')

  const handleBack = () => {
    router.push('/multiplayer')
  }

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gameCode.trim()) {
      setError('Please enter a game code')
      return
    }

    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsJoining(true)
    setError('')

    try {
      // Check if game exists in localStorage
      const existingGame = localStorage.getItem(`game_${gameCode.trim().toUpperCase()}`)
      
      let gameState
      if (existingGame) {
        gameState = JSON.parse(existingGame)
      } else {
        // Create a new game if it doesn't exist
        gameState = {
          id: Date.now().toString(),
          code: gameCode.trim().toUpperCase(),
          status: 'waiting',
          createdAt: new Date().toISOString(),
          players: [],
          currentPlayer: 0,
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
          maxPlayers: 2
        }
      }

      // Check if game is full
      if (gameState.players.length >= gameState.maxPlayers) {
        throw new Error('Game is full')
      }

      // Check if player name is already taken
      const existingPlayer = gameState.players.find((p: any) => p.name === playerName.trim())
      let finalPlayerName = playerName.trim()
      if (existingPlayer) {
        // If name is taken, append a number to make it unique
        let counter = 1
        while (gameState.players.find((p: any) => p.name === finalPlayerName)) {
          finalPlayerName = `${playerName.trim()} ${counter}`
          counter++
        }
      }

      // Add the new player
      const newPlayer = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: finalPlayerName,
        isHost: gameState.players.length === 0, // First player becomes host
        isHuman: true,
        roundMoney: 0,
        totalMoney: 0,
        prizes: [],
        specialCards: [],
        freeSpins: 0
      }

      console.log(`Adding player: ${newPlayer.name} to game ${gameCode.trim().toUpperCase()}`)
      console.log(`Current players:`, gameState.players.map((p: any) => p.name))

      gameState.players.push(newPlayer)

      // If we have enough players, start the game
      if (gameState.players.length >= gameState.maxPlayers) {
        gameState.status = 'active'
        gameState.message = 'Game starting...'
        
        // Add computer players if needed (for 3-player games)
        while (gameState.players.length < 3) {
          const computerPlayer = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: `Computer ${gameState.players.length}`,
            isHost: false,
            isHuman: false,
            roundMoney: 0,
            totalMoney: 0,
            prizes: [],
            specialCards: [],
            freeSpins: 0
          }
          gameState.players.push(computerPlayer)
        }
      }

      // Store the updated game state
      localStorage.setItem(`game_${gameCode.trim().toUpperCase()}`, JSON.stringify(gameState))
      
      // Redirect to the game with the game code
      router.push(`/multiplayer/game?code=${gameCode.trim().toUpperCase()}`)

    } catch (error) {
      console.error('Error joining game:', error)
      setError(error instanceof Error ? error.message : 'Failed to join game')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <>
      <Head>
        <title>Join Multiplayer Game - Wheel of Fortune</title>
        <meta name="description" content="Join an existing multiplayer Wheel of Fortune game" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="version" content={`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`} />
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
              JOIN GAME
            </h1>
            <p className="text-lg sm:text-xl text-yellow-200 mb-2">
              Enter a game code to join
            </p>
          </div>

          {/* Join Game Form */}
          <div className="bg-blue-800 bg-opacity-30 rounded-lg p-4 sm:p-8 max-w-2xl mx-auto">
            <form onSubmit={handleJoinGame} className="space-y-6">
              {/* Game Code */}
              <div>
                <label htmlFor="gameCode" className="block text-lg font-semibold mb-2 text-yellow-200">
                  Game Code
                </label>
                <input
                  type="text"
                  id="gameCode"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-yellow-400 transition-colors font-mono"
                  placeholder="Enter 6-character code..."
                  maxLength={6}
                  disabled={isJoining}
                />
              </div>

              {/* Player Name */}
              <div>
                <label htmlFor="playerName" className="block text-lg font-semibold mb-2 text-yellow-200">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="Enter your name..."
                  maxLength={20}
                  disabled={isJoining}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-600 bg-opacity-30 border border-red-400 rounded-lg p-3 text-red-200">
                  {error}
                </div>
              )}

              {/* Join Button */}
              <button
                type="submit"
                disabled={isJoining || !gameCode.trim() || !playerName.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 touch-manipulation"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining Game...
                  </span>
                ) : (
                  'Join Game'
                )}
              </button>
            </form>

            {/* Info Section */}
            <div className="mt-8 bg-blue-700 bg-opacity-30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-200 mb-2">How to join:</h3>
              <ul className="text-blue-100 space-y-1 text-sm">
                <li>• Ask the game host for the 6-character game code</li>
                <li>• Enter the code exactly as provided</li>
                <li>• Choose a unique player name</li>
                <li>• Wait for the game to start when all players join</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 