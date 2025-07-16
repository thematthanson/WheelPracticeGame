import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function JoinGame() {
  const router = useRouter()
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!gameCode.trim()) {
      setError('Please enter a game code')
      return
    }
    
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    // Navigate to the game with both code and player name
    router.push(`/multiplayer/game?code=${gameCode}&name=${encodeURIComponent(playerName)}`)
  }

  const handleBack = () => {
    router.push('/multiplayer')
  }

  return (
    <>
      <Head>
        <title>Join Game - Wheel of Fortune</title>
        <meta name="description" content="Join a multiplayer Wheel of Fortune game" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="bg-purple-800 bg-opacity-50 p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">Join Game</h1>
            <p className="text-purple-200">Enter the game code to join a multiplayer game</p>
          </div>

          <form onSubmit={handleJoinGame} className="space-y-6">
            <div>
              <label htmlFor="gameCode" className="block text-sm font-medium text-purple-200 mb-2">
                Game Code
              </label>
              <input
                type="text"
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-blue-900 bg-opacity-50 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Enter game code"
                maxLength={6}
              />
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-purple-200 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 bg-blue-900 bg-opacity-50 border border-purple-400 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-red-600 bg-opacity-50 border border-red-400 rounded-lg p-3 text-red-200">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Join Game
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
} 