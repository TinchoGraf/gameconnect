import { useSearchParams, Link } from 'react-router-dom'
import { useSearches } from '../lib/useSearches'
import { useGames } from '../lib/useGames'
import { useAuth } from '../lib/AuthContext'
import Header from '../components/Header'
import SearchCard from '../components/SearchCard'

/**
 * Página de listado de búsquedas abiertas.
 *
 * Los filtros viven en la URL como query params, por ejemplo:
 *   /searches?game_slug=league-of-legends&server=LAS
 *
 * Esto tiene dos ventajas:
 * 1. Refrescar la página mantiene los filtros aplicados
 * 2. Podés compartir un link con filtros ya activos
 *
 * useSearchParams es el hook de React Router para leer/escribir esos params.
 */
function SearchesPage() {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Leemos los filtros desde la URL
  const filters = {
    game_slug: searchParams.get('game_slug') || '',
    server: searchParams.get('server') || '',
    mode: searchParams.get('mode') || '',
  }

  // Traer datos
  const { searches, loading, error } = useSearches(filters)
  const { games } = useGames()

  // El juego elegido determina qué servers/modes se pueden filtrar
  const selectedGame = games.find((g) => g.slug === filters.game_slug) || null

  /**
   * Actualiza un filtro en la URL.
   * Si el valor es vacío, eliminamos el param de la URL.
   * Cambiar el game_slug limpia los demás filtros porque los servers
   * y modos dependen del juego.
   */
  function updateFilter(key, value) {
    const newParams = new URLSearchParams(searchParams)

    if (value) {
      newParams.set(key, value)
    } else {
      newParams.delete(key)
    }

    // Si cambiamos el juego, limpiamos server y mode también
    if (key === 'game_slug') {
      newParams.delete('server')
      newParams.delete('mode')
    }

    setSearchParams(newParams)
  }

  function clearAllFilters() {
    setSearchParams({})
  }

  const hasFilters = filters.game_slug || filters.server || filters.mode

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Búsquedas abiertas</h1>
            <p className="text-gray-400 mt-2">
              Encontrá un equipo según tu juego, server y estilo.
            </p>
          </div>

          {isAuthenticated && (
            <Link
              to="/searches/new"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              + Crear búsqueda
            </Link>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            {/* Filtro: juego */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Juego</label>
              <select
                value={filters.game_slug}
                onChange={(e) => updateFilter('game_slug', e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Todos</option>
                {games.map((g) => (
                  <option key={g.slug} value={g.slug}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro: server (depende del juego) */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Server {!selectedGame && <span className="text-gray-600">(elegí un juego)</span>}
              </label>
              <select
                value={filters.server}
                onChange={(e) => updateFilter('server', e.target.value)}
                disabled={!selectedGame}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {selectedGame?.servers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Filtro: modo (depende del juego) */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Modo {!selectedGame && <span className="text-gray-600">(elegí un juego)</span>}
              </label>
              <select
                value={filters.mode}
                onChange={(e) => updateFilter('mode', e.target.value)}
                disabled={!selectedGame}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Todos</option>
                {selectedGame?.game_modes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Filtros activos
              </p>
              <button
                onClick={clearAllFilters}
                className="text-xs text-primary-500 hover:text-primary-50 underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* CTA si no está logueado */}
        {!isAuthenticated && (
          <div className="bg-primary-700/20 border border-primary-700 rounded-lg p-4 mb-6 text-sm">
            <Link to="/register" className="text-primary-500 hover:underline font-semibold">
              Crea una cuenta
            </Link>
            <span className="text-gray-300"> para crear búsquedas y unirte a las existentes.</span>
          </div>
        )}

        {/* Resultados */}
        {loading && <p className="text-gray-400">Cargando búsquedas...</p>}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && searches.length === 0 && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-lg font-semibold mb-2">
              No hay búsquedas {hasFilters && 'con esos filtros'}
            </p>
            <p className="text-gray-400 mb-4">
              {hasFilters
                ? 'Probá quitando algunos filtros o creá tu propia búsqueda.'
                : 'Sé el primero en crear una.'}
            </p>
            {isAuthenticated && (
              <Link
                to="/searches/new"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Crear búsqueda
              </Link>
            )}
          </div>
        )}

        {!loading && !error && searches.length > 0 && (
          <>
            <p className="text-sm text-gray-400 mb-3">
              {searches.length} búsqueda{searches.length === 1 ? '' : 's'} encontrada{searches.length === 1 ? '' : 's'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searches.map((search) => (
                <SearchCard key={search.id} search={search} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SearchesPage