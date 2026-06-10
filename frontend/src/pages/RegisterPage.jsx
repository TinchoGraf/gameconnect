import { Link } from 'react-router-dom'

function RegisterPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white flex items-center justify-center">
      <div className="bg-dark-800 border border-dark-700 rounded-lg p-8 max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold mb-6">Crear cuenta</h1>
        <p className="text-gray-400 mb-4">
          Esta página todavía no está lista. Vuelve en la próxima sesión.
        </p>
        <Link to="/" className="text-primary-500 hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    </div>
  )
}

export default RegisterPage