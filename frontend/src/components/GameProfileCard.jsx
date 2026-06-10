/**
 * Card que muestra un GameProfile.
 *
 * Props:
 *   - profile: objeto GameProfileOut del backend
 *   - onDelete: función opcional. Si se pasa, muestra un botón "Eliminar"
 *               que la invoca con el slug del juego.
 *   - onEdit: función opcional. Si se pasa, muestra un botón "Editar"
 *             que la invoca con el slug del juego.
 *
 * Si no se pasan handlers, las acciones no aparecen — útil para mostrar
 * perfiles públicos de otros usuarios (read-only).
 */
function GameProfileCard({ profile, onDelete, onEdit }) {
  return (
    <div className="bg-dark-800 border border-dark-700 rounded-lg p-6 hover:border-primary-500 transition-colors">

      {/* Header del card: nombre del juego + acciones */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{profile.game.name}</h3>
          <p className="text-sm text-gray-400">Servidor: <span className="text-primary-500">{profile.server}</span></p>
        </div>

        {(onDelete || onEdit) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(profile.game.slug)}
                className="text-sm text-gray-300 hover:text-white px-3 py-1 border border-dark-700 rounded transition-colors"
                title="Editar"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(profile.game.slug)}
                className="text-sm text-red-400 hover:text-red-300 px-3 py-1 border border-red-900 rounded transition-colors"
                title="Eliminar"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detalles */}
      <div className="space-y-2 text-sm">
        {profile.main_role && (
          <div>
            <span className="text-gray-400">Rol principal: </span>
            <span className="text-primary-500 font-semibold">{profile.main_role}</span>
          </div>
        )}

        {profile.rank && (
          <div>
            <span className="text-gray-400">Rango: </span>
            <span className="text-white">{profile.rank}</span>
          </div>
        )}

        {profile.in_game_name && (
          <div>
            <span className="text-gray-400">In-game name: </span>
            <span className="text-white">{profile.in_game_name}</span>
          </div>
        )}
      </div>

      {/* Lista de roles que juega */}
      {profile.roles.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-2">Roles que juego:</p>
          <div className="flex flex-wrap gap-2">
            {profile.roles.map((role) => (
              <span
                key={role}
                className={`text-xs px-2 py-1 rounded ${
                  role === profile.main_role
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-700 text-gray-300'
                }`}
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default GameProfileCard