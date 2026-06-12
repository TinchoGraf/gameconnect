import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import Header from '../components/Header'
import StarRating from '../components/StarRating'

const MIN_COMMENT_LENGTH = 30

/**
 * Página para escribir una review sobre otro usuario en una partida.
 *
 * Recibe search_id y user_id como query params:
 *   /reviews/new?search_id=5&user_id=3
 *
 * Los recibimos por query param y no por path param porque no es un recurso
 * "review/X" sino una acción para crear uno nuevo sobre dos referencias.
 */
function WriteReviewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Leemos los IDs de la URL
  const searchId = parseInt(searchParams.get('search_id') || '0', 10)
  const reviewedUserId = parseInt(searchParams.get('user_id') || '0', 10)

  // Datos del contexto (a fetchear)
  const [contextLoading, setContextLoading] = useState(true)
  const [contextError, setContextError] = useState(null)
  const [searchInfo, setSearchInfo] = useState(null)
  const [reviewedUser, setReviewedUser] = useState(null)

  // Estado del formulario
  const [communication, setCommunication] = useState(0)
  const [attitude, setAttitude] = useState(0)
  const [skill, setSkill] = useState(0)
  const [reliability, setReliability] = useState(0)
  const [comment, setComment] = useState('')
  const [wouldPlayAgain, setWouldPlayAgain] = useState(true)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Cargar datos del contexto: la búsqueda y el usuario a calificar
  useEffect(() => {
    async function fetchContext() {
      if (!searchId || !reviewedUserId) {
        setContextError('Faltan datos en la URL.')
        setContextLoading(false)
        return
      }
      try {
        // Fetcheamos en paralelo
        const [searchResp, participationsResp] = await Promise.all([
          api.get(`/searches/${searchId}`),
          api.get(`/searches/${searchId}/participations`),
        ])
        setSearchInfo(searchResp.data)

        // Buscamos al usuario a calificar dentro de los participantes
        const part = participationsResp.data.find(
          (p) => p.user.id === reviewedUserId
        )
        if (!part) {
          setContextError('Ese usuario no participó en esta búsqueda.')
        } else {
          setReviewedUser(part.user)
        }
      } catch (err) {
        console.error(err)
        if (err.response?.status === 404) {
          setContextError('La búsqueda no existe.')
        } else {
          setContextError('No pudimos cargar el contexto.')
        }
      } finally {
        setContextLoading(false)
      }
    }
    fetchContext()
  }, [searchId, reviewedUserId])

  // Promedio visual en vivo (se ve antes de enviar)
  const averagePreview = (() => {
    const ratings = [communication, attitude, skill, reliability]
    if (ratings.some((r) => r === 0)) return null
    const sum = ratings.reduce((acc, r) => acc + r, 0)
    return (sum / 4).toFixed(2)
  })()

  // Validar antes de submitear
  function validate() {
    if (communication === 0) return 'Calificá Comunicación.'
    if (attitude === 0) return 'Calificá Actitud.'
    if (skill === 0) return 'Calificá Skill.'
    if (reliability === 0) return 'Calificá Confiabilidad.'
    if (comment.trim().length < MIN_COMMENT_LENGTH) {
      return `El comentario debe tener al menos ${MIN_COMMENT_LENGTH} caracteres.`
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await api.post('/reviews', {
        reviewed_user_id: reviewedUserId,
        search_id: searchId,
        communication,
        attitude,
        skill,
        reliability,
        comment: comment.trim(),
        would_play_again: wouldPlayAgain,
      })
      setSuccess(true)
      // Después de 1.5s redirigimos a pending reviews
      setTimeout(() => {
        navigate('/pending-reviews')
      }, 1500)
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No pudimos guardar la review.')
      setSubmitting(false)
    }
  }

  // Loading inicial
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Error al cargar contexto
  if (contextError) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/pending-reviews" className="text-gray-400 hover:text-white text-sm">
              ← Volver a reviews pendientes
            </Link>
          </div>
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {contextError}
          </div>
        </div>
      </div>
    )
  }

  // Estado de éxito (antes de redirigir)
  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-8 text-center">
            <p className="text-4xl mb-2">✅</p>
            <p className="text-xl font-semibold mb-2">Review enviada</p>
            <p className="text-gray-300">Redirigiendo a tus reviews pendientes...</p>
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
          <Link to="/pending-reviews" className="text-gray-400 hover:text-white text-sm">
            ← Volver a reviews pendientes
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Escribir review</h1>
        <p className="text-gray-400 mb-6">
          Estás calificando a <span className="text-primary-500 font-semibold">{reviewedUser?.username}</span>
          {' '}por la partida <span className="text-white">"{searchInfo?.title}"</span>
          {' '}({searchInfo?.game?.name}).
        </p>

        <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">

          {/* Categorías */}
          <StarRating
            value={communication}
            onChange={setCommunication}
            label="Comunicación"
            hint="¿Avisaba cooldowns, callouts, pings? ¿Hablaba por chat de voz?"
          />

          <StarRating
            value={attitude}
            onChange={setAttitude}
            label="Actitud"
            hint="¿Se enojaba fácil, era tóxico? ¿Mantuvo el clima bueno?"
          />

          <StarRating
            value={skill}
            onChange={setSkill}
            label="Skill"
            hint="¿Su nivel de juego estaba acorde a lo que decía su perfil?"
          />

          <StarRating
            value={reliability}
            onChange={setReliability}
            label="Confiabilidad"
            hint="¿Llegó puntual? ¿AFK durante la partida? ¿Se rajó sin avisar?"
          />

          {/* Promedio visual */}
          {averagePreview && (
            <div className="bg-primary-700/20 border border-primary-700 rounded-lg p-3 text-sm">
              <p className="text-gray-300">
                Promedio: <span className="text-primary-500 font-bold text-lg">{averagePreview}</span> / 5.00
              </p>
            </div>
          )}

          {/* Comentario */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-300 mb-1">
              Comentario
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Mínimo {MIN_COMMENT_LENGTH} caracteres. Explicá brevemente tu experiencia.
              No insultos, no nombres reales de otros jugadores.
            </p>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="Buen jungla, comunicó bien todos los timers. Aunque perdimos jugamos relajados, lo invitaría a más partidas."
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
            />
            <p className={`text-xs mt-1 text-right ${
              comment.length < MIN_COMMENT_LENGTH ? 'text-amber-400' : 'text-gray-500'
            }`}>
              {comment.length}/{MIN_COMMENT_LENGTH} mínimo · {comment.length}/1000
            </p>
          </div>

          {/* Volverías a jugar */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer p-3 border border-dark-700 rounded-lg hover:border-primary-500 transition-colors">
              <input
                type="checkbox"
                checked={wouldPlayAgain}
                onChange={(e) => setWouldPlayAgain(e.target.checked)}
                className="accent-primary-500 mt-1"
              />
              <div>
                <p className="font-semibold text-sm">¿Volverías a jugar con esta persona?</p>
                <p className="text-xs text-gray-400 mt-1">
                  Ayuda a destacar jugadores compatibles más allá del rating.
                </p>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Enviando...' : 'Publicar review'}
            </button>
            <Link
              to="/pending-reviews"
              className="bg-dark-700 hover:bg-dark-900 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WriteReviewPage
