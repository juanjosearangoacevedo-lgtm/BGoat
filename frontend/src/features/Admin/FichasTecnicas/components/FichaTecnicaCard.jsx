import { Shirt } from "lucide-react";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, GUION } from "@/shared/utils/formatters";

/** Tarjeta de un registro de `fichas_tecnicas`. */
export function FichaTecnicaCard({ ficha, referencia, onSelect, onEdit, onToggleEstado, onDelete }) {
  const ref = ficha.referencia || referencia;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      <button onClick={() => onSelect?.(ficha)} className="block w-full text-left" type="button">
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-[#433A9B]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          {ficha.ruta_imagen ? (
            <img
              src={ficha.ruta_imagen}
              alt={ficha.codigo_ficha}
              className="h-full w-full object-cover"
            />
          ) : (
            <Shirt className="h-20 w-20 text-white/80" />
          )}
          <div className="absolute right-3 top-3">
            <StatusBadge status={ficha.estado} />
          </div>
        </div>

        <div className="p-5 pb-3">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900">{ficha.codigo_ficha}</h3>
            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              v{ficha.version}
            </span>
          </div>
          <p className="mb-3 text-xs text-gray-400">
            Ref. {ref?.codigo || ficha.id_referencia} {ref?.nombre ? `· ${ref.nombre}` : ""}
          </p>
          <p className="line-clamp-2 text-sm text-gray-600">{ficha.descripcion || "Sin descripcion"}</p>
        </div>
      </button>

      <div className="flex items-center justify-between border-t border-gray-50 px-5 py-3">
        <div className="text-xs text-gray-400">
          SAM {ficha.sam_pactado ?? GUION} min · vigencia {formatFecha(ficha.fecha_vigencia)}
        </div>
        <RowActions
          className="opacity-60 transition-opacity group-hover:opacity-100"
          acciones={accionesEstandar({
            fila: ficha,
            onDetalle: onSelect,
            onEdit,
            onToggleEstado,
            onDelete,
            activo: String(ficha.estado).toUpperCase() === "VIGENTE",
          })}
        />
      </div>
    </div>
  );
}
