import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportarCSV } from "../utils/exportar";

/**
 * Exportacion del listado a CSV (Excel lo abre directo).
 *
 * Ofrece dos alcances porque no son lo mismo: lo que el usuario esta viendo
 * despues de filtrar, y el total del modulo. Usa las mismas columnas de la
 * tabla, asi que el archivo sale con los encabezados que ya conoce.
 */
export function ExportMenu({
  columnas = [],
  filtrados = [],
  todos = [],
  archivo = "export",
  label = "registros",
  disabled = false,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const alHacerClic = (evento) => {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", alHacerClic);
    return () => document.removeEventListener("mousedown", alHacerClic);
  }, [abierto]);

  const exportar = (filas, descripcion) => {
    setAbierto(false);

    const cantidad = exportarCSV({ filas, columnas, archivo });
    if (cantidad === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    toast.success(`Se exportaron ${cantidad} ${label} (${descripcion})`);
  };

  const hayFiltro = filtrados.length !== todos.length;

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        disabled={disabled || todos.length === 0}
        onClick={() => setAbierto((previo) => !previo)}
        className="flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 transition-colors hover:border-gray-300 disabled:opacity-40"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Exportar</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {abierto && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => exportar(filtrados, "resultados en pantalla")}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#0F4C3F]" />
            <span className="flex-1">
              {hayFiltro ? "Resultados filtrados" : "Registros del listado"}
              <span className="block text-xs text-gray-400">{filtrados.length} filas · CSV</span>
            </span>
          </button>

          {hayFiltro && (
            <button
              type="button"
              onClick={() => exportar(todos, "listado completo")}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-gray-400" />
              <span className="flex-1">
                Todos los registros
                <span className="block text-xs text-gray-400">{todos.length} filas · CSV</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
