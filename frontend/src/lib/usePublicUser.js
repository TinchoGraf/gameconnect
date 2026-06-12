import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook para traer datos públicos de un usuario + las reviews que recibió.
 *
 * Hace 2 llamadas en paralelo:
 *   GET /users/{username}            → datos públicos del usuario
 *   GET /users/{username}/reviews    → reviews que recibió
 *
 * El endpoint /users/{username} es PÚBLICO (no requiere auth) y devuelve
 * solo los campos seguros para mostrar a cualquiera: username, reputación,
 * reviews_received_count, etc. No incluye email ni otros datos privados.
 */
export function usePublicUser(username) {
  const [user, setUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!username) return
    setLoading(true)
    setError(null)
    try {
      const [userResp, reviewsResp] = await Promise.all([
        api.get(`/users/${username}`),
        api.get(`/users/${username}/reviews`),
      ])
      setUser(userResp.data)
      setReviews(reviewsResp.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) {
        setError(`No existe el usuario "${username}".`)
      } else {
        setError('No pudimos cargar el perfil.')
      }
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { user, reviews, loading, error, refresh }
}