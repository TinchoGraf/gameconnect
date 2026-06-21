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

/**
 * Dado un objeto Friendship (con requester/addressee) y el username del
 * usuario actual, devuelve el "otro" usuario de la amistad.
 *
 * Importante: una Friendship no siempre tiene al usuario actual como
 * addressee — si YO fui quien recibió y aceptó la solicitud, soy el
 * addressee y el amigo es el requester.
 */
export function getOtherUser(friendship, currentUsername) {
  return friendship.requester.username === currentUsername
    ? friendship.addressee
    : friendship.requester
}

/**
 * Determina la relación de amistad entre el usuario actual y `username`
 * a partir de las tres listas que devuelve useFriends().
 */
export function getRelationStatus(friends, sentRequests, receivedRequests, username) {
  if (friends.some(f =>
    f.requester.username === username || f.addressee.username === username
  )) return 'friend'
  if (sentRequests.some(r => r.addressee.username === username)) return 'sent'
  if (receivedRequests.some(r => r.requester.username === username)) return 'received'
  return 'none'
}