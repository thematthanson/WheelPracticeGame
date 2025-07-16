import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import WheelOfFortune from '../../components/WheelOfFortune'

export default function MultiplayerGame() {
  const router = useRouter()
  const { code } = router.query
  const [gameState, setGameState] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return

    // Load game state from localStorage
    const savedGame = localStorage.getItem(`game_${code}`)
    if (savedGame) {
      setGameState(JSON.parse(savedGame))
    } else {
      setError('Game not found')
    }
    setLoading(false)
  }, [code])

  const handleBack = () => {
    router.push('/multiplayer')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading game...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Game Not Found</h1>
          <p className="text-lg mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Multiplayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Multiplayer Game - Wheel of Fortune</title>
        <meta name="description" content="Multiplayer Wheel of Fortune game" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        {/* Game Header */}
        <div className="bg-purple-800 bg-opacity-50 p-4 text-center">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">Game Code: {code}</h1>
              <p className="text-sm text-purple-200">
                {gameState?.players?.length || 0} players joined
              </p>
            </div>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Game Component */}
        <WheelOfFortune />
      </div>
    </>
  )
} 