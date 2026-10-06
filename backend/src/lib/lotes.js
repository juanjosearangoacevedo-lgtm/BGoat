import { queryOne } from "../config/db.js";
import { ApiError } from "./http.js";

/**
 * Las reglas del lote que el CRUD generico no sabe expresar: cruzan varios
 * campos, o dependen de lo que ya hay guardado. `resources.js` las enchufa
 * como `antesDeGuardar` y `consecutivo`.
 *
 * Los tres datos que identifican un lote son el numero de pedido, el codigo
 * de referencia y el nombre de la referencia. El cliente manda el que
 * trae su hoja, y a veces solo uno: por eso basta con que haya uno (se
 * pueden llenar los tres). El codigo de lote, en cambio, ya no se digita:
 * lo asigna el sistema (ver `generarCodigoLote`).
 */

/** Se guardan siempre en MAYUSCULAS: son codigos que se leen y se cruzan a ojo. */
export const CAMPOS_EN_MAYUSCULAS = ["numero_pedido", "codigo_referencia"];

/** Los tres de los que tiene que haber al menos uno. */
export const CAMPOS_IDENTIFICACION = ["numero_pedido", "codigo_referencia", "nombre_referencia"];

export const MENSAJE_IDENTIFICACION =
  "Hace falta al menos uno: numero de pedido, codigo de referencia o nombre de la referencia.";

const tieneValor = (valor) => valor !== undefined && valor !== null && String(valor).trim() !== "";

/** true si la fila trae al menos uno de los tres datos de identificacion. */
export const tieneIdentificacion = (fila) =>
  CAMPOS_IDENTIFICACION.some((campo) => tieneValor(fila?.[campo]));

/**
 * Recorta los textos de identificacion y sube a mayusculas los codigos.
 * "  ped-12 " queda "PED-12", y un campo que solo trae espacios queda en
 * NULL: sin esto contaria como "lleno" y se colaria por la regla de abajo.
 *
 * Un campo que no vino (`undefined`) se deja como esta, para no inventarle
 * una clave a una actualizacion parcial.
 */
export function normalizarTextosLote(datos) {
  for (const campo of CAMPOS_IDENTIFICACION) {
    if (!Object.prototype.hasOwnProperty.call(datos, campo)) continue;

    const valor = datos[campo];
    if (valor === undefined || valor === null) continue;

    const texto = String(valor).trim();
    if (texto === "") {
      datos[campo] = null;
    } else {
      datos[campo] = CAMPOS_EN_MAYUSCULAS.includes(campo) ? texto.toUpperCase() : texto;
    }
  }
  return datos;
}

/**
 * `antesDeGuardar` del lote: normaliza los textos y exige la identificacion.
 *
 * Al CREAR, el lote tiene que traer al menos uno de los tres.
 *
 * Al ACTUALIZAR se mira lo que quedaria guardado (lo que ya habia mas lo
 * que llega), y solo se rechaza si un lote que SI tenia identificacion se
 * quedaria sin ninguna. Un lote viejo que nunca tuvo ninguno (se registro
 * antes de esta regla, solo con su codigo) no se bloquea por eso: si no, ni
 * siquiera se podria desactivar desde la tabla. La pantalla de edicion si
 * se lo exige al guardar, que es donde se corrige.
 */
export async function prepararLote(datos, { id } = {}) {
  normalizarTextosLote(datos);

  let actual = null;
  if (id) {
    actual = await queryOne(
      "SELECT numero_pedido, codigo_referencia, nombre_referencia FROM lotes WHERE id_lote = ?",
      [id],
    );
    // Si el lote no existe, la ruta responde 404 justo despues.
    if (!actual) return datos;
  }

  const resultante = { ...actual, ...datos };
  if (!tieneIdentificacion(resultante) && (!actual || tieneIdentificacion(actual))) {
    throw ApiError.badRequest(MENSAJE_IDENTIFICACION);
  }

  return datos;
}

/**
 * El siguiente codigo de lote del año: LT-2026-0001, LT-2026-0002...
 *
 * Toma el numero mas alto que haya en este año y le suma uno. Mira solo los
 * codigos con la forma exacta `LT-AAAA-n`: hay lotes viejos con codigos
 * escritos a mano ("LOT-9703-01", "LT-2026-A1") que no son consecutivos y no
 * deben contar. Compara el numero y no el texto, asi que no se rompe cuando
 * el sufijo pasa de 9999. Arranca en 1 el primer dia del año.
 */
export async function generarCodigoLote() {
  const prefijo = `LT-${new Date().getFullYear()}-`;
  // El largo del prefijo sale de este archivo, no del cliente: es seguro
  // escribirlo directo en el SQL.
  const fila = await queryOne(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_lote, ${prefijo.length + 1}) AS UNSIGNED)), 0) AS ultimo
       FROM lotes
      WHERE codigo_lote REGEXP ?`,
    [`^${prefijo}[0-9]+$`],
  );
  return `${prefijo}${String(Number(fila.ultimo) + 1).padStart(4, "0")}`;
}
