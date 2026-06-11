import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useGames } from '../lib/useGames'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'

/**
 * Formulario para crear un nuevo GameProfile.
 *
 * Validaciones:
 * - Solo aparecen juegos donde NO tenés perfil ya
 * - Los roles y servers se cargan según el juego elegido
 * - Tenés que marcar al menos un rol
 * - El main_role solo se puede elegir entre los roles marcados
 * - Si cambiás de juego, se resetean roles y main_role
 */
function CreateGameProfilePage() {
  const navigate = useNavigate()
  const { games, loading: gamesLoading, error: gamesError } = useGames()
  const { profiles: myProfiles, loading: profilesLoading } = useMyGameProfiles()

  // Estado del formulario
  const [gameSlug, setGameSlug] = useState('')
  const [selectedRoles, setSelectedRoles] = useState([])
  const [mainRole, setMainRole] = useState('')
  const [server, setServer] = useState('')
  const [rank, setRank] = useState('')
  const [inGameName, setInGameName] = useState('')

  // Estado de UI
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Lista de juegos disponibles: los que existen pero todavía no tengo perfil.
   * useMemo evita recalcular esto en cada render, solo cuando cambian
   * games o myProfiles.
   */
  const availableGames = useMemo(() => {
    if (gamesLoading || profilesLoading) return []
    const taken = new Set(myProfiles.map((p) => p.game.slug))
    return games.filter((g) => !taken.has(g.slug))
  }, [games, myProfiles, gamesLoading, profilesLoading])

  /**
   * Datos del juego actualmente elegido. Si no hay ninguno seleccionado,
   * devuelve null y los selectores de roles/servers se ocultan.
   */
  const selectedGame = useMemo(() => {
    return games.find((g) => g.slug === gameSlug) || null
  }, [games, gameSlug])

  /**
   * Cuando el usuario cambia el juego, reseteamos roles, main_role y server
   * porque los anteriores eran de otro juego y ya no son válidos.
   */
  function handleGameChange(e) {
    setGameSlug(e.target.value)
    setSelectedRoles([])
    setMainRole('')
    setServer('')
    setError(null)
  }

  /**
   * Toggle de un rol en la lista. Si deseleccionamos el main_role, lo limpiamos.
   */
  function toggleRole(role) {
    setSelectedRoles((prev) => {
      const isSelected = prev.includes(role)
      if (isSelected) {
        if (mainRole === role) setMainRole('')
        return prev.filter((r) => r !== role)
      }
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
    if (selectedRoles.length === 0) {
      setError('Marcá al menos un rol.')
      return
    }
    if (!mainRole) {
      setError('Elegí cuál es tu rol principal.')
      return
    }
    if (!server) {
      setError('Elegí un servidor.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/users/me/game-profiles', {
        game_slug: gameSlug,
        roles: selectedRoles,
        main_role: mainRole,
        server,
        rank: rank || null,
        in_game_name: inGameName || null,
      })
      navigate('/profile/game-profiles')
    } catch (err) {
      console.error(err)
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No pudimos crear el perfil.')
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

  // Estado especial: el usuario ya tiene perfil en todos los juegos
  if (availableGames.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/profile/game-profiles" className="text-gray-400 hover:text-white text-sm">
              ← Volver a mis perfiles
            </Link>
          </div>
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-lg font-semibold mb-2">Ya tenés perfil en todos los juegos soportados</p>
            <p className="text-gray-400">
              Cuando agreguemos juegos nuevos, vas a poder crear más perfiles.
            </p>
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
          <Link to="/profile/game-profiles" className="text-gray-400 hover:text-white text-sm">
            ← Volver a mis perfiles
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-2">Nuevo perfil de juego</h1>
        <p className="text-gray-400 mb-6">
          Indicá en qué servidor jugás y qué roles podés cubrir.
        </p>

        <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">

          {/* Selector de juego */}
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
              {availableGames.map((g) => (
                <option key={g.slug} value={g.slug}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Si hay juego elegido, mostramos el resto del form */}
          {selectedGame && (
            <>
              {/* Roles (checkboxes) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Roles que jugás
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Marcá todos los que cubrís. Al menos uno.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedGame.roles.map((role) => (
                    <label
                      key={role}
                      className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoles.includes(role)
                          ? 'bg-primary-600/20 border-primary-500'
                          : 'bg-dark-900 border-dark-700 hover:border-dark-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="accent-primary-500"
                      />
                      <span className="text-sm">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Main role (solo si hay al menos un rol marcado) */}
              {selectedRoles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rol principal
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Tu main. Tiene que estar entre los que marcaste arriba.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map((role) => (
                      <label
                        key={role}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                          mainRole === role
                            ? 'bg-primary-600 border-primary-500 text-white'
                            : 'bg-dark-900 border-dark-700 text-gray-300 hover:border-dark-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="main_role"
                          value={role}
                          checked={mainRole === role}
                          onChange={() => setMainRole(role)}
                          className="accent-primary-500"
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Server */}
              <div>
                <label htmlFor="server" className="block text-sm font-medium text-gray-300 mb-2">
                  Servidor
                </label>
                <select
                  id="server"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  required
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="">Elegí un servidor...</option>
                  {selectedGame.servers.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Rank (opcional) */}
              <div>
                <label htmlFor="rank" className="block text-sm font-medium text-gray-300 mb-2">
                  Rango <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  id="rank"
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  maxLength={50}
                  placeholder="Diamante II, Faceit 10, Gran Champion, etc."
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* In-game name (opcional) */}
              <div>
                <label htmlFor="igname" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre in-game <span className="text-gray-500">(opcional)</span>
                </label>
                <input
                  id="igname"
                  type="text"
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                  maxLength={100}
                  placeholder="Tincho#LAS1, STEAM_0:1:xxx, etc."
                  className="w-full bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
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
              {submitting ? 'Creando...' : 'Crear perfil'}
            </button>
            <Link
              to="/profile/game-profiles"
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

export default CreateGameProfilePage