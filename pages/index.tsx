import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function GameModeSelector() {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState('')

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode)
  }

  const handleStartGame = () => {
    if (selectedMode === 'single') {
      router.push('/single-player')
    } else if (selectedMode === 'multiplayer') {
      router.push('/multiplayer')
    }
  }

  return (
    <>
      <Head>
        <title>Wheel of Fortune - Choose Game Mode</title>
        <meta name="description" content="Choose your Wheel of Fortune game mode" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-2 sm:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              WHEEL OF FORTUNE
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-yellow-200 mb-1 sm:mb-2">
              Training Edition
            </p>
            <p className="text-base sm:text-lg text-blue-200">
              Choose your game mode
            </p>
          </div>

          {/* Game Mode Selection */}
          <div className="max-w-md mx-auto">
            {/* Dropdown */}
            <div className="mb-6">
              <label htmlFor="gameMode" className="block text-sm font-medium text-yellow-200 mb-2">
                Select Game Mode:
              </label>
              <select
                id="gameMode"
                value={selectedMode}
                onChange={(e) => handleModeSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white bg-opacity-10 border border-yellow-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Choose a mode...</option>
                <option value="single">🎮 Single Player</option>
                <option value="multiplayer">👥 Multiplayer</option>
              </select>
            </div>

            {/* Mode Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => handleModeSelect('single')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMode === 'single'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-green-600 bg-opacity-50 text-green-200 hover:bg-opacity-70'
                }`}
              >
                🎮 Single
              </button>
              <button
                onClick={() => handleModeSelect('multiplayer')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedMode === 'multiplayer'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-purple-600 bg-opacity-50 text-purple-200 hover:bg-opacity-70'
                }`}
              >
                👥 Multiplayer
              </button>
            </div>

            {/* Start Button */}
            {selectedMode && (
              <button
                onClick={handleStartGame}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                Start Game
              </button>
            )}

            {/* Mode Descriptions */}
            {selectedMode === 'single' && (
              <div className="mt-4 p-3 bg-green-600 bg-opacity-20 rounded-lg">
                <p className="text-sm text-green-200">
                  Practice against computer opponents. Perfect for training and getting familiar with the game.
                </p>
              </div>
            )}
            {selectedMode === 'multiplayer' && (
              <div className="mt-4 p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                <p className="text-sm text-purple-200">
                  Play with friends online! Create or join a game with a unique code.
                </p>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-6">
            <div className="bg-blue-800 bg-opacity-30 rounded-lg p-3 max-w-md mx-auto">
              <h3 className="text-base font-semibold text-yellow-200 mb-2">
                🎯 Perfect for Training
              </h3>
              <p className="text-xs text-blue-100">
                Master the strategies and timing needed for the real Wheel of Fortune show!
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 