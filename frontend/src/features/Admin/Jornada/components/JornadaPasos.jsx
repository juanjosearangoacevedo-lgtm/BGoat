import { Check } from "lucide-react";

/**
 * Barra de pasos del asistente.
 *
 * Muestra en que va y cuanto falta. Los pasos ya resueltos son
 * clickeables para volver atras: corregir el modulo no deberia obligar a
 * empezar de cero.
 */
export function JornadaPasos({ pasos = [], actual = 0, onIr }) {
  return (
    <ol className="mb-6 flex items-center gap-1 sm:gap-2">
      {pasos.map((paso, indice) => {
        const completado = indice < actual;
        const activo = indice === actual;
        const alcanzable = indice <= actual;

        return (
          <li key={paso.clave} className="flex flex-1 items-center gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!alcanzable}
              onClick={() => alcanzable && onIr?.(indice)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-2 text-left transition sm:px-3 ${
                activo
                  ? "bg-[#0F4C3F]/10"
                  : alcanzable
                    ? "hover:bg-gray-50"
                    : "cursor-not-allowed opacity-50"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  completado
                    ? "bg-[#0F4C3F] text-white"
                    : activo
                      ? "bg-[#0F4C3F] text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {completado ? <Check className="h-4 w-4" /> : indice + 1}
              </span>
              <span
                className={`hidden truncate text-sm sm:block ${
                  activo ? "font-semibold text-[#0F4C3F]" : "text-gray-500"
                }`}
              >
                {paso.titulo}
              </span>
            </button>

            {indice < pasos.length - 1 && (
              <span
                className={`hidden h-px w-4 shrink-0 sm:block ${
                  completado ? "bg-[#0F4C3F]" : "bg-gray-200"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
