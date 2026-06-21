import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { usePublicUser } from '../lib/usePublicUser'
import { useFriends, getRelationStatus } from '../lib/useFriends'
import { useMySearches } from '../lib/useMySearches'
import { useAuth } from '../lib/AuthContext'
import Header from '../components/Header'
import ReviewCard from '../components/ReviewCard'
import FriendActionButton from '../components/FriendActionButton'

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
  const { currentUser } = useAuth()

  const isOwnProfile = currentUser?.username === username

  const {
    friends, sentRequests, receivedRequests,
    loading: friendsLoading, refresh: refreshFriends,
  } = useFriends()
  const { created: myCreatedSearches, refresh: refreshMySearches } = useMySearches()

  const [friendActionLoading, setFriendActionLoading] = useState(false)
  const [friendActionError, setFriendActionError] = useState(null)

  const [selectedSearchId, setSelectedSearchId] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const relation = currentUser && !isOwnProfile
    ? getRelationStatus(friends, sentRequests, receivedRequests, username)
    : null

  async function handleSendRequest() {
    setFriendActionLoading(true)
    setFriendActionError(null)
    try {
      await api.post(`/friends/requests/${username}`)
      await refreshFriends()
    } catch (err) {
      setFriendActionError(err.response?.data?.detail || 'No pudimos enviar la solicitud.')
    } finally {
      setFriendActionLoading(false)
    }
  }

  async function handleAcceptRequest() {
    setFriendActionLoading(true)
    setFriendActionError(null)
    try {
      await api.post(`/friends/requests/${username}/accept`)
      await refreshFriends()
    } catch (err) {
      setFriendActionError(err.response?.data?.detail || 'No pudimos aceptar la solicitud.')
    } finally {
      setFriendActionLoading(false)
    }
  }

  async function handleRejectRequest() {
    setFriendActionLoading(true)
    setFriendActionError(null)
    try {
      await api.post(`/friends/requests/${username}/reject`)
      await refreshFriends()
    } catch (err) {
      setFriendActionError(err.response?.data?.detail || 'No pudimos rechazar la solicitud.')
    } finally {
      setFriendActionLoading(false)
    }
  }

  const openSearchesToInvite = myCreatedSearches.filter((s) => s.status === 'open')

  async function handleInviteToSearch() {
    if (!selectedSearchId) return
    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(false)
    try {
      await api.post(`/searches/${selectedSearchId}/invitations/${username}`)
      setInviteSuccess(true)
      setSelectedSearchId('')
      await refreshMySearches()
    } catch (err) {
      setInviteError(err.response?.data?.detail || 'No pudimos enviar la invitación.')
    } finally {
      setInviteLoading(false)
    }
  }

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

        {/* Amistad */}
        {currentUser && !isOwnProfile && !friendsLoading && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-6 flex items-center justify-between gap-3">
            <p className="text-sm text-gray-300">
              {relation === 'friend'
                ? `Son amigos en GameConnect.`
                : `¿Conocés a ${user.username}?`}
            </p>
            <FriendActionButton
              relation={relation}
              disabled={friendActionLoading}
              onSendRequest={handleSendRequest}
              onAccept={handleAcceptRequest}
              onReject={handleRejectRequest}
            />
          </div>
        )}
        {friendActionError && (
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm mb-6">
            {friendActionError}
          </div>
        )}

        {/* Invitar a una búsqueda propia activa */}
        {relation === 'friend' && (
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold mb-2">Invitar a una búsqueda</h2>
            {openSearchesToInvite.length === 0 ? (
              <p className="text-sm text-gray-400">
                No tenés búsquedas abiertas para invitar a {user.username}.
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedSearchId}
                  onChange={(e) => { setSelectedSearchId(e.target.value); setInviteSuccess(false) }}
                  className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">Elegí una de tus búsquedas...</option>
                  {openSearchesToInvite.map((s) => (
                    <option key={s.id} value={s.id}>{s.game.name} — {s.title}</option>
                  ))}
                </select>
                <button
                  onClick={handleInviteToSearch}
                  disabled={inviteLoading || !selectedSearchId}
                  className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  {inviteLoading ? 'Invitando...' : 'Invitar'}
                </button>
              </div>
            )}
            {inviteSuccess && (
              <p className="text-sm text-green-400 mt-2">✓ Invitación enviada.</p>
            )}
            {inviteError && (
              <p className="text-sm text-red-400 mt-2">{inviteError}</p>
            )}
          </div>
        )}

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