import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook para traer la lista de búsquedas con filtros opcionales.
 *
 * Recibe un objeto con los filtros (game_slug, server, mode).
 * Si un filtro está vacío, no se manda al backend.
 *
 * Devuelve searches, loading, error, refresh (para forzar re-fetch).
 */
export function useSearches(filters = {}) {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Convertimos los filtros a un string estable para usar como dependencia
  // del useEffect (los objetos crean nueva referencia en cada render).
  const filtersKey = JSON.stringify(filters)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Solo mandamos los filtros que tienen valor
      const params = {}
      if (filters.game_slug) params.game_slug = filters.game_slug
      if (filters.server) params.server = filters.server
      if (filters.mode) params.mode = filters.mode

      const response = await api.get('/searches', { params })
      setSearches(response.data)
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar las búsquedas.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { searches, loading, error, refresh }
}