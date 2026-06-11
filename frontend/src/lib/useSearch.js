import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook para traer los datos de una búsqueda específica + sus participantes.
 *
 * Hace DOS requests en paralelo (con Promise.all):
 *   - GET /searches/{id}: datos de la búsqueda
 *   - GET /searches/{id}/participations: lista de participantes
 *
 * Devuelve search, participations, loading, error, refresh.
 */
export function useSearch(searchId) {
  const [search, setSearch] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!searchId) return
    setLoading(true)
    setError(null)
    try {
      // Promise.all corre ambas requests en paralelo, no en serie.
      // Más rápido que await separados.
      const [searchResp, partsResp] = await Promise.all([
        api.get(`/searches/${searchId}`),
        api.get(`/searches/${searchId}/participations`),
      ])
      setSearch(searchResp.data)
      setParticipations(partsResp.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) {
        setError('Esta búsqueda no existe.')
      } else {
        setError('No pudimos cargar la búsqueda.')
      }
    } finally {
      setLoading(false)
    }
  }, [searchId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { search, participations, loading, error, refresh }
}