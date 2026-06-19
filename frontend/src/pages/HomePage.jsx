import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useMyGameProfiles } from '../lib/useMyGameProfiles'
import Header from '../components/Header'

/**
 * Página de inicio.
 *
 * Bifurca según el estado de auth:
 * - No logueado → landing genérica (hero + features + CTAs)
 * - Logueado sin juegos → tutorial de 3 pasos
 * - Logueado con juegos → dashboard personal con cards de juegos
 */
function HomePage() {
  const { isAuthenticated, currentUser } = useAuth()
  const { profiles, loading } = useMyGameProfiles()
  const navigate = useNavigate()

  // Emojis representativos por juego (fallback visual hasta tener logos)
  const GAME_EMOJIS = {
    'league-of-legends': '⚔️',
    'counter-strike-2': '🎯',
    'dead-by-daylight': '🔪',
    'rocket-league': '🚗',
  }

  // ----- Vista: no logueado -----
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-6xl font-bold mb-4">
            🎮 <span className="text-primary-500">GameConnect</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            La plataforma para conectarte con gamers que comparten tu nivel,
            tu servidor y tu forma de jugar. Sin tóxicos. Con reputación que importa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/register"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Crear cuenta
            </Link>
            <Link
              to="/login"
              className="bg-dark-800 hover:bg-dark-700 border border-dark-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <h3 className="text-primary-500 font-bold text-lg mb-2">🎯 Match por afinidad</h3>
              <p className="text-gray-400 text-sm">
                Filtrá por servidor, rol y estilo de juego. Sin matches imposibles.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <h3 className="text-primary-500 font-bold text-lg mb-2">🛡️ Reviews que importan</h3>
              <p className="text-gray-400 text-sm">
                Sistema anti-troll con doble confirmación y peso por confianza.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
              <h3 className="text-primary-500 font-bold text-lg mb-2">⚡ Sin esperas</h3>
              <p className="text-gray-400 text-sm">
                LFG directo: creá búsqueda, elegí roles, encontrá equipo.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link to="/games" className="text-primary-500 hover:text-primary-50 underline">
              Ver los juegos soportados →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ----- Vista: logueado (loading) -----
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // ----- Vista: logueado SIN juegos configurados -----
  if (profiles.length === 0) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-1">
            Bienvenido de vuelta, {currentUser.username} 👋
          </h1>
          <p className="text-gray-400 mb-8">
            Para empezar a buscar equipo, configurá tu primer perfil de juego.
          </p>

          {/* Tutorial de 3 pasos */}
          <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">¿Cómo funciona GameConnect?</h2>
            <div className="space-y-4">
              {[
                {
                  n: 1,
                  title: 'Configurá tu perfil de juego',
                  desc: 'Elegí el juego, tu rol, tu servidor y tu rango. Podés tener perfiles para varios juegos.',
                },
                {
                  n: 2,
                  title: 'Creá o unite a una búsqueda',
                  desc: 'Publicá qué roles necesitás y el modo que querés jugar, o buscá partidas abiertas para unirte.',
                },
                {
                  n: 3,
                  title: 'Jugá y calificá a tus compañeros',
                  desc: 'Después de la partida, ambos confirman que jugaron y pueden escribirse reviews. La reputación se construye con el tiempo.',
                },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-sm text-gray-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/profile/game-profiles/new"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Crear mi primer perfil de juego
          </Link>
        </div>
      </div>
    )
  }

  // ----- Vista: logueado CON juegos configurados -----
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Saludo */}
        <h1 className="text-3xl font-bold mb-1">
          Bienvenido de vuelta, {currentUser.username} 👋
        </h1>
        <p className="text-gray-400 mb-8">
          Tus juegos configurados. Creá una búsqueda o explorá las que hay disponibles.
        </p>

        {/* Cards de juegos */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tus juegos
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col gap-4"
            >
              {/* Header de la card */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-900 flex items-center justify-center text-xl shrink-0">
                  {GAME_EMOJIS[profile.game.slug] || '🎮'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {profile.game.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {profile.server}
                    {profile.main_role && ` · ${profile.main_role}`}
                    {profile.rank && ` · ${profile.rank}`}
                  </p>
                </div>
              </div>

              {/* Botón crear búsqueda */}
              <button
                onClick={() => navigate(`/searches/new?game_slug=${profile.game.slug}`)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                + Crear búsqueda
              </button>
            </div>
          ))}

          {/* Card para agregar juego nuevo */}
          <Link
            to="/profile/game-profiles/new"
            className="bg-dark-800 border border-dashed border-dark-700 hover:border-primary-500 rounded-lg p-4 flex flex-col items-center justify-center gap-2 min-h-[120px] transition-colors group"
          >
            <span className="text-2xl text-gray-600 group-hover:text-primary-500 transition-colors">+</span>
            <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">
              Agregar juego
            </p>
          </Link>
        </div>

        {/* CTAs secundarios */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-dark-700">
          <Link
            to="/searches"
            className="text-sm text-primary-500 hover:text-primary-400 border border-primary-700 hover:border-primary-500 px-4 py-2 rounded-lg transition-colors"
          >
            Explorar búsquedas abiertas
          </Link>
          <Link
            to="/my-searches"
            className="text-sm text-gray-400 hover:text-white border border-dark-700 hover:border-dark-600 px-4 py-2 rounded-lg transition-colors"
          >
            Ver mis búsquedas
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage