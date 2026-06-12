import { Link, useParams } from 'react-router-dom'
import { usePublicUser } from '../lib/usePublicUser'
import Header from '../components/Header'
import ReviewCard from '../components/ReviewCard'

/**
 * Página de perfil público de un usuario.
 *
 * Es PÚBLICA: cualquiera (logueado o no) puede verla.
 * Muestra: datos básicos, reputación con desglose, reviews recibidas.
 *
 * NO muestra: email, datos privados, lo que el usuario está haciendo ahora.
 */
function PublicUserPage() {
  const { username } = useParams()
  const { user, reviews, loading, error } = usePublicUser(username)

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
              ← Volver
            </Link>
          </div>
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const reputation = user.reputation_score ?? 0
  const reviewsCount = user.reviews_received_count ?? 0
  const trustScore = user.reviewer_trust_score ?? 1.0

  // Filtros visuales de reviews
  const flaggedCount = reviews.filter((r) => r.flagged).length
  const wouldPlayAgainCount = reviews.filter((r) => r.would_play_again).length

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header con username + reputación grande */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-1">{user.username}</h1>
              <p className="text-gray-400 text-sm">
                Miembro de GameConnect
              </p>
            </div>

            <div className="text-center sm:text-right">
              {reviewsCount > 0 ? (
                <>
                  <p className="text-5xl font-bold text-primary-500">
                    {reputation.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400">
                    de 5.00 · {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Sin reviews todavía
                </p>
              )}
            </div>
          </div>

          {/* Stats adicionales si hay reviews */}
          {reviewsCount > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-dark-700">
              <div className="bg-dark-900 rounded p-3 text-center">
                <p className="text-xs text-gray-400">Trust como reviewer</p>
                <p className="text-lg font-semibold text-white">
                  {trustScore.toFixed(2)}
                </p>
              </div>
              <div className="bg-dark-900 rounded p-3 text-center">
                <p className="text-xs text-gray-400">"Volvería a jugar"</p>
                <p className="text-lg font-semibold text-green-400">
                  {wouldPlayAgainCount}/{reviewsCount}
                </p>
              </div>
              <div className="bg-dark-900 rounded p-3 text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-gray-400">Reviews flageadas</p>
                <p className={`text-lg font-semibold ${
                  flaggedCount > 0 ? 'text-amber-400' : 'text-gray-500'
                }`}>
                  {flaggedCount}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews recibidas */}
        <section>
          <h2 className="text-xl font-bold mb-4">
            Reviews recibidas {reviewsCount > 0 && `(${reviewsCount})`}
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 text-center">
              <p className="text-2xl mb-2">📭</p>
              <p className="text-lg font-semibold mb-2">Todavía no recibió reviews</p>
              <p className="text-gray-400 text-sm">
                Las reviews aparecen cuando termina una partida y los demás participantes lo califican.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

export default PublicUserPage