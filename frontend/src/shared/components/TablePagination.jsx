import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { TAMANOS_PAGINA } from "../hooks/useListaAdmin";

/**
 * Controles de paginacion de un listado.
 *
 * Antes pintaba un boton por pagina, asi que un listado largo generaba una
 * fila interminable de numeros. Ahora muestra una ventana alrededor de la
 * pagina actual con puntos suspensivos, mas el tamano de pagina.
 */
const PUNTOS = "...";

/** [1, "...", 4, 5, 6, "...", 20] */
function ventana(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, indice) => indice + 1);

  const paginas = new Set([1, totalPages, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((numero) => paginas.add(numero));
  if (page >= totalPages - 2) {
    [totalPages - 1, totalPages - 2, totalPages - 3].forEach((numero) => paginas.add(numero));
  }

  const ordenadas = Array.from(paginas)
    .filter((numero) => numero >= 1 && numero <= totalPages)
    .sort((a, b) => a - b);

  return ordenadas.reduce((resultado, numero, indice) => {
    if (indice > 0 && numero - ordenadas[indice - 1] > 1) resultado.push(`${PUNTOS}${numero}`);
    resultado.push(numero);
    return resultado;
  }, []);
}

export function TablePagination({
  page = 1,
  totalPages = 1,
  total = 0,
  pageSize = 10,
  label = "registros",
  onPageChange,
  onPageSizeChange,
  loading = false,
}) {
  const desde = total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
  const hasta = Math.min(page * pageSize, total);
  const irA = (destino) => onPageChange?.(Math.min(Math.max(1, destino), totalPages));

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-500">
          {loading ? (
            "Cargando registros..."
          ) : total === 0 ? (
            `Sin ${label}`
          ) : (
            <>
              Mostrando <span className="font-medium text-gray-700">{desde}</span>–
              <span className="font-medium text-gray-700">{hasta}</span> de{" "}
              <span className="font-medium text-gray-700">{total}</span> {label}
            </>
          )}
        </p>

        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-xs text-gray-400">
            Por pagina
            <select
              value={pageSize}
              onChange={(evento) => onPageSizeChange(Number(evento.target.value))}
              className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#433A9B]/30"
            >
              {TAMANOS_PAGINA.map((tamano) => (
                <option key={tamano} value={tamano}>
                  {tamano}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => irA(1)}
            disabled={page <= 1}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
            type="button"
            aria-label="Primera pagina"
          >
            <ChevronsLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => irA(page - 1)}
            disabled={page <= 1}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
            type="button"
            aria-label="Pagina anterior"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>

          {ventana(page, totalPages).map((entrada) =>
            typeof entrada === "number" ? (
              <button
                key={entrada}
                onClick={() => irA(entrada)}
                aria-current={page === entrada ? "page" : undefined}
                className={`h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors ${
                  page === entrada ? "bg-[#433A9B] text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                type="button"
              >
                {entrada}
              </button>
            ) : (
              <span key={entrada} className="px-1 text-sm text-gray-300">
                {PUNTOS}
              </span>
            ),
          )}

          <button
            onClick={() => irA(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
            type="button"
            aria-label="Pagina siguiente"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => irA(totalPages)}
            disabled={page >= totalPages}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 disabled:opacity-30"
            type="button"
            aria-label="Ultima pagina"
          >
            <ChevronsRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}
