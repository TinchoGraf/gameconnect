import { useState } from 'react'

/**
 * Componente reutilizable: rating de 1 a 5 estrellas como input.
 *
 * Props:
 *   - value: número actual (1-5) o 0 si no hay selección
 *   - onChange: callback que recibe el nuevo valor
 *   - label: texto que aparece arriba (ej: "Comunicación")
 *   - hint: texto opcional debajo del label para explicar qué evaluar
 *
 * UX:
 *   - Hover sobre una estrella muestra la "previsualización" del rating
 *   - Click confirma la selección
 *   - Las estrellas previas a la elegida quedan rellenas
 */
function StarRating({ value, onChange, label, hint }) {
  // Estado local: la estrella sobre la que está el mouse
  const [hovered, setHovered] = useState(0)

  // El valor "visual" que mostramos: si hay hover, el hover, sino el value
  const displayValue = hovered || value

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"  // Importante: type="button" evita que dispare submit del form
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
          >
            <span className={star <= displayValue ? 'text-yellow-400' : 'text-dark-700'}>
              ★
            </span>
          </button>
        ))}

        {/* Mostrar el valor numérico al lado */}
        <span className="text-sm text-gray-400 ml-3">
          {value > 0 ? `${value}/5` : 'Sin calificar'}
        </span>
      </div>
    </div>
  )
}

export default StarRating