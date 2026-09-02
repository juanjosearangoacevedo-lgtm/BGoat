import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { EmptyState } from "./EmptyState";

/**
 * Tabla generica del panel administrativo.
 *
 * columns: [{
 *   key, header, align, render(row), className, headerClassName,
 *   sortable      -> habilita el orden por esa columna
 *   sortKey       -> campo real por el que ordenar (por defecto `key`)
 *   sortValue(row)-> valor a medida para ordenar (fechas compuestas, totales)
 *   exportable    -> false para dejarla fuera del CSV
 *   oculta        -> true para no renderizarla (columnas condicionales)
 * }]
 *
 * El orden lo controla quien la usa (normalmente `useListaAdmin`), de modo que
 * la misma seleccion sirva para la tabla, la exportacion y la paginacion.
 */
function alineacion(align) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

function IconoOrden({ activo, direccion }) {
  if (!activo) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
  return direccion === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />;
}

/** Filas grises mientras llega la respuesta: evita el salto de layout. */
function Skeleton({ columnas, filas = 5 }) {
  return Array.from({ length: filas }, (_, fila) => (
    <tr key={`skeleton-${fila}`} className="animate-pulse">
      {columnas.map((columna) => (
        <td key={columna.key} className="px-4 py-4">
          <div className="h-3 rounded-full bg-gray-100" style={{ width: `${45 + ((fila * 17) % 45)}%` }} />
        </td>
      ))}
    </tr>
  ));
}

export function DataTable({
  columns = [],
  rows = [],
  loading = false,
  rowKey = "id",
  empty,
  orden = null,
  onOrdenar,
  onRowClick,
  footer = null,
  className = "",
}) {
  const columnas = columns.filter((columna) => !columna.oculta);
  const vacia = !loading && rows.length === 0;

  return (
    <div className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      <div className="scroll-suave overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {columnas.map((columna) => {
                const campo = columna.sortKey || columna.key;
                const ordenable = Boolean(columna.sortable && onOrdenar);
                const activo = orden?.campo === campo;

                return (
                  <th
                    key={columna.key}
                    aria-sort={activo ? (orden.direccion === "desc" ? "descending" : "ascending") : "none"}
                    className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 ${alineacion(
                      columna.align,
                    )} ${columna.headerClassName || ""}`}
                  >
                    {ordenable ? (
                      <button
                        type="button"
                        onClick={() => onOrdenar(campo)}
                        title={`Ordenar por ${columna.header}`}
                        className={`inline-flex items-center gap-1.5 transition-colors hover:text-[#433A9B] ${
                          activo ? "text-[#433A9B]" : ""
                        }`}
                      >
                        <span>{columna.header}</span>
                        <IconoOrden activo={activo} direccion={orden?.direccion} />
                      </button>
                    ) : (
                      columna.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading && <Skeleton columnas={columnas} />}

            {!loading &&
              rows.map((row, index) => (
                <tr
                  key={row[rowKey] ?? index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors hover:bg-gray-50/50 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columnas.map((columna) => (
                    <td
                      key={columna.key}
                      className={`px-4 py-4 text-sm text-gray-600 ${alineacion(columna.align)} ${
                        columna.className || ""
                      }`}
                    >
                      {columna.render ? columna.render(row) : row[columna.key]}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {vacia && (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title || "No hay registros"}
          description={empty?.description || "Ajusta la busqueda o los filtros para ver resultados."}
          action={empty?.action}
        />
      )}

      {footer}
    </div>
  );
}
