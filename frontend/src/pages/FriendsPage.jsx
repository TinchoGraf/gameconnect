import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useFriends, getOtherUser, getRelationStatus } from '../lib/useFriends'
import { useAuth } from '../lib/AuthContext'
import Header from '../components/Header'
import FriendActionButton from '../components/FriendActionButton'

/**
 * Página de amigos.
 *
 * Secciones:
 * 1. Buscador con debounce para encontrar usuarios
 * 2. Solicitudes recibidas pendientes (con aceptar/rechazar)
 * 3. Lista de amigos actuales
 */
function FriendsPage() {
  const { currentUser } = useAuth()
  const { friends, receivedRequests, sentRequests, loading, error, refresh } = useFriends()

  // Buscador
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  // Acciones
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  /**
   * Debounce: esperamos 350ms después de la última tecla antes de buscar.
   * useRef guarda el timer entre renders sin causar re-renders.
   */
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    // Limpiar el timer anterior si el usuario sigue escribiendo
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
        setSearchResults(response.data)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }, 350)

    // Cleanup: si el componente se desmonta, cancelar el timer
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  // Helpers para acciones
  async function handleSendRequest(username) {
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/friends/requests/${username}`)
      await refresh()
      // No limpiamos el buscador — el botón cambia de estado automáticamente
      // porque getRelationStatus detecta la nueva solicitud enviada
    } catch (err) {
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos enviar la solicitud.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAccept(username) {
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/friends/requests/${username}/accept`)
      await refresh()
    } catch (err) {
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos aceptar la solicitud.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(username) {
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/friends/requests/${username}/reject`)
      await refresh()
    } catch (err) {
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos rechazar la solicitud.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveFriend(username) {
    if (!window.confirm(`¿Seguro que querés eliminar a ${username} de tus amigos?`)) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.delete(`/friends/${username}`)
      await refresh()
    } catch (err) {
      const detail = err.response?.data?.detail
      setActionError(typeof detail === 'string' ? detail : 'No pudimos eliminar el amigo.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Amigos</h1>
        <p className="text-gray-400 mb-8">
          Agregá gamers para invitarlos directamente a tus búsquedas.
        </p>

        {/* Error de acción */}
        {actionError && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm mb-6">
            {actionError}
          </div>
        )}

        {/* Buscador */}
        <section className="bg-dark-800 border border-dark-700 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-3">Buscar jugadores</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribí un username... (mínimo 2 caracteres)"
            className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors mb-3"
          />

          {searching && (
            <p className="text-sm text-gray-400">Buscando...</p>
          )}

          {!searching && query.length >= 2 && searchResults.length === 0 && (
            <p className="text-sm text-gray-400">No se encontraron usuarios con ese nombre.</p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => {
                const relation = getRelationStatus(friends, sentRequests, receivedRequests, user.username)
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-3 bg-dark-900 border border-dark-700 rounded-lg p-3"
                  >
                    <div>
                      <Link
                        to={`/users/${user.username}`}
                        className="font-semibold text-white hover:text-primary-500 transition-colors"
                      >
                        {user.username}
                      </Link>
                      {user.reputation_score > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                          ⭐ {user.reputation_score.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <FriendActionButton
                      relation={relation}
                      disabled={actionLoading}
                      onSendRequest={() => handleSendRequest(user.username)}
                      onAccept={() => handleAccept(user.username)}
                      onReject={() => handleReject(user.username)}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Solicitudes recibidas */}
        {receivedRequests.length > 0 && (
          <section className="bg-dark-800 border border-amber-700/50 rounded-lg p-5 mb-6">
            <h2 className="text-lg font-semibold mb-3">
              Solicitudes recibidas
              <span className="ml-2 bg-amber-700/40 text-amber-300 text-xs px-2 py-0.5 rounded">
                {receivedRequests.length}
              </span>
            </h2>
            <div className="space-y-2">
              {receivedRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 bg-dark-900 border border-dark-700 rounded-lg p-3"
                >
                  <Link
                    to={`/users/${req.requester.username}`}
                    className="font-semibold text-white hover:text-primary-500 transition-colors"
                  >
                    {req.requester.username}
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.requester.username)}
                      disabled={actionLoading}
                      className="text-xs bg-green-700 hover:bg-green-600 disabled:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleReject(req.requester.username)}
                      disabled={actionLoading}
                      className="text-xs bg-dark-700 hover:bg-dark-900 disabled:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Lista de amigos */}
        <section className="bg-dark-800 border border-dark-700 rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-3">
            Mis amigos
            {friends.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({friends.length})
              </span>
            )}
          </h2>

          {friends.length === 0 ? (
            <p className="text-sm text-gray-400">
              Todavía no tenés amigos en GameConnect. Buscalos arriba.
            </p>
          ) : (
            <div className="space-y-2">
              {friends.map((friendship) => {
                const otherUser = getOtherUser(friendship, currentUser.username)
                return (
                  <div
                    key={friendship.id}
                    className="flex items-center justify-between gap-3 bg-dark-900 border border-dark-700 rounded-lg p-3"
                  >
                    <div>
                      <Link
                        to={`/users/${otherUser.username}`}
                        className="font-semibold text-white hover:text-primary-500 transition-colors"
                      >
                        {otherUser.username}
                      </Link>
                      {otherUser.reputation_score > 0 && (
                        <span className="text-xs text-gray-400 ml-2">
                          ⭐ {otherUser.reputation_score.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(otherUser.username)}
                      disabled={actionLoading}
                      className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 border border-red-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default FriendsPage