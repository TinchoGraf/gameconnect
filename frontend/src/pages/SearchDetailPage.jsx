import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/AuthContext'
import { useSearchDetail } from '../lib/useSearchDetail'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'
import ParticipantCard from '../components/ParticipantCard'

/**
 * Página de detalle de una búsqueda. Muestra info + lista de participantes.
 *
 * Comportamiento por rol:
 * - Visitante (no logueado): solo lectura.
 * - Logueado no participante: puede unirse si cumple condiciones.
 * - Postulante pending: ve su estado y puede cancelar postulación.
 * - Accepted no-creador: ve a los demás y puede salirse.
 * - Creador: acepta/rechaza, inicia, completa, cancela.
 */
function SearchDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, currentUser } = useAuth()

  const { search, participations, loading, error, refresh } = useSearchDetail(id)
  const { profiles: myProfiles } = useMyGameProfiles()

  const [joinRole, setJoinRole] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  const myParticipation = useMemo(() => {
    if (!currentUser) return null
    return participations.find((p) => p.user.id === currentUser.id) || null
  }, [participations, currentUser])

  const myProfileForGame = useMemo(() => {
    if (!search) return null
    return myProfiles.find((p) => p.game.slug === search.game.slug) || null
  }, [search, myProfiles])

  const isCreator = currentUser && search && currentUser.id === search.creator.id
  const acceptedParticipations = participations.filter((p) => p.status === 'accepted')
  const pendingParticipations = participations.filter((p) => p.status === 'pending')
  const isSearchOpen = search?.status === 'open'
  const isSearchFull = search?.status === 'full'
  const isInProgress = search?.status === 'in_progress'
  const canStillJoin = isSearchOpen && acceptedParticipations.length < (search?.max_players || 0)

  // ----- Acciones de postulante -----

  async function handleJoin() {
    if (!joinRole) {
      setActionError('Elegí un rol antes de unirte.')
      return
    }
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/join`, { role: joinRole })
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos unirte.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleLeave() {
    const confirmed = window.confirm('¿Seguro que querés salirte de esta búsqueda?')
    if (!confirmed) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/leave`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos sacarte.')
    } finally {
      setActionLoading(false)
    }
  }

  // ----- Acciones del creador -----

  async function handleAccept(userId) {
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/participations/${userId}/accept`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos aceptar al postulante.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(userId) {
    const confirmed = window.confirm('¿Seguro que querés rechazar a este postulante?')
    if (!confirmed) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/participations/${userId}/reject`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos rechazar al postulante.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStart() {
    const confirmed = window.confirm('¿Marcar la búsqueda como "en juego"? Los demás verán que ya están jugando.')
    if (!confirmed) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/start`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos iniciar la búsqueda.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleComplete() {
    const confirmed = window.confirm(
      '¿Marcar la búsqueda como completada? Después de esto se podrán escribir reviews entre participantes (próxima fase).'
    )
    if (!confirmed) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/searches/${id}/complete`)
      await refresh()
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos completar la búsqueda.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      '¿Seguro que querés cancelar la búsqueda? Esta acción no se puede deshacer.'
    )
    if (!confirmed) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.delete(`/searches/${id}`)
      // Después de cancelar redirigimos al listado
      navigate('/searches')
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos cancelar la búsqueda.')
      setActionLoading(false)
    }
  }

  // ----- Render -----

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

  if (error) {
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
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!search) return null

  const statusLabels = {
    open: { text: 'Abierta', color: 'bg-green-900/40 text-green-300' },
    full: { text: 'Llena', color: 'bg-amber-900/40 text-amber-300' },
    in_progress: { text: 'En juego', color: 'bg-blue-900/40 text-blue-300' },
    completed: { text: 'Completada', color: 'bg-purple-900/40 text-purple-300' },
    cancelled: { text: 'Cancelada', color: 'bg-red-900/40 text-red-300' },
  }
  const statusUi = statusLabels[search.status] || statusLabels.open

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-4">
          <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
            ← Volver a búsquedas
          </Link>
        </div>

        {/* Header */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-primary-500 font-semibold uppercase mb-1">
                {search.game.name}
              </p>
              <h1 className="text-3xl font-bold text-white">{search.title}</h1>
            </div>
            <span className={`text-xs px-3 py-1 rounded whitespace-nowrap ${statusUi.color}`}>
              {statusUi.text}
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
              <p className="text-white font-semibold">{acceptedParticipations.length} / {search.max_players}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unión</p>
              <p className="text-white font-semibold">{search.join_mode === 'auto' ? 'Automática' : 'Manual'}</p>
            </div>
          </div>

          {search.min_rank && (
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Rango mínimo: </span>
              <span className="text-white">{search.min_rank}</span>
            </div>
          )}

          {search.roles_needed.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">Roles buscados:</p>
              <div className="flex flex-wrap gap-1">
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

        {/* CTA login */}
        {!isAuthenticated && isSearchOpen && (
          <div className="bg-primary-700/20 border border-primary-700 rounded-lg p-4 mb-6 text-sm">
            <Link to="/login" className="text-primary-500 hover:underline font-semibold">
              Iniciá sesión
            </Link>
            <span className="text-gray-300"> para unirte a esta búsqueda.</span>
          </div>
        )}

        {/* Panel de creador: acciones de administración */}
        {isCreator && search.status !== 'cancelled' && search.status !== 'completed' && (
          <div className="bg-dark-800 border border-primary-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">👑 Panel del creador</h2>
            <p className="text-sm text-gray-400 mb-4">
              Estado actual: <strong>{statusUi.text}</strong>. Próximas acciones disponibles:
            </p>
            <div className="flex flex-wrap gap-2">
              {(isSearchOpen || isSearchFull) && (
                <button
                  onClick={handleStart}
                  disabled={actionLoading}
                  className="text-sm bg-blue-700 hover:bg-blue-600 disabled:bg-dark-700 text-white px-4 py-2 rounded transition-colors"
                >
                  ▶ Iniciar partida
                </button>
              )}
              {isInProgress && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="text-sm bg-purple-700 hover:bg-purple-600 disabled:bg-dark-700 text-white px-4 py-2 rounded transition-colors"
                >
                  ✓ Marcar como completada
                </button>
              )}
              {(isSearchOpen || isSearchFull || isInProgress) && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="text-sm bg-red-900 hover:bg-red-800 disabled:bg-dark-700 text-white px-4 py-2 rounded transition-colors"
                >
                  ✕ Cancelar búsqueda
                </button>
              )}
            </div>
          </div>
        )}

        {/* Postulación pending */}
        {myParticipation?.status === 'pending' && !isCreator && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-100 mb-3">
              ⏳ Tu postulación está <strong>pendiente</strong> de aprobación.
            </p>
            <button
              onClick={handleLeave}
              disabled={actionLoading}
              className="text-sm bg-dark-700 hover:bg-dark-900 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
            >
              Cancelar postulación
            </button>
          </div>
        )}

        {/* Participación accepted */}
        {myParticipation?.status === 'accepted' && !isCreator && (
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-100 mb-3">
              ✅ Estás dentro como <strong>{myParticipation.role || 'cualquier rol'}</strong>.
            </p>
            {(isSearchOpen || isSearchFull) && (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="text-sm bg-dark-700 hover:bg-dark-900 disabled:opacity-50 text-white px-4 py-2 rounded transition-colors"
              >
                Salirme de la búsqueda
              </button>
            )}
          </div>
        )}

        {/* rejected o left */}
        {(myParticipation?.status === 'rejected' || myParticipation?.status === 'left') && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-6 text-sm text-gray-400">
            {myParticipation.status === 'rejected'
              ? 'Tu postulación fue rechazada por el creador.'
              : 'Te saliste de esta búsqueda.'}
          </div>
        )}

        {/* Form unirse */}
        {isAuthenticated && !isCreator && canStillJoin &&
          (!myParticipation || ['rejected', 'left'].includes(myParticipation.status)) && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Unirme a esta búsqueda</h2>

            {!myProfileForGame ? (
              <div className="text-sm">
                <p className="text-gray-300 mb-3">
                  Para unirte necesitás un perfil de <strong>{search.game.name}</strong>.
                </p>
                <Link
                  to="/profile/game-profiles/new"
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded transition-colors"
                >
                  Crear perfil de {search.game.name}
                </Link>
              </div>
            ) : myProfileForGame.server !== search.server ? (
              <div className="text-sm">
                <p className="text-gray-300">
                  Tu perfil de {search.game.name} juega en <strong>{myProfileForGame.server}</strong>,
                  pero esta búsqueda es en <strong>{search.server}</strong>. No podés unirte por
                  diferencia de servidor.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-3">
                  Elegí qué rol vas a jugar. Solo aparecen los que tenés en tu perfil.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <select
                    value={joinRole}
                    onChange={(e) => setJoinRole(e.target.value)}
                    className="bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Elegí un rol...</option>
                    {myProfileForGame.roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleJoin}
                    disabled={actionLoading || !joinRole}
                    className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    {actionLoading ? 'Enviando...' : 'Unirme'}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {search.join_mode === 'auto'
                    ? '⚡ Entrás automáticamente si hay cupo.'
                    : '👤 Tu postulación queda pendiente hasta que el creador la apruebe.'}
                </p>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {actionError && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm mb-6">
            {actionError}
          </div>
        )}

        {/* Equipo */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Equipo ({acceptedParticipations.length}/{search.max_players})
          </h2>
          {acceptedParticipations.length === 0 ? (
            <p className="text-sm text-gray-400">Todavía no hay nadie confirmado.</p>
          ) : (
            <div className="space-y-2">
              {acceptedParticipations.map((p) => (
                <ParticipantCard key={p.id} participation={p} />
              ))}
            </div>
          )}
        </div>

        {/* Pendientes: con acciones de aceptar/rechazar si soy el creador */}
        {pendingParticipations.length > 0 && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">
              Postulantes pendientes ({pendingParticipations.length})
            </h2>
            <div className="space-y-2">
              {pendingParticipations.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participation={p}
                  canManage={isCreator && isSearchOpen}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default SearchDetailPage