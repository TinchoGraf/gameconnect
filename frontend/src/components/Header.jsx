import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

/**
 * Header con navegación dinámica según el estado de autenticación.
 *
 * Si el usuario NO está logueado: muestra botones "Iniciar sesión" / "Crear cuenta"
 * Si SÍ está logueado: muestra el username + botón "Cerrar sesión"
 */
function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/') // Después de cerrar sesión, volvemos al inicio
  }

  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
          🎮 <span className="text-primary-500">GameConnect</span>
        </Link>

        {/* Links de navegación */}
        <div className="flex items-center gap-6">
          <Link
            to="/games"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Juegos
          </Link>

          {isAuthenticated ? (
            // Vista LOGUEADO
            <>
              <span className="text-gray-300">
                Hola, <span className="text-primary-500 font-semibold">{currentUser.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="bg-dark-700 hover:bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            // Vista NO logueado (como antes)
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

      </nav>
    </header>
  )
}

export default Header