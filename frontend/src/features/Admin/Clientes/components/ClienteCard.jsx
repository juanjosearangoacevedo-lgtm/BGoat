import { AtSign, MapPin, Phone } from "lucide-react";
import { RowActions, accionesEstandar } from "@/shared/components/RowActions";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { documento, iniciales, nombreCliente } from "@/shared/utils/formatters";

const avatarColors = [
  "bg-[#433A9B]",
  "bg-[#F39A3D]",
  "bg-teal-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-amber-500",
];

/** Tarjeta de la tabla `clientes`. */
export function ClienteCard({ cliente, index = 0, onDetalle, onEdit, onToggleEstado, onDelete }) {
  const nombre = nombreCliente(cliente);

  return (
    <div
      onClick={() => onDetalle?.(cliente)}
      className="group cursor-pointer rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${
              avatarColors[index % avatarColors.length]
            }`}
          >
            {iniciales(nombre)}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-gray-900">{nombre}</h3>
            <p className="text-xs text-gray-400">{documento(cliente)}</p>
          </div>
        </div>
        <StatusBadge status={cliente.estado} />
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <AtSign className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">{cliente.correo || "Sin correo"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          {cliente.telefono || "Sin telefono"}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">{cliente.direccion || "Sin direccion"}</span>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-gray-50 pt-4">
        <RowActions
          className="opacity-60 transition-opacity group-hover:opacity-100"
          acciones={accionesEstandar({
            fila: cliente,
            onDetalle,
            onEdit,
            onToggleEstado,
            onDelete,
          })}
        />
      </div>
    </div>
  );
}
