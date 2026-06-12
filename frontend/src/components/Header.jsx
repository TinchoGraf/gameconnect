import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        <Link to="/" className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
          🎮 <span className="text-primary-500">GameConnect</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/searches"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Búsquedas
          </Link>
          <Link
            to="/games"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Juegos
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-searches"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Mis búsquedas
              </Link>
              <Link
                to="/pending-reviews"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Reviews
              </Link>
              <Link
                to="/profile"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Hola, <span className="text-primary-500 font-semibold">{currentUser.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-dark-700 hover:bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
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