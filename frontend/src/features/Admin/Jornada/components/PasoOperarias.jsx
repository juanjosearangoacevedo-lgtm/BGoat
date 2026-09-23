import { Minus, Plus } from "lucide-react";

/**
 * Paso 2: cuantas operarias.
 *
 * Un contador con dos botones grandes en lugar de un campo de texto: es
 * un numero pequeno que casi siempre se mueve de a uno respecto al dia
 * anterior, y un teclado numerico en el celular tapa media pantalla.
 *
 * El campo escribible sigue ahi para el caso raro (saltar de 3 a 12).
 */
export function PasoOperarias({ valor, capacidad, onCambiar, error }) {
  const cantidad = Number(valor) || 0;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => onCambiar(cantidad - 1)}
          disabled={cantidad <= 1}
          aria-label="Una operaria menos"
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-600 transition hover:border-[#0F4C3F] hover:text-[#0F4C3F] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600"
        >
          <Minus className="h-7 w-7" />
        </button>

        <input
          type="number"
          min={1}
          max={99}
          value={cantidad}
          onChange={(evento) => onCambiar(evento.target.value)}
          aria-label="Cantidad de operarias"
          className="w-28 rounded-2xl border-2 border-gray-200 bg-white py-3 text-center text-5xl font-bold text-[#0F4C3F] outline-none focus:border-[#0F4C3F] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          onClick={() => onCambiar(cantidad + 1)}
          disabled={cantidad >= 99}
          aria-label="Una operaria mas"
          className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-600 transition hover:border-[#0F4C3F] hover:text-[#0F4C3F] disabled:opacity-30"
        >
          <Plus className="h-7 w-7" />
        </button>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : (
        <p className="text-center text-sm text-gray-500">
          {capacidad ? `El modulo tiene ${capacidad} puestos.` : null} Este numero fija los minutos
          disponibles de cada hora, y con ellos la meta.
        </p>
      )}
    </div>
  );
}
