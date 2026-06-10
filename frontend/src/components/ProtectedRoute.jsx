import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

/**
 * Wrapper para rutas que requieren autenticación.
 *
 * Uso:
 *   <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
 *
 * Si el usuario NO está logueado, lo redirigimos a /login y guardamos
 * la URL a la que intentaba ir, para mandarlo ahí después del login.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Mientras chequeamos el token inicial, no decidimos nada todavía
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  // No autenticado: redirigimos a login pasando la URL original
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Autenticado: mostramos el contenido protegido
  return children
}

export default ProtectedRoute