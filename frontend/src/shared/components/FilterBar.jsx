import { Filter, X } from "lucide-react";
import { Input } from "./input";
import { SearchInput } from "./SearchInput";
import { TODOS } from "../hooks/useListaAdmin";

/**
 * Barra de busqueda + filtros de un listado.
 *
 * Las definiciones son las mismas que recibe `useListaAdmin`, asi que un
 * modulo declara sus filtros una sola vez y esta barra los pinta:
 *
 *   [{ clave, label, tipo: "select" | "fecha" | "texto", opciones, ancho }]
 *
 * Debajo aparecen los filtros activos como etiquetas, cada una con su propia
 * X, para que quede claro por que la lista muestra lo que muestra.
 */
function OpcionesSelect({ definicion }) {
  return (
    <>
      <option value={TODOS}>{definicion.etiquetaTodos || `Todos: ${definicion.label.toLowerCase()}`}</option>
      {(definicion.opciones || []).map((opcion) => {
        const valor = opcion?.value ?? opcion;
        const etiqueta = opcion?.label ?? opcion;
        return (
          <option key={valor} value={valor}>
            {etiqueta}
          </option>
        );
      })}
    </>
  );
}

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = "Buscar...",
  definiciones = [],
  filtros = {},
  onFiltro,
  filtrosActivos = [],
  onLimpiar,
  acciones = null,
  className = "",
}) {
  const mostrarBusqueda = typeof onSearch === "function";

  return (
    <div className={`mb-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {mostrarBusqueda && (
          <SearchInput
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            className="min-w-52 flex-1"
            alto="h-9"
          />
        )}

        {definiciones.map((definicion) => {
          const valor = filtros[definicion.clave] ?? TODOS;

          if (definicion.tipo === "fecha") {
            return (
              <div key={definicion.clave} className="flex items-center gap-1">
                <input
                  type="date"
                  value={valor === TODOS ? "" : valor}
                  title={definicion.label}
                  onChange={(evento) => onFiltro?.(definicion.clave, evento.target.value || TODOS)}
                  className="h-9 rounded-lg border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#433A9B]/30"
                />
              </div>
            );
          }

          if (definicion.tipo === "texto") {
            return (
              <Input
                key={definicion.clave}
                value={valor === TODOS ? "" : valor}
                placeholder={definicion.label}
                onChange={(evento) => onFiltro?.(definicion.clave, evento.target.value || TODOS)}
                className={`h-9 rounded-lg border-gray-200 ${definicion.ancho || "w-40"}`}
              />
            );
          }

          return (
            <select
              key={definicion.clave}
              value={valor}
              title={definicion.label}
              onChange={(evento) => onFiltro?.(definicion.clave, evento.target.value)}
              className={`h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#433A9B]/30 ${
                definicion.ancho || "w-auto"
              }`}
            >
              <OpcionesSelect definicion={definicion} />
            </select>
          );
        })}

        {acciones && <div className="ml-auto flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>

      {filtrosActivos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-50 pt-3">
          <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
            <Filter className="h-3 w-3" />
            Filtros activos
          </span>

          {filtrosActivos.map((activo) => (
            <span
              key={activo.clave}
              className="flex items-center gap-1 rounded-full bg-[#433A9B]/10 py-1 pl-3 pr-1 text-xs font-medium text-[#433A9B]"
            >
              {activo.label}: {activo.texto}
              <button
                type="button"
                onClick={() => onFiltro?.(activo.clave, TODOS)}
                className="rounded-full p-0.5 hover:bg-[#433A9B]/20"
                aria-label={`Quitar filtro ${activo.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          <button
            type="button"
            onClick={onLimpiar}
            className="text-xs font-medium text-gray-400 underline-offset-2 hover:text-[#433A9B] hover:underline"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
