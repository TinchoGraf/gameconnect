import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Header from '../components/Header'

/**
 * Formulario para reportar un bug. Público: funciona logueado o no.
 * Si hay sesión, el backend guarda el username de quien reporta.
 */
function ReportBugPage() {
  const [location, setLocation] = useState('')
  const [whatBefore, setWhatBefore] = useState('')
  const [whatAfter, setWhatAfter] = useState('')
  const [description, setDescription] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (location.trim().length < 3) { setError('Contanos en qué parte de la app pasó (al menos 3 caracteres).'); return }
    if (whatBefore.trim().length < 3) { setError('Contanos qué hiciste antes.'); return }
    if (whatAfter.trim().length < 3) { setError('Contanos qué pasó después.'); return }
    if (description.trim().length < 3) { setError('Agregá una breve descripción.'); return }

    setSubmitting(true)
    try {
      await api.post('/bug-reports', {
        location: location.trim(),
        what_before: whatBefore.trim(),
        what_after: whatAfter.trim(),
        description: description.trim(),
      })
      setSuccess(true)
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No pudimos enviar el reporte.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-xl font-semibold mb-2">¡Gracias por el reporte!</p>
            <p className="text-gray-300 mb-6">Lo vamos a revisar lo antes posible.</p>
            <Link
              to="/"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/" className="text-gray-400 hover:text-white text-sm">
            ← Volver
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">🐛 Reportar un bug</h1>
        <p className="text-gray-400 mb-6">
          Contanos qué pasó con el mayor detalle posible — nos ayuda mucho a encontrar el problema.
        </p>

        <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">

          {/* Dónde pasó */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
              ¿En qué parte de la app pasó?
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              minLength={3}
              maxLength={150}
              placeholder="Ej: creando una búsqueda, mi perfil, al subir una review..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Qué hizo antes */}
          <div>
            <label htmlFor="whatBefore" className="block text-sm font-medium text-gray-300 mb-2">
              ¿Qué hiciste justo antes de que pasara?
            </label>
            <textarea
              id="whatBefore"
              value={whatBefore}
              onChange={(e) => setWhatBefore(e.target.value)}
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              placeholder="Ej: elegí League of Legends y apreté 'Crear búsqueda'..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          {/* Qué pasó después */}
          <div>
            <label htmlFor="whatAfter" className="block text-sm font-medium text-gray-300 mb-2">
              ¿Qué pasó después?
            </label>
            <textarea
              id="whatAfter"
              value={whatAfter}
              onChange={(e) => setWhatAfter(e.target.value)}
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              placeholder="Ej: el botón se quedó cargando para siempre..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Descripción breve
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={3}
              maxLength={1000}
              rows={3}
              placeholder="Resumí en pocas palabras qué salió mal..."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar reporte'}
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto text-center bg-dark-700 hover:bg-dark-900 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportBugPage
