import { Link } from 'react-router-dom'
import { usePendingReviews } from '../lib/usePendingReviews'
import Header from '../components/Header'

/**
 * Página que lista las partidas confirmadas donde todavía puedo
 * escribir reviews (dentro de los 7 días desde completed_at).
 *
 * Cada partida muestra los usuarios pendientes con un botón
 * para escribir review (que va a /reviews/new?... — sesión 2).
 */
function PendingReviewsPage() {
  const { pending, loading, error } = usePendingReviews()

  // Helper para formatear fechas
  function formatDate(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">

        <h1 className="text-4xl font-bold mb-2">Reviews pendientes</h1>
        <p className="text-gray-400 mb-6">
          Partidas donde jugaste y todavía no calificaste a los demás.
          Tenés 7 días desde que la búsqueda se completó.
        </p>

        {/* Loading */}
        {loading && <p className="text-gray-400">Cargando...</p>}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && pending.length === 0 && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
            <p className="text-2xl mb-2">📝</p>
            <p className="text-lg font-semibold mb-2">No tenés reviews pendientes</p>
            <p className="text-gray-400 mb-6">
              Aparecen acá las partidas que jugaste donde el otro participante también
              confirmó. Tenés 7 días para calificar.
            </p>
            <Link
              to="/searches"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Ver búsquedas abiertas
            </Link>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && pending.length > 0 && (
          <div className="space-y-4">
            {pending.map((item) => (
              <div
                key={item.search_id}
                className="bg-dark-800 border border-dark-700 rounded-lg p-6"
              >
                {/* Header de la partida */}
                <div className="mb-4">
                  <p className="text-xs text-primary-500 font-semibold uppercase mb-1">
                    {item.game_slug?.replaceAll('-', ' ')}
                  </p>
                  <Link
                    to={`/searches/${item.search_id}`}
                    className="text-lg font-bold text-white hover:text-primary-500 transition-colors"
                  >
                    {item.search_title}
                  </Link>
                  {item.completed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Completada el {formatDate(item.completed_at)}
                    </p>
                  )}
                </div>

                {/* Lista de usuarios para calificar */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-300">
                    Falta calificar a:
                  </p>
                  {item.pending_users.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between gap-3 bg-dark-900 border border-dark-700 rounded p-3"
                    >
                      <p className="text-white">{user.username}</p>
                      <Link
                        to={`/reviews/new?search_id=${item.search_id}&user_id=${user.user_id}`}
                        className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-3 py-1 rounded transition-colors"
                      >
                        Escribir review
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default PendingReviewsPage