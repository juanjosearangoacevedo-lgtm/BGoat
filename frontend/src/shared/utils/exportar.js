/**
 * Exportacion de listados a CSV (lo abre Excel directamente).
 *
 * Trabaja con la misma definicion de columnas que usa DataTable, asi que un
 * modulo no necesita declarar dos veces que campos muestra:
 *
 *   exportarCSV({
 *     filas: lista.filtrados,
 *     columnas,                 // [{ key, header, exportar(fila) }]
 *     archivo: "clientes",
 *   })
 *
 * Se usa `;` como separador porque Excel en configuracion regional es-CO
 * espera punto y coma, y se antepone el BOM para que respete las tildes.
 */
const SEPARADOR = ";";
const BOM = "\uFEFF";

/** Columnas que no tienen sentido en un archivo (acciones, avatares, etc.). */
function esExportable(columna) {
  return columna?.exportable !== false && !String(columna?.key || "").startsWith("__");
}

/**
 * Texto plano de una celda.
 *
 * Prioriza `exportar`, luego el `render` de la columna cuando devuelve texto
 * (columnas calculadas como "Nombre completo" no tienen campo propio en la
 * fila) y por ultimo el valor crudo. Lo que renderiza JSX se ignora.
 */
function esPrimitivo(valor) {
  return typeof valor === "string" || typeof valor === "number" || typeof valor === "boolean";
}

function valorDeCelda(columna, fila) {
  if (typeof columna.exportar === "function") return columna.exportar(fila);

  if (typeof columna.render === "function") {
    try {
      const renderizado = columna.render(fila);
      if (esPrimitivo(renderizado)) return renderizado;
    } catch {
      // Una columna que necesita contexto de React cae al valor crudo.
    }
  }

  const valor = fila?.[columna.key];
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") return JSON.stringify(valor);
  return valor;
}

/** Escapa comillas y envuelve el valor para que un `;` interno no rompa la fila. */
function escapar(valor) {
  const texto = String(valor ?? "").replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${texto}"`;
}

export function construirCSV({ filas = [], columnas = [] }) {
  const usables = columnas.filter(esExportable);

  const encabezado = usables.map((columna) => escapar(columna.header ?? columna.key));
  const cuerpo = filas.map((fila) => usables.map((columna) => escapar(valorDeCelda(columna, fila))));

  return [encabezado, ...cuerpo].map((linea) => linea.join(SEPARADOR)).join("\r\n");
}

/** Marca de tiempo para el nombre del archivo: clientes-2026-08-25.csv */
function sello() {
  return new Date().toISOString().slice(0, 10);
}

export function descargarArchivo(contenido, nombre, tipo = "text/csv;charset=utf-8;") {
  if (typeof document === "undefined") return;

  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");

  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);

  // El navegador necesita un instante antes de soltar el objeto.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportarCSV({ filas = [], columnas = [], archivo = "export" }) {
  if (filas.length === 0) return 0;

  descargarArchivo(BOM + construirCSV({ filas, columnas }), `${archivo}-${sello()}.csv`);
  return filas.length;
}
