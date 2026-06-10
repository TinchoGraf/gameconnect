import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import GameCard from '../components/GameCard'
import Header from '../components/Header'

/**
 * Página que muestra los juegos soportados por GameConnect.
 */
function GamesPage() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await api.get('/games')
        setGames(response.data)
      } catch (err) {
        setError('No pudimos cargar los juegos. ¿Está corriendo el backend?')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [])

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Juegos soportados</h1>
          <p className="text-gray-400">
            Estos son los juegos donde podés crear perfil y armar equipo.
          </p>
        </header>

        <section>
          {loading && (
            <p className="text-gray-400">Cargando juegos...</p>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {games.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default GamesPage