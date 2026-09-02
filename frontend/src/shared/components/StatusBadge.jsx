/**
 * Etiqueta de estado.
 *
 * Recibe el valor tal como viaja en la base de datos (los ENUM de MySQL van en
 * MAYUSCULAS con guion bajo) y se encarga de mostrarlo legible.
 */
const styles = {
  // Estados generales (clientes, marcas, roles, permisos, referencias, prendas)
  ACTIVO: "bg-green-100 text-green-700",
  INACTIVO: "bg-gray-100 text-gray-500",
  BLOQUEADO: "bg-red-100 text-red-700",
  RETIRADO: "bg-gray-100 text-gray-500",

  // lotes
  REGISTRADO: "bg-blue-100 text-blue-700",
  EN_PROCESO: "bg-[#F39A3D]/15 text-[#b46a12]",
  FINALIZADO: "bg-green-100 text-green-700",
  CANCELADO: "bg-red-50 text-red-500",

  // pedidos
  APROBADO: "bg-blue-100 text-blue-700",
  EN_PRODUCCION: "bg-[#F39A3D]/15 text-[#b46a12]",
  DESPACHADO: "bg-indigo-100 text-indigo-700",
  ENTREGADO: "bg-green-100 text-green-700",

  // ordenes de produccion
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  PAUSADA: "bg-orange-100 text-orange-700",
  FINALIZADA: "bg-green-100 text-green-700",
  CANCELADA: "bg-red-50 text-red-500",

  // fichas tecnicas
  BORRADOR: "bg-gray-100 text-gray-600",
  VIGENTE: "bg-green-100 text-green-700",
  OBSOLETA: "bg-gray-100 text-gray-500",
  INACTIVA: "bg-gray-100 text-gray-500",

  // modulos
  MANTENIMIENTO: "bg-yellow-100 text-yellow-800",

  // asignaciones de modulo
  PROGRAMADA: "bg-blue-100 text-blue-700",
  ACTIVA: "bg-green-100 text-green-700",

  // producciones
  VALIDADO: "bg-green-100 text-green-700",
  ANULADO: "bg-red-50 text-red-500",

  // prioridad de la orden
  BAJA: "bg-gray-100 text-gray-600",
  MEDIA: "bg-blue-100 text-blue-700",
  ALTA: "bg-[#F39A3D]/15 text-[#b46a12]",
  URGENTE: "bg-red-100 text-red-700",
};

/** Convierte EN_PROCESO -> "En proceso". */
export function statusLabel(status) {
  if (!status) return "";
  return String(status)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function StatusBadge({ status }) {
  if (!status) return null;

  const key = String(status).toUpperCase();
  const style = styles[key] || "bg-gray-100 text-gray-600";

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${style}`}>{statusLabel(status)}</span>;
}
