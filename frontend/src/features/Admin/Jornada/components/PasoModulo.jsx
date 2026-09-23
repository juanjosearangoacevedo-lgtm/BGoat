import { CheckCircle2, Users } from "lucide-react";

/**
 * Paso 1: en que modulo.
 *
 * Es una rejilla de botones grandes, no un desplegable: la digitadora
 * elige de pie y con el celular en una mano, y los 12 modulos caben en
 * pantalla. Un desplegable ahi son dos toques y una lista que tapa todo.
 *
 * Los modulos que ya tienen jornada se muestran igual, marcados: sirven
 * para ver de un vistazo que falta por arrancar, y tocarlos lleva a
 * continuar esa jornada en vez de dar un error.
 */
export function PasoModulo({ modulos = [], seleccionado, onSeleccionar, onContinuarJornada }) {
  if (modulos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
        No hay modulos activos. Registralos primero en Planta &gt; Modulos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {modulos.map((modulo) => {
        const activo = String(seleccionado) === String(modulo.id_modulo);
        const ocupado = Boolean(modulo.id_jornada_modulo);

        return (
          <button
            key={modulo.id_modulo}
            type="button"
            onClick={() =>
              ocupado ? onContinuarJornada?.(modulo) : onSeleccionar(String(modulo.id_modulo))
            }
            className={`relative flex min-h-[104px] flex-col items-start justify-between rounded-2xl border-2 p-4 text-left transition ${
              activo
                ? "border-[#0F4C3F] bg-[#0F4C3F]/5 shadow-sm"
                : ocupado
                  ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                  : "border-gray-200 bg-white hover:border-[#D08E10]/40 hover:shadow-sm"
            }`}
          >
            {ocupado && (
              <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-emerald-500" />
            )}

            <div className="min-w-0">
              <div className="text-lg font-bold text-gray-900">{modulo.codigo}</div>
              <div className="truncate text-xs text-gray-500">{modulo.ubicacion || modulo.nombre}</div>
            </div>

            {ocupado ? (
              <div className="mt-2 min-w-0 text-xs font-medium text-emerald-700">
                <div className="truncate">{modulo.nombre_cliente}</div>
                <div className="truncate text-emerald-600/80">{modulo.codigo_lote}</div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                <Users className="h-3.5 w-3.5" />
                {modulo.capacidad_operarios} puestos
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
