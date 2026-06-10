import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import Header from '../components/Header'

function ProfilePage() {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-400">No se pudieron cargar los datos del usuario.</p>
        </div>
      </div>
    )
  }

  const reputation = currentUser.reputation_score ?? 0
  const reviewsCount = currentUser.reviews_received_count ?? 0
  const trustScore = currentUser.reviewer_trust_score ?? 1.0

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-6">Mi perfil</h1>

        {/* Datos básicos */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Datos de cuenta</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Username</p>
              <p className="text-lg font-semibold">{currentUser.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-lg">{currentUser.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Reputación</p>
              <p className="text-lg">
                {reputation.toFixed(2)} / 5.00
                <span className="text-sm text-gray-400 ml-2">
                  ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Trust score como reviewer</p>
              <p className="text-lg">{trustScore.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Sección perfiles de juego (link para gestionarlos) */}
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Perfiles de juego</h2>
              <p className="text-gray-400 text-sm mt-1">
                Configurá qué juegos jugás, con qué roles, servidor y rango.
              </p>
            </div>
            <Link
              to="/profile/game-profiles"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              Gestionar
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfilePage