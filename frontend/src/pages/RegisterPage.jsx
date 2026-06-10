import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

/**
 * Página de registro.
 *
 * Flujo:
 * 1. Usuario llena el formulario (username, email, password)
 * 2. Validamos del lado cliente antes de mandar al backend
 * 3. POST /auth/register
 * 4. Si todo OK → redirigimos a /login con un mensaje
 * 5. Si hay error → mostramos el mensaje al usuario
 */
function RegisterPage() {
  const navigate = useNavigate()

  // Estado del formulario (los valores que el usuario tipea)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  })

  // Estado de la UI: loading mientras esperamos respuesta, error si hubo problemas
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Esta función se ejecuta cada vez que el usuario tipea en un input.
  // Actualiza solo el campo que cambió, manteniendo el resto.
  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiamos el error apenas el usuario empieza a tipear de nuevo
    if (error) setError(null)
  }

  // Validación del lado cliente: igual que en el backend, mínimo 8 caracteres
  // con una mayúscula y un número. Si está mal, no llamamos a la API.
  function validatePasswordOrFail() {
    const p = formData.password
    if (p.length < 8) return 'El password debe tener al menos 8 caracteres.'
    if (!/[A-Z]/.test(p)) return 'El password debe incluir al menos una mayúscula.'
    if (!/\d/.test(p)) return 'El password debe incluir al menos un número.'
    return null
  }

  // Se ejecuta cuando se envía el formulario (botón "Crear cuenta")
  async function handleSubmit(e) {
    e.preventDefault() // Evita que el navegador recargue la página

    // Validación local
    const passwordError = validatePasswordOrFail()
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await api.post('/auth/register', formData)
      // Éxito: redirigimos a login. Le pasamos un "state" para que la página
      // de login pueda mostrar un mensaje "cuenta creada, ahora ingresá".
      navigate('/login', {
        state: { justRegistered: true, username: formData.username },
      })
    } catch (err) {
      // El backend devuelve errores con un campo "detail" en la respuesta
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else if (Array.isArray(detail)) {
        // Errores de validación de Pydantic vienen como array de objetos
        setError(detail[0]?.msg || 'Error de validación.')
      } else {
        setError('No pudimos crear la cuenta. Intentalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center px-4">
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2">Crear cuenta</h1>
        <p className="text-gray-400 mb-6">
          Sumate a GameConnect y empezá a jugar con gente compatible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_-]+"
              value={formData.username}
              onChange={handleChange}
              placeholder="tinchograf"
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              3-30 caracteres. Letras, números, guiones y guiones bajos.
            </p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Password */}
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
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 8 caracteres, una mayúscula y un número.
            </p>
          </div>

          {/* Error global */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-primary-500 hover:underline">
            Iniciá sesión
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

export default RegisterPage