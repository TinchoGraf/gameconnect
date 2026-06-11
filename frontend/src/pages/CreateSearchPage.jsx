import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useGames } from '../lib/useGames'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'

/**
 * Formulario para crear una nueva búsqueda (Search).
 *
 * Reglas de negocio (validadas también en el backend):
 * - Solo podés crear búsquedas de juegos donde tenés GameProfile
 * - El server de la búsqueda DEBE coincidir con el server de tu perfil
 *   (por eso lo derivamos automáticamente y no lo dejamos elegir)
 * - El modo debe ser uno de Game.game_modes
 * - Los roles_needed deben ser válidos para el juego
 */
function CreateSearchPage() {
  const navigate = useNavigate()
  const { games, loading: gamesLoading } = useGames()
  const { profiles: myProfiles, loading: profilesLoading } = useMyGameProfiles()

  // Estado del formulario
  const [gameSlug, setGameSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState('')
  const [rolesNeeded, setRolesNeeded] = useState([])
  const [maxPlayers, setMaxPlayers] = useState(5)
  const [minRank, setMinRank] = useState('')
  const [joinMode, setJoinMode] = useState('manual')

  // Estado de UI
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * El perfil del usuario para el juego elegido.
   * Si no eligió juego, es null. Si eligió, contiene server, roles, etc.
   */
  const myProfileForGame = useMemo(() => {
    if (!gameSlug) return null
    return myProfiles.find((p) => p.game.slug === gameSlug) || null
  }, [myProfiles, gameSlug])

  /**
   * Datos del juego elegido (sus roles, servers, modos disponibles).
   */
  const selectedGame = useMemo(() => {
    return games.find((g) => g.slug === gameSlug) || null
  }, [games, gameSlug])

  /**
   * Cambiar de juego limpia todos los campos derivados.
   */
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!gameSlug) {
      setError('Elegí un juego.')
      return
    }
    if (!myProfileForGame) {
      setError('Necesitás tener un perfil de ese juego antes de crear una búsqueda.')
      return
    }
    if (!title.trim() || title.trim().length < 3) {
      setError('El título debe tener al menos 3 caracteres.')
      return
    }
    if (!mode) {
      setError('Elegí un modo de juego.')
      return
    }
    if (maxPlayers < 2 || maxPlayers > 10) {
      setError('La cantidad de jugadores debe estar entre 2 y 10.')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/searches', {
        game_slug: gameSlug,
        title: title.trim(),
        description: description.trim() || null,
        mode,
        server: myProfileForGame.server,  // El backend exige que coincida con tu perfil
        roles_needed: rolesNeeded,
        max_players: maxPlayers,
        min_rank: minRank.trim() || null,
        join_mode: joinMode,
      })
      // Redirigir al detalle (esa página la armamos en sesión 3)
      navigate(`/searches/${response.data.id}`)
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No pudimos crear la búsqueda.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading inicial
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

  // Estado especial: el usuario no tiene NINGÚN perfil de juego
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
            <p className="text-lg font-semibold mb-2">
              Primero creá un perfil de juego
            </p>
            <p className="text-gray-400 mb-6">
              Para crear una búsqueda necesitás haber configurado tu perfil
              en ese juego: server, roles, rango.
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

  // Los juegos donde el usuario puede crear búsquedas son aquellos donde tiene perfil
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

          {/* Aviso del server (read-only, viene del perfil) */}
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

          {/* Resto del form: solo si hay juego elegido */}
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

              {/* Descripción */}
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

              {/* Modo */}
              <div>
                <label htmlFor="mode" className="block text-sm font-medium text-gray-300 mb-2">
                  Modo de juego
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

              {/* Roles necesarios */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Roles que buscás <span className="text-gray-500">(opcional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Si no marcás ninguno, cualquier rol puede unirse.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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

              {/* Max players + rango */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxPlayers" className="block text-sm font-medium text-gray-300 mb-2">
                    Cantidad de jugadores
                  </label>
                  <input
                    id="maxPlayers"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10) || 0)}
                    min={2}
                    max={10}
                    required
                    className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Incluyéndote a vos. Entre 2 y 10.
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

              {/* Modo de unión: manual vs auto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Cómo se unen los demás?
                </label>
                <div className="space-y-2">
                  <label
                    className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                      joinMode === 'manual'
                        ? 'bg-primary-600/20 border-primary-500'
                        : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="joinMode"
                        value="manual"
                        checked={joinMode === 'manual'}
                        onChange={(e) => setJoinMode(e.target.value)}
                        className="accent-primary-500 mt-1"
                      />
                      <div>
                        <span className="font-semibold">👤 Manual</span>
                        <p className="text-xs text-gray-400 mt-1">
                          Vos aprobás o rechazás a cada postulante. Más control, más lento.
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                      joinMode === 'auto'
                        ? 'bg-primary-600/20 border-primary-500'
                        : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="joinMode"
                        value="auto"
                        checked={joinMode === 'auto'}
                        onChange={(e) => setJoinMode(e.target.value)}
                        className="accent-primary-500 mt-1"
                      />
                      <div>
                        <span className="font-semibold">⚡ Automático</span>
                        <p className="text-xs text-gray-400 mt-1">
                          Los postulantes entran solos si hay cupo. Más rápido, menos filtro.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}

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
              disabled={submitting || !gameSlug}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              {submitting ? 'Creando...' : 'Crear búsqueda'}
            </button>
            <Link
              to="/searches"
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

export default CreateSearchPage