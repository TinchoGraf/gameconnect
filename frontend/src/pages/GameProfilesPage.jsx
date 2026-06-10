import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'
import GameProfileCard from '../components/GameProfileCard'

/**
 * Página de gestión de los perfiles de juego del usuario actual.
 */
function GameProfilesPage() {
  const { profiles, loading, error, refresh } = useMyGameProfiles()
  const navigate = useNavigate()

  /**
   * Maneja la eliminación de un perfil con confirmación.
   *
   * En apps de producción se usa un modal custom en vez de window.confirm,
   * pero para empezar el nativo es suficiente y respeta los estilos del SO.
   */
  async function handleDelete(gameSlug) {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar tu perfil de este juego? Si tenés búsquedas activas, podrían fallar.`
    )
    if (!confirmed) return

    try {
      await api.delete(`/users/me/game-profiles/${gameSlug}`)
      // Después de eliminar, refrescamos la lista. El estado de UI se actualiza solo.
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      window.alert(detail || 'No pudimos eliminar el perfil. Intentalo de nuevo.')
    }
  }

  /**
   * Maneja el click en "Editar": redirige a la página de edición.
   * Esa página la creamos en la sesión 3.
   */
  function handleEdit(gameSlug) {
    navigate(`/profile/game-profiles/${gameSlug}/edit`)
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb / link al perfil */}
        <div className="mb-4">
          <Link to="/profile" className="text-gray-400 hover:text-white text-sm">
            ← Volver a mi perfil
          </Link>
        </div>

        {/* Encabezado */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Mis perfiles de juego</h1>
            <p className="text-gray-400 mt-2">
              Un perfil por cada juego que jugás. Determinan qué búsquedas podés
              crear o a cuáles unirte.
            </p>
          </div>

          <Link
            to="/profile/game-profiles/new"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            + Nuevo perfil
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <p className="text-gray-400">Cargando tus perfiles...</p>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && profiles.length === 0 && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-12 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-lg font-semibold mb-2">
              Todavía no tenés perfiles de juego
            </p>
            <p className="text-gray-400 mb-6">
              Creá tu primer perfil para empezar a armar equipo.
            </p>
            <Link
              to="/profile/game-profiles/new"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Crear mi primer perfil
            </Link>
          </div>
        )}

        {/* Lista de perfiles */}
        {!loading && !error && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile) => (
              <GameProfileCard
                key={profile.id}
                profile={profile}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default GameProfilesPage