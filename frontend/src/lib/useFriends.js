import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook que trae el estado completo de amigos del usuario actual:
 * - friends: lista de amistades aceptadas
 * - receivedRequests: solicitudes que recibí (pending)
 * - sentRequests: solicitudes que mandé (pending)
 *
 * Devuelve refresh() para forzar re-fetch después de una acción.
 */
export function useFriends() {
  const [friends, setFriends] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [friendsResp, receivedResp, sentResp] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests/received'),
        api.get('/friends/requests/sent'),
      ])
      setFriends(friendsResp.data)
      setReceivedRequests(receivedResp.data)
      setSentRequests(sentResp.data)
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar tus amigos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { friends, receivedRequests, sentRequests, loading, error, refresh }
}