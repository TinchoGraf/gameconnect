import { Link } from 'react-router-dom'

/**
 * Header de navegación.
 *
 * Aparece arriba de todas las páginas internas.
 * En la próxima sesión vamos a mostrar el username del usuario
 * logueado y un botón de logout, según si hay sesión activa o no.
 */
function Header() {
  return (
    <header className="bg-dark-800 border-b border-dark-700">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        {/* Logo / nombre */}
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
        </div>

      </nav>
    </header>
  )
}

export default Header