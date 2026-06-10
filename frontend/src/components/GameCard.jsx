/**
 * Card visual para mostrar un juego.
 *
 * Recibe un juego como prop y renderiza nombre, descripción,
 * cantidad de roles y servidores disponibles.
 *
 * Las "props" en React son como argumentos de función:
 * lo que el componente padre le pasa para personalizar este.
 */
function GameCard({ game }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-primary-500 transition-colors">
      <h3 className="text-2xl font-bold text-white mb-2">
        {game.name}
      </h3>

      {game.description && (
        <p className="text-dark-700 text-sm mb-4">
          {game.description}
        </p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-300">
          <span className="font-semibold text-primary-500 mr-2">Roles:</span>
          <span>{game.roles.length}</span>
        </div>
        <div className="flex items-center text-gray-300">
          <span className="font-semibold text-primary-500 mr-2">Servidores:</span>
          <span>{game.servers.length}</span>
        </div>
        <div className="flex items-center text-gray-300">
          <span className="font-semibold text-primary-500 mr-2">Modos:</span>
          <span>{game.game_modes.length}</span>
        </div>
      </div>

      {/* Tags de roles, hasta 5 visibles */}
      <div className="mt-4 flex flex-wrap gap-2">
        {game.roles.slice(0, 5).map((role) => (
          <span
            key={role}
            className="bg-primary-700/30 text-primary-50 text-xs px-2 py-1 rounded"
          >
            {role}
          </span>
        ))}
      </div>
    </div>
  )
}

export default GameCard