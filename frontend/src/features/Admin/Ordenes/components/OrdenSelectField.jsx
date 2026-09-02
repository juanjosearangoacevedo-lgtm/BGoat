import { AlertCircle } from "lucide-react";
import { Label } from "@/shared/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";

/**
 * Select de apoyo del formulario de ordenes.
 * Acepta tanto strings como objetos { value, label } para soportar la relación
 * de lote y ficha tecnica con su valor real en la base de datos.
 */
export function OrdenSelectField({
  label,
  placeholder,
  value,
  onChange,
  options = [],
  error,
  required = false,
}) {
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );

  return (
    <div className="space-y-2">
      {label ? (
        <Label className="flex items-center gap-1">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true" title="Campo obligatorio">
              *
            </span>
          )}
        </Label>
      ) : null}
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger aria-invalid={Boolean(error)} className={error ? "border-red-400" : ""}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-gray-400">Sin datos disponibles</div>
          ) : (
            normalizedOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
