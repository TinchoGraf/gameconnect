/**
 * Card de un participante en una búsqueda.
 *
 * Props:
 *   - participation: objeto Participation del backend
 *   - canManage: bool, true si el usuario actual puede aceptar/rechazar
 *                (solo el creador de la búsqueda lo tiene en true para postulantes pendientes)
 *   - onAccept(userId): callback opcional para aceptar
 *   - onReject(userId): callback opcional para rechazar
 *   - actionLoading: bool, deshabilita botones mientras se ejecuta una acción
 */
function ParticipantCard({
  participation,
  canManage = false,
  onAccept,
  onReject,
  actionLoading = false,
}) {
  // Estilos por estado
  const statusStyles = {
    accepted: 'bg-green-900/40 text-green-300 border-green-700',
    pending: 'bg-amber-900/40 text-amber-300 border-amber-700',
    rejected: 'bg-red-900/40 text-red-300 border-red-700',
    left: 'bg-dark-700 text-gray-400 border-dark-700',
  }
  const statusLabels = {
    accepted: 'Aceptado',
    pending: 'Pendiente',
    rejected: 'Rechazado',
    left: 'Se fue',
  }

  return (
    <div className="bg-dark-900 border border-dark-700 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">
          {participation.user.username}
          {participation.user.reputation_score > 0 && (
            <span className="text-xs text-gray-400 ml-2">
              ⭐ {participation.user.reputation_score.toFixed(1)}
            </span>
          )}
        </p>
        {participation.role && (
          <p className="text-xs text-gray-400 mt-0.5">
            Rol: <span className="text-primary-500">{participation.role}</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
        {/* Acciones de creador sobre postulante pendiente */}
        {canManage && participation.status === 'pending' && (
          <>
            <button
              onClick={() => onAccept?.(participation.user.id)}
              disabled={actionLoading}
              className="text-xs bg-green-700 hover:bg-green-600 disabled:bg-dark-700 text-white px-3 py-1 rounded transition-colors"
            >
              Aceptar
            </button>
            <button
              onClick={() => onReject?.(participation.user.id)}
              disabled={actionLoading}
              className="text-xs bg-red-900 hover:bg-red-800 disabled:bg-dark-700 text-white px-3 py-1 rounded transition-colors"
            >
              Rechazar
            </button>
          </>
        )}

        {/* Badge de estado (siempre visible) */}
        <span className={`text-xs px-2 py-1 rounded border ${statusStyles[participation.status] || statusStyles.left}`}>
          {statusLabels[participation.status] || participation.status}
        </span>
      </div>
    </div>
  )
}

export default ParticipantCard