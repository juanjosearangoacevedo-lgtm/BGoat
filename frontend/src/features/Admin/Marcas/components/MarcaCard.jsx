import { CalendarDays } from "lucide-react";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, iniciales } from "@/shared/utils/formatters";

const brandGradients = [
  "from-[#433A9B] to-[#5a4fb8]",
  "from-[#F39A3D] to-[#e07a1a]",
  "from-teal-500 to-teal-700",
  "from-rose-500 to-rose-700",
  "from-emerald-500 to-emerald-700",
];

/** Tarjeta de la tabla `marcas`. */
export function MarcaCard({ marca, index = 0, onDetalle, onEdit, onToggleEstado, onDelete }) {
  return (
    <div
      onClick={() => onDetalle?.(marca)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`relative bg-gradient-to-r p-6 ${brandGradients[index % brandGradients.length]}`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 text-2xl font-black text-white backdrop-blur-sm">
          {iniciales(marca.nombre)}
        </div>
        <div className="absolute right-4 top-4">
          <StatusBadge status={marca.estado} />
        </div>
      </div>

      <div className="p-5">
        <h3 className="truncate text-lg font-bold text-gray-900">{marca.nombre}</h3>
        <p className="mb-3 mt-1 line-clamp-2 min-h-10 text-sm text-gray-600">
          {marca.descripcion || "Sin descripcion"}
        </p>

        <div className="flex items-center justify-between gap-2 border-t border-gray-50 pt-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
            {formatFecha(marca.fecha_creacion)}
          </div>
          <RowActions
            className="opacity-60 transition-opacity group-hover:opacity-100"
            acciones={accionesEstandar({ fila: marca, onDetalle, onEdit, onToggleEstado, onDelete })}
          />
        </div>
      </div>
    </div>
  );
}
