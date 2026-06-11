import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook que trae las búsquedas relevantes para el usuario actual.
 *
 * El backend devuelve:
 *   { created: [...], participating: [...] }
 *
 * "created" son las búsquedas que YO creé (de cualquier estado).
 * "participating" son las búsquedas donde me uní (accepted o pending)
 *                 sin ser creador.
 *
 * Devuelve también un refresh() para forzar re-fetch.
 */
export function useMySearches() {
  const [created, setCreated] = useState([])
  const [participating, setParticipating] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/searches/me/listing')
      setCreated(response.data.created)
      setParticipating(response.data.participating)
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar tus búsquedas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { created, participating, loading, error, refresh }
}