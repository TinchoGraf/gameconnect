import { Link } from 'react-router-dom'

/**
 * Card de una review recibida.
 *
 * Muestra autor, average_score, las 4 categorías por separado, el comentario,
 * "¿volvería a jugar?", fecha y flag de "review marcada" si tiene flagged=true.
 */
function ReviewCard({ review }) {
  // Helper para formatear fechas
  function formatDate(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // Categorías para mostrar el desglose
  const categories = [
    { label: 'Comunicación', value: review.communication },
    { label: 'Actitud', value: review.attitude },
    { label: 'Skill', value: review.skill },
    { label: 'Confiabilidad', value: review.reliability },
  ]

  return (
    <div className={`bg-dark-800 border rounded-lg p-5 ${
      review.flagged ? 'border-amber-700' : 'border-dark-700'
    }`}>

      {/* Header: autor + score + fecha */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link
            to={`/users/${review.author.username}`}
            className="font-semibold text-white hover:text-primary-500 transition-colors"
          >
            {review.author.username}
          </Link>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(review.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">
            {review.average_score.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">de 5.00</p>
        </div>
      </div>

      {/* Flag de outlier */}
      {review.flagged && (
        <div className="bg-amber-900/20 border border-amber-700 rounded p-2 mb-3 text-xs text-amber-200">
          ⚠ Review marcada como atípica · pesa menos en el cálculo de reputación
        </div>
      )}

      {/* Desglose por categoría */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {categories.map((cat) => (
          <div key={cat.label} className="bg-dark-900 rounded p-2">
            <p className="text-xs text-gray-500">{cat.label}</p>
            <p className="text-sm font-semibold text-white">
              {cat.value} <span className="text-gray-500 text-xs">/ 5</span>
            </p>
          </div>
        ))}
      </div>

      {/* Comentario */}
      <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">
        {review.comment}
      </p>

      {/* Footer: ¿volvería a jugar? */}
      <div className="flex items-center justify-between pt-3 border-t border-dark-700 text-xs">
        <span className={review.would_play_again ? 'text-green-400' : 'text-red-400'}>
          {review.would_play_again ? '👍 Volvería a jugar' : '👎 No volvería a jugar'}
        </span>
        <span className="text-gray-500">
          peso: {review.weight.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

export default ReviewCard