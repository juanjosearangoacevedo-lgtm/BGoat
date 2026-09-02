import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFechaHora, GUION } from "@/shared/utils/formatters";

/** Datos de cabecera de la orden (vista `vw_avance_orden`). */
export function OrdenInfoPanel({ orden, detalle = [] }) {
  const rows = [
    { label: "Lote", value: orden?.codigo_lote },
    { label: "Modulo", value: orden?.codigo_modulo ? `${orden.codigo_modulo} · ${orden.nombre_modulo}` : null },
    { label: "Cliente", value: orden?.nombre_cliente },
    { label: "Marca", value: orden?.nombre_marca },
    { label: "Pedido", value: orden?.numero_pedido },
    { label: "SAM (min/unidad)", value: orden?.sam_minutos },
    { label: "Creada por", value: orden?.nombre_creador },
    { label: "Emision", value: orden ? formatFechaHora(orden.fecha_emision) : null },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Informacion General</h3>
        <StatusBadge status={orden?.prioridad} />
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 text-sm">
            <span className="flex-shrink-0 text-gray-400">{row.label}</span>
            <span className="truncate text-right font-medium text-gray-800">{row.value || GUION}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-50 pt-4">
        <p className="mb-2 text-xs text-gray-400">Prendas de la orden (detalle_orden_produccion)</p>
        {detalle.length === 0 ? (
          <p className="text-xs text-gray-400">Sin prendas registradas</p>
        ) : (
          <ul className="space-y-1.5">
            {detalle.map((linea) => (
              <li key={linea.id_detalle_orden ?? linea.id_prenda} className="flex justify-between text-xs">
                <span className="truncate text-gray-600">{linea.prenda?.sku || linea.id_prenda}</span>
                <span className="font-medium text-gray-800">{linea.cantidad_programada}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
