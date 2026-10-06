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
  ACTIVO: "bg-marca-suave text-marca-texto",
  ACTIVA: "bg-marca-suave text-marca-texto",
  FINALIZADO: "bg-marca-suave text-marca-texto",
  FINALIZADA: "bg-marca-suave text-marca-texto",
  ENTREGADO: "bg-marca-suave text-marca-texto",
  VIGENTE: "bg-marca-suave text-marca-texto",
  VALIDADO: "bg-marca-suave text-marca-texto",

  // en curso / requiere atencion -> dorado
  EN_PROCESO: "bg-ambar/15 text-ambar-texto",
  EN_PRODUCCION: "bg-ambar/15 text-ambar-texto",
  DESPACHADO: "bg-ambar/15 text-ambar-texto",
  ALTA: "bg-ambar/15 text-ambar-texto",
  MANTENIMIENTO: "bg-ambar/15 text-ambar-texto",
  PAUSADA: "bg-ambar/15 text-ambar-texto",

  // inicial / bajo perfil -> gris
  PENDIENTE: "bg-fondo text-texto-suave",
  REGISTRADO: "bg-fondo text-texto-suave",
  APROBADO: "bg-fondo text-texto-suave",
  PROGRAMADA: "bg-fondo text-texto-suave",
  BORRADOR: "bg-fondo text-texto-suave",
  MEDIA: "bg-fondo text-texto-suave",
  BAJA: "bg-fondo text-gris",

  // negativo -> rojo (exclusivo de error, nunca dorado)
  BLOQUEADO: "bg-peligro/15 text-peligro",
  CANCELADO: "bg-peligro/10 text-peligro",
  CANCELADA: "bg-peligro/10 text-peligro",
  ANULADO: "bg-peligro/10 text-peligro",
  URGENTE: "bg-peligro/15 text-peligro",

  // inactivo / neutral -> gris
  INACTIVO: "bg-fondo text-gris",
  INACTIVA: "bg-fondo text-gris",
  RETIRADO: "bg-fondo text-gris",
  OBSOLETA: "bg-fondo text-gris",
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
  const style = styles[key] || "bg-fondo text-texto-suave";

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${style}`}>{statusLabel(status)}</span>;
}
