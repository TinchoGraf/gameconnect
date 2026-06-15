import { Link } from 'react-router-dom'
import Header from '../components/Header'

/**
 * Página que se muestra cuando el usuario llega a una URL que no existe.
 *
 * Se monta en la ruta wildcard '*' del Router (App.jsx), así que cualquier
 * path que no matchee ninguna otra ruta cae acá.
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-7xl font-bold text-primary-500 mb-4">404</p>
        <h1 className="text-3xl font-bold mb-3">Esta página no existe</h1>
        <p className="text-gray-400 mb-8">
          La URL a la que intentaste acceder no corresponde a ninguna página de GameConnect.
          Puede que el link esté mal escrito o que la página ya no esté disponible.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/"
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            to="/searches"
            className="bg-dark-800 hover:bg-dark-700 border border-dark-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            Explorar búsquedas
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage