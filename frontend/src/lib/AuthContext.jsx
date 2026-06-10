import { createContext, useContext, useState, useEffect } from 'react'
import { api } from './api'

/**
 * Contexto de autenticación global.
 *
 * Cualquier componente puede usar el hook useAuth() para saber:
 * - Si el usuario está logueado (currentUser !== null)
 * - Los datos del usuario actual (currentUser.username, etc.)
 * - Llamar a logout() para cerrar sesión
 * - Llamar a refresh() para recargar los datos del usuario
 *
 * Al cargar la app, si hay un token guardado en localStorage,
 * intentamos traer los datos del usuario con GET /users/me.
 * Si la respuesta es 401 (token inválido o expirado), lo limpiamos.
 */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // null = todavía no sabemos / no logueado, objeto = datos del usuario logueado
  const [currentUser, setCurrentUser] = useState(null)
  // mientras chequeamos el token inicial
  const [loading, setLoading] = useState(true)

  // Al cargar la app, si hay token, traemos los datos del usuario
  useEffect(() => {
    async function loadUserFromToken() {
      const token = localStorage.getItem('gameconnect_token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const response = await api.get('/users/me')
        setCurrentUser(response.data)
      } catch (err) {
        // Token inválido o expirado: lo borramos
        console.warn('Token inválido, limpiando.')
        localStorage.removeItem('gameconnect_token')
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadUserFromToken()
  }, [])

  /**
   * Cerrar sesión: borrar token y limpiar el estado.
   * No hace falta llamar a ningún endpoint del backend (JWT es stateless).
   */
  function logout() {
    localStorage.removeItem('gameconnect_token')
    setCurrentUser(null)
  }

  /**
   * Refresca los datos del usuario actual desde el backend.
   * Útil después de actualizar el perfil, por ejemplo.
   */
  async function refresh() {
    try {
      const response = await api.get('/users/me')
      setCurrentUser(response.data)
    } catch (err) {
      console.error('No se pudo refrescar el usuario.', err)
    }
  }

  /**
   * Después de un login exitoso (que ya guardó el token en localStorage),
   * esta función trae los datos del usuario y los pone en el contexto.
   */
  async function loadCurrentUser() {
    const response = await api.get('/users/me')
    setCurrentUser(response.data)
    return response.data
  }

  const value = {
    currentUser,
    isAuthenticated: currentUser !== null,
    loading,
    logout,
    refresh,
    loadCurrentUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para consumir el contexto desde cualquier componente.
 * Uso típico:
 *   const { currentUser, logout } = useAuth()
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}