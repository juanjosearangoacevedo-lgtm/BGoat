/**
 * Fechas del dia de planta.
 *
 * `hoy()` devuelve la fecha LOCAL del servidor, no la UTC. Es la
 * diferencia entre que el sistema funcione y que no: Colombia es UTC-5,
 * asi que `new Date().toISOString()` --que es lo que habia-- empieza a
 * devolver el dia siguiente a partir de las 7:00pm. Desde esa hora el
 * panel mostraba ceros, el recordatorio horario dejaba de avisar y una
 * hora capturada tarde se habria guardado con la fecha equivocada.
 *
 * Las tres rutas que trabajan por dia --captura, jornada e indicadores--
 * tenian cada una su propia copia de estas dos funciones. Una copia por
 * archivo es una oportunidad por archivo de arreglar el bug solo en dos.
 */
export function hoy() {
  const ahora = new Date();
  const desfase = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - desfase).toISOString().slice(0, 10);
}

/** Solo acepta el formato que la base entiende sin traducir: YYYY-MM-DD. */
export function fechaValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));
}
