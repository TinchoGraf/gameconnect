import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

/**
 * Hook personalizado para gestionar la lista de perfiles de juego del usuario actual.
 *
 * Devuelve:
 *   - profiles: array con los perfiles (vacío mientras carga)
 *   - loading: true mientras está fetcheando
 *   - error: string con el mensaje de error o null
 *   - refresh: función para forzar un re-fetch (útil después de crear/borrar uno)
 *
 * El patrón "hook personalizado" es estándar en React: cuando una lógica con
 * useState + useEffect se va a usar en más de un lugar (o cuando el componente
 * se está poniendo muy grande), se extrae a un hook propio.
 */
export function useMyGameProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // useCallback evita que esta función se "regenere" en cada render,
  // lo que importa cuando otros hooks dependen de ella.
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get('/users/me/game-profiles')
      setProfiles(response.data)
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar tus perfiles de juego.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Al montar el componente que use este hook, hacemos el primer fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  return { profiles, loading, error, refresh }
}