import { AlertCircle } from "lucide-react";
import { Input } from "./input";
import { Label } from "./label";

/**
 * Campo de formulario con label, ayuda, marca de obligatorio y error.
 *
 * `options` acepta dos formas:
 *   - strings: para los ENUM de la base (["ACTIVO", "INACTIVO"]).
 *   - objetos { value, label }: para llaves foraneas, donde `value` es el id
 *     que viaja a la base y `label` lo que ve el usuario.
 *
 * `type="textarea"` renderiza un area de texto; el resto son inputs nativos.
 */
const claseError = "border-red-400 focus-visible:ring-red-300";

export function FormField({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
  hint,
  options,
  disabled = false,
  emptyOption,
  required = false,
  rows = 3,
  min,
  max,
  step,
  autoFocus = false,
}) {
  const normalizedOptions = options?.map((option) =>
    typeof option === "object" && option !== null ? option : { value: option, label: option },
  );

  const idAyuda = hint || error ? `${label}-ayuda` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <Label className="flex items-center gap-1">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true" title="Campo obligatorio">
              *
            </span>
          )}
        </Label>
      )}

      {normalizedOptions ? (
        <select
          value={value ?? ""}
          disabled={disabled}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={idAyuda}
          className={`h-10 w-full rounded-lg border bg-white px-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F4C3F]/30 disabled:bg-gray-50 ${
            error ? claseError : "border-gray-200"
          }`}
        >
          {emptyOption && <option value="">{emptyOption}</option>}
          {normalizedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          rows={rows}
          value={value ?? ""}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={idAyuda}
          className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F4C3F]/30 disabled:bg-gray-50 ${
            error ? claseError : "border-gray-200"
          }`}
        />
      ) : (
        <Input
          type={type}
          value={value ?? ""}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          onChange={(event) => onChange?.(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={idAyuda}
          className={error ? claseError : ""}
        />
      )}

      {error ? (
        <p id={idAyuda} className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={idAyuda} className="text-xs text-gray-400">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
