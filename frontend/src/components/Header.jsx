import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const linkClass = "text-gray-300 hover:text-white transition-colors"

function Header() {
  const { currentUser, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [lastPathname, setLastPathname] = useState(location.pathname)
  const headerRef = useRef(null)

  if (location.pathname !== lastPathname) {
    setLastPathname(location.pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <header className="bg-dark-800 border-b border-dark-700" ref={headerRef}>
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        <Link to="/" className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
          🎮 <span className="text-primary-500">GameConnect</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/searches" className={linkClass}>Búsquedas</Link>
          <Link to="/games" className={linkClass}>Juegos</Link>
          <Link to="/report-bug" className={linkClass}>🐛 Reportar bug</Link>

          {isAuthenticated ? (
            <>
              <Link to="/my-searches" className={linkClass}>Mis búsquedas</Link>
              <Link to="/pending-reviews" className={linkClass}>Reviews</Link>
              <Link to="/friends" className={linkClass}>Amigos</Link>
              <Link to="/profile" className={linkClass}>
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
              <Link to="/login" className={linkClass}>Iniciar sesión</Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden text-gray-300 hover:text-white p-2 -mr-2"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-dark-700 px-4 py-4 flex flex-col gap-4">
          <Link to="/searches" className={linkClass}>Búsquedas</Link>
          <Link to="/games" className={linkClass}>Juegos</Link>
          <Link to="/report-bug" className={linkClass}>🐛 Reportar bug</Link>

          {isAuthenticated ? (
            <>
              <Link to="/my-searches" className={linkClass}>Mis búsquedas</Link>
              <Link to="/pending-reviews" className={linkClass}>Reviews</Link>
              <Link to="/friends" className={linkClass}>Amigos</Link>
              <Link to="/profile" className={linkClass}>
                Hola, <span className="text-primary-500 font-semibold">{currentUser.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-dark-700 hover:bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg transition-colors text-left"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>Iniciar sesión</Link>
              <Link
                to="/register"
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors text-center"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}

export default Header
