import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, formatFechaHora, GUION } from "@/shared/utils/formatters";

/**
 * Datos de cabecera de la orden (vista `vw_avance_orden`).
 *
 * Ya no muestra marca ni pedido: la marca se fusiono con el cliente y el
 * pedido dejo de existir. Tampoco el detalle por prenda, porque la
 * produccion se mide por lote.
 */
export function OrdenInfoPanel({ orden }) {
  const rows = [
    { label: "Lote", value: orden?.codigo_lote },
    { label: "Cliente", value: orden?.nombre_cliente },
    { label: "Referencia", value: orden?.codigo_referencia },
    {
      // La orden no se asigna a un modulo: nace libre y la toma el que
      // abre su jornada con ella. Mientras nadie la tome, esto dice
      // "Libre" y no un guion, que se leeria como un dato faltante.
      label: "Modulo",
      value: orden?.codigo_modulo
        ? `${orden.codigo_modulo} · ${orden.nombre_modulo}`
        : "Libre - la toma el modulo que abra jornada con ella",
    },
    { label: "SAM pactado", value: orden?.sam_pactado ? `${orden.sam_pactado} min` : null },
    { label: "Pedido", value: orden?.numero_pedido },
    {
      label: "Entrega del lote",
      value: orden?.fecha_entrega_programada
        ? formatFecha(orden.fecha_entrega_programada)
        : null,
    },
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
    </div>
  );
}
