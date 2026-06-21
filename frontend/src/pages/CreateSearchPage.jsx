import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useGames } from '../lib/useGames'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import { useFriends, getOtherUser } from '../lib/useFriends'
import { useAuth } from '../lib/AuthContext'
import Header from '../components/Header'

/**
 * Formulario para crear una nueva búsqueda (Search).
 *
 * Cambios en Sesión A:
 * - Acepta ?game_slug= en la URL para pre-seleccionar el juego (desde home)
 * - Modo de juego se muestra ANTES de descripción
 * - Label del modo es dinámico: "Modo de [Nombre del juego]"
 * - Campo renombrado: "¿Cuántos jugadores más buscás?" (sin contar al creador)
 *   El frontend suma +1 antes de mandar al backend (que sigue usando max_players)
 *
 * Reglas de negocio (validadas también en el backend):
 * - Solo podés crear búsquedas de juegos donde tenés GameProfile
 * - El server DEBE coincidir con el server de tu perfil
 * - El modo debe ser uno de Game.game_modes
 * - Los roles_needed deben ser válidos para el juego
 */
function CreateSearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { currentUser } = useAuth()
  const { games, loading: gamesLoading } = useGames()
  const { profiles: myProfiles, loading: profilesLoading } = useMyGameProfiles()
  const { friends } = useFriends()

  // Si vienen desde la home con ?game_slug=..., pre-seleccionamos ese juego
  const preselectedSlug = searchParams.get('game_slug') || ''

  const [gameSlug, setGameSlug] = useState(preselectedSlug)
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState('')
  const [description, setDescription] = useState('')
  const [rolesNeeded, setRolesNeeded] = useState([])
  // playersNeeded = cuántos más se buscan (SIN contar al creador)
  // Al mandar al backend sumamos +1
  const [playersNeeded, setPlayersNeeded] = useState(4)
  const [minRank, setMinRank] = useState('')
  const [joinMode, setJoinMode] = useState('manual')
  const [invitedUsernames, setInvitedUsernames] = useState([])

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const myProfileForGame = useMemo(() => {
    if (!gameSlug) return null
    return myProfiles.find((p) => p.game.slug === gameSlug) || null
  }, [myProfiles, gameSlug])

  const selectedGame = useMemo(() => {
    return games.find((g) => g.slug === gameSlug) || null
  }, [games, gameSlug])

  function handleGameChange(e) {
    setGameSlug(e.target.value)
    setMode('')
    setRolesNeeded([])
    setError(null)
  }

  function toggleRoleNeeded(role) {
    setRolesNeeded((prev) => {
      if (prev.includes(role)) return prev.filter((r) => r !== role)
      return [...prev, role]
    })
  }

  function toggleInvitedFriend(username) {
    setInvitedUsernames((prev) => {
      if (prev.includes(username)) return prev.filter((u) => u !== username)
      return [...prev, username]
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!gameSlug) { setError('Elegí un juego.'); return }
    if (!myProfileForGame) { setError('Necesitás tener un perfil de ese juego.'); return }
    if (!title.trim() || title.trim().length < 3) { setError('El título debe tener al menos 3 caracteres.'); return }
    if (!mode) { setError('Elegí un modo de juego.'); return }
    if (playersNeeded < 1 || playersNeeded > 9) { setError('Podés buscar entre 1 y 9 jugadores más.'); return }

    setSubmitting(true)
    try {
      const response = await api.post('/searches', {
        game_slug: gameSlug,
        title: title.trim(),
        description: description.trim() || null,
        mode,
        server: myProfileForGame.server,
        roles_needed: rolesNeeded,
        // El backend sigue usando max_players (total incluyendo al creador)
        // Nosotros le sumamos 1 acá antes de mandar
        max_players: playersNeeded + 1,
        min_rank: minRank.trim() || null,
        join_mode: joinMode,
      })
      const searchId = response.data.id

      let inviteWarnings = []
      if (invitedUsernames.length > 0) {
        const results = await Promise.allSettled(
          invitedUsernames.map((username) =>
            api.post(`/searches/${searchId}/invitations/${username}`)
          )
        )
        inviteWarnings = results
          .map((r, i) => (r.status === 'rejected' ? {
            username: invitedUsernames[i],
            detail: r.reason?.response?.data?.detail || 'No pudimos invitarlo.',
          } : null))
          .filter(Boolean)
      }

      navigate(`/searches/${searchId}`, { state: { inviteWarnings } })
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No pudimos crear la búsqueda.')
    } finally {
      setSubmitting(false)
    }
  }

  if (gamesLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (myProfiles.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
              ← Volver a búsquedas
            </Link>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 text-center">
            <p className="text-2xl mb-2">🎮</p>
            <p className="text-lg font-semibold mb-2">Primero creá un perfil de juego</p>
            <p className="text-gray-400 mb-6">
              Para crear una búsqueda necesitás haber configurado tu perfil en ese juego.
            </p>
            <Link
              to="/profile/game-profiles/new"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Crear mi primer perfil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const gamesWithProfile = games.filter((g) =>
    myProfiles.some((p) => p.game.slug === g.slug)
  )

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Link to="/searches" className="text-gray-400 hover:text-white text-sm">
            ← Volver a búsquedas
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Nueva búsqueda</h1>
        <p className="text-gray-400 mb-6">
          Armá un equipo definiendo qué jugás, en qué modo y qué roles necesitás.
        </p>

        <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">

          {/* Juego */}
          <div>
            <label htmlFor="game" className="block text-sm font-medium text-gray-300 mb-2">
              Juego
            </label>
            <select
              id="game"
              value={gameSlug}
              onChange={handleGameChange}
              required
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
            >
              <option value="">Elegí un juego...</option>
              {gamesWithProfile.map((g) => (
                <option key={g.slug} value={g.slug}>{g.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo aparecen juegos donde ya tenés perfil.
            </p>
          </div>

          {/* Server (read-only, viene del perfil) */}
          {myProfileForGame && (
            <div className="bg-primary-700/10 border border-primary-700/50 rounded-lg p-3 text-sm">
              <p className="text-gray-300">
                Server: <span className="text-primary-500 font-semibold">{myProfileForGame.server}</span>
                <span className="text-gray-500 ml-2 text-xs">
                  (definido por tu perfil de {selectedGame?.name})
                </span>
              </p>
            </div>
          )}

          {selectedGame && (
            <>
              {/* Título */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Título
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  minLength={3}
                  maxLength={150}
                  placeholder="Buscamos jungla y supp para ranked"
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Modo de juego — AHORA ANTES DE DESCRIPCIÓN */}
              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-300 mb-2">
                  Modo de {selectedGame.name}
                </label>
                <select
                  id="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="">Elegí un modo...</option>
                  {selectedGame.game_modes.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Descripción — AHORA DESPUÉS DEL MODO */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción <span className="text-gray-500">(opcional)</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Solo gente que comunique, diamante o más..."
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Roles que buscás <span className="text-gray-500">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Si no marcás ninguno, cualquier rol puede unirse.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedGame.roles.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        rolesNeeded.includes(role)
                          ? 'bg-primary-600/20 border-primary-500'
                          : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={rolesNeeded.includes(role)}
                        onChange={() => toggleRoleNeeded(role)}
                        className="accent-primary-500"
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Jugadores + Rango */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="playersNeeded" className="block text-sm font-medium text-gray-300 mb-2">
                    ¿Cuántos jugadores más buscás?
                  </label>
                  <input
                    id="playersNeeded"
                    type="number"
                    value={playersNeeded}
                    onChange={(e) => setPlayersNeeded(parseInt(e.target.value, 10) || 0)}
                    min={1}
                    max={9}
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sin contarte a vos. Total del equipo: {playersNeeded + 1} jugadores.
                  </p>
                </div>

                <div>
                  <label htmlFor="minRank" className="block text-sm font-medium text-gray-300 mb-2">
                    Rango mínimo <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    id="minRank"
                    type="text"
                    value={minRank}
                    onChange={(e) => setMinRank(e.target.value)}
                    maxLength={50}
                    placeholder="Diamante, Faceit 8..."
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
              </div>

              {/* Modo de unión */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Cómo se unen los demás?
                </label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'manual',
                      label: '👤 Manual',
                      desc: 'Vos aprobás o rechazás a cada postulante. Más control, más lento.',
                    },
                    {
                      value: 'auto',
                      label: '⚡ Automático',
                      desc: 'Los postulantes entran solos si hay cupo. Más rápido, menos filtro.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                        joinMode === opt.value
                          ? 'bg-primary-600/20 border-primary-500'
                          : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="joinMode"
                          value={opt.value}
                          checked={joinMode === opt.value}
                          onChange={(e) => setJoinMode(e.target.value)}
                          className="accent-primary-500 mt-1"
                        />
                        <div>
                          <span className="font-semibold">{opt.label}</span>
                          <p className="text-xs text-gray-400 mt-1">{opt.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Invitar amigos */}
              {friends.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invitar amigos <span className="text-gray-500">(opcional)</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Les llega una invitación que pueden aceptar o rechazar. Si no tienen perfil
                    de {selectedGame.name} o juegan en otro server, no va a poder aceptarse.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {friends.map((friendship) => {
                      const friend = getOtherUser(friendship, currentUser.username)
                      return (
                        <label
                          key={friendship.id}
                          className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                            invitedUsernames.includes(friend.username)
                              ? 'bg-primary-600/20 border-primary-500'
                              : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={invitedUsernames.includes(friend.username)}
                            onChange={() => toggleInvitedFriend(friend.username)}
                            className="accent-primary-500"
                          />
                          <span className="text-sm">{friend.username}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={submitting || !gameSlug}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Creando...' : 'Crear búsqueda'}
            </button>
            <Link
              to="/searches"
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

export default CreateSearchPage