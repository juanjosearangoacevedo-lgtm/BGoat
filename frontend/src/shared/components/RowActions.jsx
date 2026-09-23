import { Edit2, Eye, Power, PowerOff, Trash2 } from "lucide-react";

/**
 * Botonera de acciones de una fila o tarjeta.
 *
 * Centraliza el set que se repetia copiado en cada tabla (ver / editar /
 * activar / eliminar) para que el icono, el color y el tooltip sean los
 * mismos en todo el panel.
 */
const tonos = {
  neutro: "text-gray-400 hover:bg-gray-100 hover:text-gray-600",
  primario: "text-gray-400 hover:bg-[#0F4C3F]/10 hover:text-[#0F4C3F]",
  info: "text-gray-400 hover:bg-blue-50 hover:text-blue-500",
  exito: "text-gray-400 hover:bg-green-50 hover:text-green-600",
  advertencia: "text-gray-400 hover:bg-amber-50 hover:text-amber-600",
  peligro: "text-gray-400 hover:bg-red-50 hover:text-red-500",
};

export function RowActions({ acciones = [], align = "left", className = "" }) {
  const visibles = acciones.filter(Boolean);
  if (visibles.length === 0) return null;

  return (
    <div
      className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""} ${className}`}
      onClick={(evento) => evento.stopPropagation()}
    >
      {visibles.map((accion) => {
        const Icono = accion.icono;
        return (
          <button
            key={accion.label}
            type="button"
            title={accion.label}
            aria-label={accion.label}
            disabled={accion.disabled}
            onClick={accion.onClick}
            className={`rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              tonos[accion.tono] || tonos.neutro
            }`}
          >
            <Icono className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Set estandar de acciones de un registro administrativo.
 * Se omite la accion cuyo manejador no se entregue, de modo que un modulo sin
 * detalle o sin estado no muestre botones que no hacen nada.
 */
export function accionesEstandar({ fila, onDetalle, onEdit, onToggleEstado, onDelete, activo }) {
  const estaActivo = activo ?? String(fila?.estado || "").toUpperCase().startsWith("ACTIV");

  return [
    onDetalle && {
      label: "Ver detalle",
      icono: Eye,
      tono: "info",
      onClick: () => onDetalle(fila),
    },
    onEdit && {
      label: "Editar",
      icono: Edit2,
      tono: "primario",
      onClick: () => onEdit(fila),
    },
    onToggleEstado && {
      label: estaActivo ? "Desactivar" : "Activar",
      icono: estaActivo ? PowerOff : Power,
      tono: estaActivo ? "advertencia" : "exito",
      onClick: () => onToggleEstado(fila),
    },
    onDelete && {
      label: "Eliminar",
      icono: Trash2,
      tono: "peligro",
      onClick: () => onDelete(fila),
    },
  ].filter(Boolean);
}
