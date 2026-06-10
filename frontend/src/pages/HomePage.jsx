import { Link } from 'react-router-dom'

/**
 * Página de bienvenida.
 *
 * El componente <Link> de react-router-dom funciona como un <a> pero
 * SIN recargar el navegador. Cambia la URL y muestra el componente
 * de la nueva ruta sin tocar el servidor.
 */
function HomePage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">

        <h1 className="text-6xl font-bold mb-4">
          🎮 <span className="text-primary-500">GameConnect</span>
        </h1>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          La plataforma para conectarte con gamers que comparten tu nivel,
          tu servidor y tu forma de jugar. Sin tóxicos. Con reputación que importa.
        </p>

        {/* Botones de acción */}
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

        {/* Features destacados */}
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

        {/* Link a juegos soportados */}
        <div className="mt-12">
          <Link
            to="/games"
            className="text-primary-500 hover:text-primary-50 underline"
          >
            Ver los juegos soportados →
          </Link>
        </div>

      </div>
    </div>
  )
}

export default HomePage