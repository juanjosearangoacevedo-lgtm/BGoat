/**
 * Etiqueta de estado.
 *
 * Recibe el valor tal como viaja en la base de datos (los ENUM de MySQL van en
 * MAYUSCULAS con guion bajo) y se encarga de mostrarlo legible.
 */
/**
 * Cuatro familias de color, las de la identidad de marca (verde, dorado,
 * rojo, gris) en vez de un color distinto por estado. Un azul o un teal
 * no significan nada en la paleta de BGoat, asi que cada estado se agrupa
 * por lo que REALMENTE comunica: logrado, en curso, inicial o negativo.
 */
const styles = {
  // logrado / activo / completo -> sage (badge "Sistema en tiempo real")
  ACTIVO: "bg-[#DCEAE1] text-[#1F5C45]",
  ACTIVA: "bg-[#DCEAE1] text-[#1F5C45]",
  FINALIZADO: "bg-[#DCEAE1] text-[#1F5C45]",
  FINALIZADA: "bg-[#DCEAE1] text-[#1F5C45]",
  ENTREGADO: "bg-[#DCEAE1] text-[#1F5C45]",
  VIGENTE: "bg-[#DCEAE1] text-[#1F5C45]",
  VALIDADO: "bg-[#DCEAE1] text-[#1F5C45]",

  // en curso / requiere atencion -> dorado
  EN_PROCESO: "bg-[#D49A17]/15 text-[#A87508]",
  EN_PRODUCCION: "bg-[#D49A17]/15 text-[#A87508]",
  DESPACHADO: "bg-[#D49A17]/15 text-[#A87508]",
  ALTA: "bg-[#D49A17]/15 text-[#A87508]",
  MANTENIMIENTO: "bg-[#D49A17]/15 text-[#A87508]",
  PAUSADA: "bg-[#D49A17]/15 text-[#A87508]",

  // inicial / bajo perfil -> gris
  PENDIENTE: "bg-[#F6F8F7] text-[#5C6B64]",
  REGISTRADO: "bg-[#F6F8F7] text-[#5C6B64]",
  APROBADO: "bg-[#F6F8F7] text-[#5C6B64]",
  PROGRAMADA: "bg-[#F6F8F7] text-[#5C6B64]",
  BORRADOR: "bg-[#F6F8F7] text-[#5C6B64]",
  MEDIA: "bg-[#F6F8F7] text-[#5C6B64]",
  BAJA: "bg-[#F6F8F7] text-[#8B968F]",

  // negativo -> rojo (exclusivo de error, nunca dorado)
  BLOQUEADO: "bg-[#D64545]/15 text-[#D64545]",
  CANCELADO: "bg-[#D64545]/10 text-[#D64545]",
  CANCELADA: "bg-[#D64545]/10 text-[#D64545]",
  ANULADO: "bg-[#D64545]/10 text-[#D64545]",
  URGENTE: "bg-[#D64545]/15 text-[#D64545]",

  // inactivo / neutral -> gris
  INACTIVO: "bg-[#F6F8F7] text-[#8B968F]",
  INACTIVA: "bg-[#F6F8F7] text-[#8B968F]",
  RETIRADO: "bg-[#F6F8F7] text-[#8B968F]",
  OBSOLETA: "bg-[#F6F8F7] text-[#8B968F]",
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
  const style = styles[key] || "bg-[#F6F8F7] text-[#5C6B64]";

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${style}`}>{statusLabel(status)}</span>;
}
