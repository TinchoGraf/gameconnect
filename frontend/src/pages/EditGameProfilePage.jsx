import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useGames } from '../lib/useGames'
import Header from '../components/Header'

/**
 * Formulario para editar un GameProfile existente.
 *
 * Diferencias con CreateGameProfilePage:
 * - Recibe el slug del juego por la URL (useParams)
 * - Carga los datos actuales del perfil al montar
 * - No permite cambiar el juego (game_slug es fijo)
 * - Manda PUT en vez de POST
 */
function EditGameProfilePage() {
  // useParams() lee los parámetros dinámicos de la URL.
  // Como definimos la ruta como "/profile/game-profiles/:slug/edit",
  // accedemos al slug así:
  const { slug } = useParams()
  const navigate = useNavigate()
  const { games, loading: gamesLoading } = useGames()

  // Datos del perfil que estamos editando
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)

  // Estado del formulario (igual que en CreateGameProfilePage, pero sin gameSlug)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [mainRole, setMainRole] = useState('')
  const [server, setServer] = useState('')
  const [rank, setRank] = useState('')
  const [inGameName, setInGameName] = useState('')

  // Estado de UI
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Al cargar la página, traemos los datos del perfil actual.
   * Si el slug no corresponde a un perfil del usuario, el backend devuelve 404.
   */
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get(`/users/me/game-profiles/${slug}`)
        const data = response.data
        setProfile(data)
        // Pre-llenamos el formulario con los datos actuales
        setSelectedRoles(data.roles)
        setMainRole(data.main_role || '')
        setServer(data.server)
        setRank(data.rank || '')
        setInGameName(data.in_game_name || '')
      } catch (err) {
        console.error(err)
        if (err.response?.status === 404) {
          setProfileError(`No tenés perfil para "${slug}".`)
        } else {
          setProfileError('No pudimos cargar el perfil.')
        }
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [slug])

  /**
   * Datos del juego al que pertenece este perfil. Lo buscamos en la lista
   * de juegos para saber qué roles y servers son válidos.
   */
  const game = games.find((g) => g.slug === slug) || null

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
      // PUT con los cambios. El backend recibe solo los campos que mandamos
      // y deja los demás como están.
      await api.put(`/users/me/game-profiles/${slug}`, {
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
      setError(typeof detail === 'string' ? detail : 'No pudimos guardar los cambios.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading
  if (profileLoading || gamesLoading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Error al cargar
  if (profileError) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-4">
            <Link to="/profile/game-profiles" className="text-gray-400 hover:text-white text-sm">
              ← Volver a mis perfiles
            </Link>
          </div>
          <div className="bg-red-900/50 border border-red-500 text-red-100 p-4 rounded-lg">
            {profileError}
          </div>
        </div>
      </div>
    )
  }

  // Si por algún motivo no encontramos el juego en la lista (debería pasar muy raramente)
  if (!game) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <p className="text-gray-400">Juego no encontrado.</p>
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

        <h1 className="text-4xl font-bold mb-2">Editar perfil</h1>
        <p className="text-gray-400 mb-6">
          {game.name}
        </p>

        <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg p-6 space-y-6">

          {/* Juego (read-only, no se puede cambiar) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Juego
            </label>
            <div className="bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-gray-400">
              {game.name}
              <span className="text-xs text-gray-500 ml-2">(no se puede cambiar)</span>
            </div>
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Roles que jugás
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {game.roles.map((role) => (
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

          {/* Main role */}
          {selectedRoles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rol principal
              </label>
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
              {game.servers.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Rank */}
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

          {/* In-game name */}
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
              {submitting ? 'Guardando...' : 'Guardar cambios'}
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

export default EditGameProfilePage