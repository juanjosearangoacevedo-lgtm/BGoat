/**
 * El orden de las tallas, que ya no se digita.
 *
 * Antes cada talla traia un "orden en pantalla" que alguien tenia que escribir
 * (y que dejaba una talla nueva donde cayera). Ahora el orden sale del nombre,
 * con el mismo criterio con que estaba cargado el catalogo (adulto, numerica,
 * bebes y ninos):
 *
 *   1. letras:                  XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
 *                               (XXS/XXL/XXXL son otra forma de 2XS/2XL/3XL)
 *   2. numericas de adulto:     26, 28 ... 42   (de 18 en adelante)
 *   3. bebes con T:             1T, 2T ... 5T
 *   4. numericas de ninos:      6, 8 ... 16    (menores de 18)
 *   5. cualquier otra:          al final, por orden alfabetico
 *
 * Es una expresion de ORDER BY, no una columna: una talla nueva queda en su
 * lugar sin que nadie la acomode. La columna `orden_visual` sigue en la tabla,
 * sin usarse.
 */
export const ESCALA_DE_LETRAS = ["3XS", "2XS", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL", "6XL"];

/** El pedazo de `ORDER BY` (sin la palabra) para ordenar tallas por `columna`. */
export function ordenTallasSql(columna = "nombre") {
  const nombre = `UPPER(TRIM(${columna}))`;
  const letra = `REPLACE(REPLACE(REPLACE(REPLACE(${nombre}, 'XXXS', '3XS'), 'XXXL', '3XL'), 'XXS', '2XS'), 'XXL', '2XL')`;
  const escala = `FIELD(${letra}, ${ESCALA_DE_LETRAS.map((talla) => `'${talla}'`).join(", ")})`;

  return [
    `CASE WHEN ${escala} > 0 THEN 1
          WHEN ${nombre} REGEXP '^[0-9]+$' AND CAST(${nombre} AS UNSIGNED) >= 18 THEN 2
          WHEN ${nombre} REGEXP '^[0-9]+T$' THEN 3
          WHEN ${nombre} REGEXP '^[0-9]+$' THEN 4
          ELSE 5 END`,
    escala,
    `CAST(REGEXP_SUBSTR(${nombre}, '^[0-9]+') AS UNSIGNED)`,
    nombre,
  ].join(", ");
}
