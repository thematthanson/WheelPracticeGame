import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import MultiplayerGame from '../../components/MultiplayerGame'

export default function MultiplayerGamePage() {
  const router = useRouter()
  const { code, name } = router.query
  const [gameCode, setGameCode] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (code && name) {
      setGameCode(code as string)
      setPlayerName(decodeURIComponent(name as string))
      setLoading(false)
    }
  }, [code, name])

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

  if (!gameCode || !playerName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Missing Game Information</h1>
          <p className="text-lg mb-4">Game code or player name not provided.</p>
          <button
            onClick={() => router.push('/multiplayer')}
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

      <MultiplayerGame gameCode={gameCode} playerName={playerName} />
    </>
  )
} 