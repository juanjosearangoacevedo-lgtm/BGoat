import { Search, X } from "lucide-react";
import { Input } from "./input";

/**
 * Caja de busqueda del panel.
 * La usan la barra de filtros y cualquier listado que solo necesite buscar.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "w-56",
  alto = "h-10",
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        className={`${alto} w-full rounded-lg border-gray-200 pl-9 pr-8`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Limpiar busqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
