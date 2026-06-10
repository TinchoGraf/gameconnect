import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../lib/api'

/**
 * Página de login.
 *
 * IMPORTANTE: el endpoint /auth/login del backend usa el estándar OAuth2,
 * que espera el cuerpo como x-www-form-urlencoded (no JSON).
 * Por eso construimos un URLSearchParams en vez de mandar un objeto JSON.
 *
 * El backend devuelve { access_token, token_type }.
 * Guardamos el token en localStorage con la clave 'gameconnect_token'.
 * El interceptor de axios (que armamos en lib/api.js) lo va a leer
 * automáticamente en cada request futura.
 */
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() // Para leer mensajes que vengan del navigate

  // Si venimos de registrarnos exitosamente, location.state lo dice
  const justRegistered = location.state?.justRegistered
  const preFilledUsername = location.state?.username || ''

  const [formData, setFormData] = useState({
    username: preFilledUsername,
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // OAuth2 password flow: form-urlencoded
      const body = new URLSearchParams()
      body.append('username', formData.username)
      body.append('password', formData.password)

      const response = await api.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      // Guardamos el token. A partir de ahora, cada request lo manda automáticamente.
      const { access_token } = response.data
      localStorage.setItem('gameconnect_token', access_token)

      // Redirigimos a la página de juegos (lo cambiaremos a un dashboard real más adelante)
      navigate('/games')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('No pudimos iniciar sesión. Verificá tus credenciales.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center px-4">
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Iniciar sesión</h1>
        <p className="text-gray-400 mb-6">Entrá a tu cuenta de GameConnect.</p>

        {/* Banner de éxito si venimos del registro */}
        {justRegistered && (
          <div className="bg-green-900/50 border border-green-500 text-green-100 p-3 rounded-lg text-sm mb-4">
            ¡Cuenta creada! Iniciá sesión con tus datos.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="tinchograf"
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Iniciando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/register" className="text-primary-500 hover:underline">
            Creá una
          </Link>
        </p>

        <div className="text-center mt-4">
          <Link to="/" className="text-gray-500 text-sm hover:text-gray-300">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage