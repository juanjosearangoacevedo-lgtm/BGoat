import { LayoutGrid, List, Table2 } from "lucide-react";
import { MODOS } from "../hooks/useViewMode";

/** Cambio entre tarjetas, lista compacta y tabla. */
const definiciones = {
  [MODOS.TARJETAS]: { icono: LayoutGrid, label: "Tarjetas" },
  [MODOS.LISTA]: { icono: List, label: "Lista" },
  [MODOS.TABLA]: { icono: Table2, label: "Tabla" },
};

export function ViewToggle({ modo, onChange, opciones = [MODOS.TARJETAS, MODOS.LISTA, MODOS.TABLA] }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5" role="group">
      {opciones.map((opcion) => {
        const definicion = definiciones[opcion];
        if (!definicion) return null;
        const Icono = definicion.icono;
        const activo = modo === opcion;

        return (
          <button
            key={opcion}
            type="button"
            onClick={() => onChange?.(opcion)}
            title={`Ver como ${definicion.label.toLowerCase()}`}
            aria-pressed={activo}
            className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
              activo ? "bg-[#0F4C3F] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Icono className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{definicion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
