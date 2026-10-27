import { queryOne } from "../config/db.js";

/**
 * Codigos que asigna el sistema: el modulo (MOD-01, MOD-02...) y el operario
 * (OP-001, OP-002...). Nadie los digita: salen del consecutivo al crear y no
 * cambian. Es lo mismo que el codigo del lote (`lib/lotes.js`), y se conecta
 * igual, con `consecutivo` en `config/resources.js` (ver `lib/crud.js`, que se
 * encarga de que dos altas simultaneas no se lleven el mismo numero).
 *
 * El siguiente numero es el mas alto que ya exista con ese formato, mas uno.
 * Un codigo que no sigue el formato (uno escrito a mano en el modelo viejo)
 * se ignora al contar.
 */
const IDENTIFICADOR = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** "MOD-" + 13 con ancho 2 -> "MOD-13"; con ancho 3 y 7 -> "OP-007". */
export function formatearCodigo(prefijo, numero, ancho) {
  return `${prefijo}${String(numero).padStart(ancho, "0")}`;
}

/** El numero de un codigo con ese prefijo ("MOD-07" -> 7), o null si no sigue el formato. */
export function numeroDeCodigo(prefijo, codigo) {
  const texto = String(codigo ?? "");
  if (!texto.startsWith(prefijo)) return null;
  const resto = texto.slice(prefijo.length);
  return /^\d+$/.test(resto) ? Number(resto) : null;
}

/**
 * Crea un generador para `consecutivo`.
 *
 *   generarCodigoModulo = generadorDeCodigo({ tabla: "modulos", columna: "codigo", prefijo: "MOD-", ancho: 2 })
 *
 * `consulta` es la funcion que lee la base; se puede cambiar para probar sin ella.
 */
export function generadorDeCodigo({ tabla, columna, prefijo, ancho }, consulta = queryOne) {
  if (!IDENTIFICADOR.test(tabla) || !IDENTIFICADOR.test(columna)) {
    throw new Error("Nombre de tabla o columna invalido en la definicion del codigo");
  }

  return async function generarCodigo() {
    const fila = await consulta(
      `SELECT MAX(CAST(SUBSTRING(\`${columna}\`, ?) AS UNSIGNED)) AS maximo
         FROM \`${tabla}\`
        WHERE \`${columna}\` REGEXP ?`,
      [prefijo.length + 1, `^${prefijo}[0-9]+$`],
    );
    return formatearCodigo(prefijo, Number(fila?.maximo ?? 0) + 1, ancho);
  };
}

/**
 * El `ORDER BY` de los modulos (sin la palabra): por el numero del codigo, de
 * modo que MOD-02 va antes que MOD-10. Ya no hay una columna de orden que
 * alguien tenga que mantener: con el codigo consecutivo, el orden natural es
 * el del codigo. `modulos.orden_visual` queda en la tabla, sin usarse.
 */
export const ordenModulosSql = (columna = "codigo") =>
  `CAST(REGEXP_SUBSTR(${columna}, '[0-9]+') AS UNSIGNED), ${columna}`;

export const generarCodigoModulo = generadorDeCodigo({
  tabla: "modulos", columna: "codigo", prefijo: "MOD-", ancho: 2,
});

export const generarCodigoOperario = generadorDeCodigo({
  tabla: "operarios", columna: "codigo_operario", prefijo: "OP-", ancho: 3,
});
