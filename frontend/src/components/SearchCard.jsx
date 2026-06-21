import { Link } from 'react-router-dom'

function SearchCard({ search }) {
  const isFull = search.accepted_count >= search.max_players
  const isAuto = search.join_mode === 'auto'

  return (
    <Link
      to={`/searches/${search.id}`}
      className="block bg-dark-800 border border-dark-700 rounded-lg p-5 hover:border-primary-500 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-primary-500 font-semibold uppercase">
            {search.game.name}
          </span>
          <h3 className="text-lg font-bold text-white mt-1 line-clamp-2">
            {search.title}
          </h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
          isFull ? 'bg-amber-900/40 text-amber-300' : 'bg-green-900/40 text-green-300'
        }`}>
          {isFull
            ? '¡Equipo completo!'
            : `Faltan ${search.max_players - search.accepted_count} de ${search.max_players - 1}`
          }
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-3">
        Por <span className="text-white">{search.creator.username}</span>
        {search.creator.reputation_score > 0 && (
          <span className="text-gray-500 ml-2">
            · ⭐ {search.creator.reputation_score.toFixed(1)}
          </span>
        )}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-300 mb-3">
        <div>
          <span className="text-gray-500">Server: </span>
          <span className="text-white font-semibold">{search.server}</span>
        </div>
        <div>
          <span className="text-gray-500">Modo: </span>
          <span className="text-white font-semibold">{search.mode}</span>
        </div>
        {search.min_rank && (
          <div className="col-span-2">
            <span className="text-gray-500">Rango mínimo: </span>
            <span className="text-white">{search.min_rank}</span>
          </div>
        )}
      </div>

      {search.roles_needed.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Roles buscados:</p>
          <div className="flex flex-wrap gap-1">
            {search.roles_needed.map((role) => (
              <span
                key={role}
                className="bg-primary-700/30 text-primary-50 text-xs px-2 py-1 rounded"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 pt-3 border-t border-dark-700">
        {isAuto ? '⚡ Unión automática' : '👤 El creador aprueba postulantes'}
      </div>
    </Link>
  )
}

export default SearchCard