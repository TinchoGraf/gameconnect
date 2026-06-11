import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook para traer el detalle de una búsqueda + sus participaciones.
 *
 * Hace 2 llamadas en paralelo:
 *   GET /searches/{id}            → datos de la búsqueda
 *   GET /searches/{id}/participations → lista de participantes
 *
 * Devuelve search, participations, loading, error, refresh.
 * refresh() vuelve a hacer ambas llamadas — útil después de
 * unirse, aceptar, rechazar, etc.
 */
export function useSearchDetail(searchId) {
  const [search, setSearch] = useState(null)
  const [participations, setParticipations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!searchId) return
    setLoading(true)
    setError(null)
    try {
      // Promise.all dispara las dos llamadas en paralelo (más rápido que
      // hacerlas secuenciales con dos awaits).
      const [searchResp, partsResp] = await Promise.all([
        api.get(`/searches/${searchId}`),
        api.get(`/searches/${searchId}/participations`),
      ])
      setSearch(searchResp.data)
      setParticipations(partsResp.data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 404) {
        setError('Esa búsqueda no existe.')
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