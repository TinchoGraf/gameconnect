import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { useSearch } from '../lib/useSearch'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'
import ParticipationsList from '../components/ParticipationsList'

/**
 * Página de detalle de una búsqueda.
 *
 * Roles posibles del usuario actual:
 *   - Creador: ve panel de gestión (lo armamos en sesión 3.B)
 *   - Participante (pending o accepted): ve su estado y puede salirse
 *   - Externo logueado: puede unirse (si cumple los requisitos)
 *   - No logueado: ve la info pero no puede actuar
 *
 * El backend valida todo: server matching, perfil del juego, cupo, etc.
 * Si algo falla, mostramos el mensaje que devuelve.
 */
function SearchDetailPage() {
  const { id } = useParams()
  const searchId = parseInt(id, 10)
  const navigate = useNavigate()

  const { currentUser, isAuthenticated } = useAuth()
  const { search, participations, loading, error, refresh } = useSearch(searchId)
  const { profiles: myProfiles } = useMyGameProfiles()

  // Estado del form de unirse
  const [selectedRole, setSelectedRole] = useState('')
  const [actionError, setActionError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Loading inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando búsqueda...</p>
        </div>
      </div>
    )
  }

  // Error / no encontrada
  if (error || !search) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
              ← Volver a búsquedas
            </Link>
          </div>
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error || 'No pudimos cargar la búsqueda.'}
          </div>
        </div>
      </div>
    )
  }

  // Calcular el rol del usuario actual respecto a esta búsqueda
  const isCreator = isAuthenticated && currentUser?.id === search.creator.id
  const myParticipation = participations.find(
    (p) => isAuthenticated && p.user.id === currentUser?.id && p.status !== 'left' && p.status !== 'rejected'
  )
  const isParticipant = !!myParticipation

  // Mi perfil para este juego (necesario para unirse)
  const myProfileForGame = myProfiles.find((p) => p.game.slug === search.game.slug)
  const serverMatches = myProfileForGame?.server === search.server

  // ¿Puede unirse? Combinación de condiciones
  const canTryToJoin =
    isAuthenticated &&
    !isCreator &&
    !isParticipant &&
    search.status === 'open' &&
    search.accepted_count < search.max_players

  // Mensajes de "por qué no puedo unirme" (para informar al usuario)
  let cantJoinReason = null
  if (canTryToJoin) {
    if (!myProfileForGame) {
      cantJoinReason = `Necesitás un perfil de ${search.game.name} para unirte. Crealo desde tu perfil.`
    } else if (!serverMatches) {
      cantJoinReason = `Tu perfil de ${search.game.name} juega en ${myProfileForGame.server}, pero esta búsqueda es en ${search.server}.`
    }
  }

  /**
   * Unirse a la búsqueda. El backend valida todo y devuelve error claro
   * si algo no cumple.
   */
  async function handleJoin() {
    setActionError(null)
    setActionLoading(true)
    try {
      await api.post(`/searches/${searchId}/join`, {
        role: selectedRole || null,
      })
      await refresh() // Recargar datos para mostrar nueva participación
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos unirte.')
    } finally {
      setActionLoading(false)
    }
  }

  /**
   * Salirse de la búsqueda. Confirmamos antes porque es una acción "destructiva".
   */
  async function handleLeave() {
    const ok = window.confirm('¿Seguro que querés salir de esta búsqueda?')
    if (!ok) return

    setActionError(null)
    setActionLoading(true)
    try {
      await api.post(`/searches/${searchId}/leave`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos sacarte.')
    } finally {
      setActionLoading(false)
    }
  }

  const isFull = search.accepted_count >= search.max_players
  const statusLabels = {
    open: { text: 'Abierta', color: 'bg-green-900/40 text-green-300' },
    full: { text: 'Completa', color: 'bg-amber-900/40 text-amber-300' },
    in_progress: { text: 'En juego', color: 'bg-blue-900/40 text-blue-300' },
    completed: { text: 'Completada', color: 'bg-purple-900/40 text-purple-300' },
    cancelled: { text: 'Cancelada', color: 'bg-red-900/40 text-red-300' },
  }
  const statusInfo = statusLabels[search.status] || { text: search.status, color: 'bg-dark-700 text-gray-300' }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
            ← Volver a búsquedas
          </Link>
        </div>

        {/* Header: título + estado */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs text-primary-500 font-semibold uppercase">
                {search.game.name}
              </span>
              <h1 className="text-3xl font-bold mt-1">{search.title}</h1>
            </div>
            <span className={`text-xs px-3 py-1 rounded whitespace-nowrap ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Creada por <span className="text-white">{search.creator.username}</span>
            {search.creator.reputation_score > 0 && (
              <span className="text-gray-500 ml-2">
                · ⭐ {search.creator.reputation_score.toFixed(1)}
              </span>
            )}
          </p>

          {search.description && (
            <p className="text-gray-300 mb-4 whitespace-pre-wrap">{search.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Server</p>
              <p className="text-white font-semibold">{search.server}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Modo</p>
              <p className="text-white font-semibold">{search.mode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Jugadores</p>
              <p className="text-white font-semibold">{search.accepted_count} / {search.max_players}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unión</p>
              <p className="text-white font-semibold">
                {search.join_mode === 'auto' ? '⚡ Auto' : '👤 Manual'}
              </p>
            </div>
            {search.min_rank && (
              <div className="col-span-2 sm:col-span-4">
                <p className="text-xs text-gray-500">Rango mínimo</p>
                <p className="text-white">{search.min_rank}</p>
              </div>
            )}
          </div>

          {search.roles_needed.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dark-700">
              <p className="text-xs text-gray-500 mb-2">Roles buscados</p>
              <div className="flex flex-wrap gap-2">
                {search.roles_needed.map((role) => (
                  <span
                    key={role}
                    className="bg-primary-700/30 text-primary-50 text-xs px-2 py-1 rounded"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel de acción según rol del usuario */}

        {/* Caso 1: ya participo */}
        {isParticipant && search.status === 'open' && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-2">
              {myParticipation.status === 'pending'
                ? '⏳ Tu solicitud está pendiente'
                : '✅ Sos parte del equipo'}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {myParticipation.status === 'pending'
                ? 'El creador todavía no aceptó tu solicitud.'
                : 'Vas a poder calificar a los demás cuando la partida termine.'}
            </p>
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="bg-red-900 hover:bg-red-950 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {actionLoading ? 'Saliendo...' : 'Salir de la búsqueda'}
            </button>
          </div>
        )}

        {/* Caso 2: puedo unirme */}
        {canTryToJoin && !cantJoinReason && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Unirme a la búsqueda</h2>
            <p className="text-gray-400 text-sm mb-4">
              {search.join_mode === 'auto'
                ? 'Esta búsqueda acepta postulantes automáticamente. Si hay cupo, entrás directo.'
                : 'El creador va a revisar tu postulación. Si te acepta, sos parte del equipo.'}
            </p>

            <div className="mb-4">
              <label htmlFor="role" className="block text-sm text-gray-300 mb-1">
                Rol que querés jugar <span className="text-gray-500">(opcional)</span>
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              >
                <option value="">Sin especificar</option>
                {myProfileForGame?.roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Solo aparecen los roles que jugás en tu perfil.
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={actionLoading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {actionLoading ? 'Uniéndote...' : search.join_mode === 'auto' ? 'Unirme' : 'Postularme'}
            </button>
          </div>
        )}

        {/* Caso 3: no puedo unirme por algún motivo, pero estoy logueado */}
        {isAuthenticated && !isCreator && !isParticipant && cantJoinReason && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6 text-sm">
            <p className="text-amber-100">⚠️ {cantJoinReason}</p>
          </div>
        )}

        {/* Caso 4: no logueado */}
        {!isAuthenticated && search.status === 'open' && (
          <div className="bg-primary-700/20 border border-primary-700 rounded-lg p-4 mb-6 text-sm">
            <Link to="/login" className="text-primary-500 hover:underline font-semibold">
              Iniciá sesión
            </Link>
            <span className="text-gray-300"> para postularte a esta búsqueda.</span>
          </div>
        )}

        {/* Error de acción */}
        {actionError && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm mb-6">
            {actionError}
          </div>
        )}

        {/* Lista de participantes */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Participantes ({search.accepted_count}/{search.max_players})
          </h2>
          <ParticipationsList
            participations={participations}
            creatorId={search.creator.id}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    </div>
  )
}

export default SearchDetailPage