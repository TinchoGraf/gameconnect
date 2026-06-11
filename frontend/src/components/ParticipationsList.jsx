/**
 * Lista visual de participantes de una búsqueda.
 *
 * Props:
 *   - participations: array de Participation con user embebido
 *   - creatorId: id del creador (para marcarlo visualmente como "creador")
 *   - currentUserId: id del usuario actual (para marcarse a sí mismo)
 *   - onAccept, onReject: handlers opcionales que aparecen solo si los pasamos
 *     (los usamos en sesión 3.B para el panel del creador)
 */
function ParticipationsList({
  participations,
  creatorId,
  currentUserId,
  onAccept,
  onReject,
}) {
  // Solo mostramos pending y accepted (no rejected/left, esos son históricos)
  const visible = participations.filter(
    (p) => p.status === 'pending' || p.status === 'accepted'
  )

  if (visible.length === 0) {
    return (
      <p className="text-gray-500 text-sm italic">
        Todavía no hay participantes.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {visible.map((p) => {
        const isCreator = p.user.id === creatorId
        const isMe = p.user.id === currentUserId
        const isPending = p.status === 'pending'

        return (
          <li
            key={p.id}
            className="flex items-center justify-between bg-dark-900 border border-dark-700 rounded-lg px-4 py-3"
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-white font-medium">{p.user.username}</span>

              {isCreator && (
                <span className="bg-primary-700/30 text-primary-50 text-xs px-2 py-0.5 rounded">
                  Creador
                </span>
              )}

              {isMe && !isCreator && (
                <span className="bg-dark-700 text-gray-300 text-xs px-2 py-0.5 rounded">
                  Vos
                </span>
              )}

              {p.role && (
                <span className="text-xs text-gray-400">
                  · {p.role}
                </span>
              )}

              {p.user.reputation_score > 0 && (
                <span className="text-xs text-gray-500">
                  ⭐ {p.user.reputation_score.toFixed(1)}
                </span>
              )}

              {isPending && (
                <span className="bg-amber-900/40 text-amber-300 text-xs px-2 py-0.5 rounded">
                  Pendiente
                </span>
              )}
            </div>

            {/* Acciones (solo si las pasamos) */}
            {isPending && (onAccept || onReject) && (
              <div className="flex gap-2">
                {onAccept && (
                  <button
                    onClick={() => onAccept(p.user.id)}
                    className="text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded transition-colors"
                  >
                    Aceptar
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={() => onReject(p.user.id)}
                    className="text-xs bg-red-900 hover:bg-red-950 text-white px-3 py-1 rounded transition-colors"
                  >
                    Rechazar
                  </button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default ParticipationsList