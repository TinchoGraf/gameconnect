import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook que trae las partidas donde tengo reviews pendientes de escribir.
 *
 * El backend devuelve una lista de objetos así:
 *   {
 *     search_id, search_title, game_slug, completed_at,
 *     pending_users: [{ user_id, username }, ...]
 *   }
 *
 * Cada partida puede tener varios usuarios para calificar.
 */
export function usePendingReviews() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/users/me/pending-reviews')
      setPending(response.data)
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar tus reviews pendientes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { pending, loading, error, refresh }
}