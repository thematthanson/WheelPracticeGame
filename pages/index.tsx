import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function GameModeSelector() {
  const router = useRouter()

  const handleSinglePlayer = () => {
    router.push('/single-player')
  }

  const handleMultiplayer = () => {
    router.push('/multiplayer')
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
            {/* Mode Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={handleSinglePlayer}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                🎮 Single Player
              </button>
              <button
                onClick={handleMultiplayer}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
              >
                👥 Multiplayer
              </button>
            </div>

            {/* Mode Descriptions */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                <p className="text-sm text-green-200">
                  Practice against computer opponents. Perfect for training and getting familiar with the game.
                </p>
              </div>
              <div className="p-3 bg-purple-600 bg-opacity-20 rounded-lg">
                <p className="text-sm text-purple-200">
                  Play with friends online! Create or join a game with a unique code.
                </p>
              </div>
            </div>
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