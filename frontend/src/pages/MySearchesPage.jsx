import { Link } from 'react-router-dom'
import { useMySearches } from '../lib/useMySearches'
import Header from '../components/Header'
import SearchCard from '../components/SearchCard'

/**
 * Página personal: las búsquedas relevantes para el usuario actual.
 *
 * Se divide en dos secciones:
 * - "Búsquedas que creé": las que yo armé, sin importar el estado
 * - "Búsquedas donde participo": las que me uní, sin ser creador
 *
 * Cada sección usa el mismo SearchCard que se usa en /searches.
 * Reutilización pura: misma card, distinto contexto.
 */
function MySearchesPage() {
  const { created, participating, loading, error } = useMySearches()

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Mis búsquedas</h1>
            <p className="text-gray-400 mt-2">
              Todo lo que armaste o donde estás participando.
            </p>
          </div>

          <Link
            to="/searches/new"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            + Crear búsqueda
          </Link>
        </div>

        {/* Loading */}
        {loading && <p className="text-gray-400">Cargando tus búsquedas...</p>}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Estado totalmente vacío */}
        {!loading && !error && created.length === 0 && participating.length === 0 && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-lg font-semibold mb-2">Todavía no tenés actividad</p>
            <p className="text-gray-400 mb-6">
              Creá tu primera búsqueda o sumate a alguna abierta.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                to="/searches/new"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Crear búsqueda
              </Link>
              <Link
                to="/searches"
                className="bg-dark-800 hover:bg-dark-700 border border-dark-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                Explorar búsquedas
              </Link>
            </div>
          </div>
        )}

        {/* Sección: búsquedas que creé */}
        {!loading && !error && created.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              Búsquedas que creé <span className="text-sm font-normal text-gray-400">({created.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {created.map((search) => (
                <SearchCard key={search.id} search={search} />
              ))}
            </div>
          </section>
        )}

        {/* Sección: búsquedas donde participo */}
        {!loading && !error && participating.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-bold mb-3">
              Donde participo <span className="text-sm font-normal text-gray-400">({participating.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {participating.map((search) => (
                <SearchCard key={search.id} search={search} />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}

export default MySearchesPage