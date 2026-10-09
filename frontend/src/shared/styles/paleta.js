/**
 * La paleta para JavaScript: graficos (recharts), estilos en linea y SVG.
 *
 * No repite ningun valor: cada color es `var(--nombre)` y el valor vive solo
 * en `paleta.css`. Cambiar la gama de colores no toca este archivo.
 *
 *   <Line stroke={paleta.marca} />
 *   style={{ color: paleta.dorado }}
 *   transparente(paleta.exito, 10)  -> el color al 10% de opacidad
 */
const nombres = [
  "marca", "marca-oscuro", "marca-letra", "marca-profundo", "marca-texto", "marca-medio", "marca-medio-2",
  "marca-claro", "marca-suave", "salvia", "salvia-claro",
  "exito", "exito-vivo", "exito-anillo", "exito-anillo-claro", "exito-barra",
  "dorado", "dorado-hover", "dorado-texto", "dorado-oscuro", "dorado-medio", "dorado-claro",
  "ambar", "ambar-texto", "amarillo", "naranja",
  "peligro", "peligro-vivo", "peligro-fuerte", "peligro-oscuro",
  "tinta", "tinta-2", "tinta-3", "tinta-4", "tinta-5", "texto-suave", "gris",
  "pizarra-1", "pizarra-2", "pizarra-3", "pizarra-4", "pizarra-5", "pizarra-6", "pizarra-7", "pizarra-8",
  "fondo", "blanco", "neutro-25", "neutro-50", "rejilla", "neutro-200", "neutro-400", "neutro-500",
  "neutro-900",
  "linea", "linea-2", "linea-3", "linea-4", "linea-5", "linea-6", "linea-7", "linea-8", "linea-9",
  "linea-10",
  "estado-bien-fondo", "estado-bien-borde", "estado-bien-texto", "estado-bien-barra",
  "estado-medio-fondo", "estado-medio-borde", "estado-medio-barra",
  "estado-mal-fondo", "estado-mal-borde", "estado-mal-texto",
  "anillo-bajo", "anillo-bajo-texto",
];

/** "marca-texto" -> "marcaTexto": asi se escribe `paleta.marcaTexto`. */
const aCamel = (nombre) => nombre.replace(/-(\w)/g, (_, letra) => letra.toUpperCase());

export const paleta = Object.fromEntries(
  nombres.map((nombre) => [aCamel(nombre), `var(--${nombre})`]),
);

/** Un color de la paleta con opacidad: `transparente(paleta.exito, 10)`. */
export const transparente = (color, porcentaje) =>
  `color-mix(in srgb, ${color} ${porcentaje}%, transparent)`;
