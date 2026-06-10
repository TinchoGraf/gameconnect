import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import GameCard from '../components/GameCard'

/**
 * Página que muestra los juegos soportados por GameConnect.
 * Hace una llamada al backend al cargar y muestra los resultados.
 */
function GamesPage() {
  // useState: crea una variable "reactiva". Cuando la modificamos con
  // setGames(), React re-renderiza la página automáticamente.
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // useEffect: se ejecuta después de que el componente se monta.
  // El array vacío [] al final significa "ejecutá esto una sola vez,
  // cuando el componente aparece por primera vez".
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            🎮 <span className="text-primary-500">GameConnect</span>
          </h1>
          <p className="text-gray-400">
            Conectá con jugadores según juegos, roles, servidores y reputación.
          </p>
        </header>

        {/* Sección de juegos */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Juegos soportados</h2>

          {loading && (
            <p className="text-gray-400">Cargando juegos...</p>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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