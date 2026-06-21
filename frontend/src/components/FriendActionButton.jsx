/**
 * Botón/badge de relación de amistad, reutilizado en FriendsPage (buscador)
 * y en PublicUserPage.
 *
 * Props:
 *   - relation: 'none' | 'sent' | 'received' | 'friend' (ver getRelationStatus)
 *   - onSendRequest / onAccept / onReject: callbacks (reciben nada, el caller
 *     ya sabe a qué username aplica)
 *   - disabled: deshabilita los botones mientras hay una acción en curso
 */
function FriendActionButton({ relation, onSendRequest, onAccept, onReject, disabled = false }) {
  if (relation === 'none') {
    return (
      <button
        onClick={onSendRequest}
        disabled={disabled}
        className="text-xs bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        + Agregar
      </button>
    )
  }

  if (relation === 'sent') {
    return (
      <span className="text-xs bg-green-900/40 text-green-400 border border-green-700 px-3 py-1.5 rounded-lg whitespace-nowrap">
        ✓ Solicitud enviada
      </span>
    )
  }

  if (relation === 'received') {
    return (
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={disabled}
          className="text-xs bg-green-700 hover:bg-green-600 disabled:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Aceptar
        </button>
        <button
          onClick={onReject}
          disabled={disabled}
          className="text-xs bg-dark-700 hover:bg-dark-900 disabled:bg-dark-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Rechazar
        </button>
      </div>
    )
  }

  // relation === 'friend'
  return (
    <span className="text-xs text-green-400 px-3 py-1.5 whitespace-nowrap">
      ✓ Amigos
    </span>
  )
}

export default FriendActionButton
