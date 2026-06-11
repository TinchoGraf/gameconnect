import { useState, useEffect } from 'react'
import { api } from './api'

/**
 * Hook para traer la lista completa de juegos del backend.
 *
 * El endpoint GET /games es público (no requiere auth) y devuelve todos
 * los juegos con sus roles, servers y modos disponibles.
 *
 * Idealmente cachearíamos esto porque no cambia entre requests, pero por
 * ahora lo fetcheamos cada vez. Si en algún momento se vuelve un cuello
 * de botella, podemos memoizarlo.
 */
export function useGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchGames() {
      try {
        const response = await api.get('/games')
        setGames(response.data)
      } catch (err) {
        console.error(err)
        setError('No pudimos cargar los juegos.')
      } finally {
        setLoading(false)
      }
    }
    fetchGames()
  }, [])

  return { games, loading, error }
}