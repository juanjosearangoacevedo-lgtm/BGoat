import { useState } from "react";
import { Check, ChevronDown, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Modal } from "@/shared/components/Modal";
import { formatNumero } from "@/shared/utils/formatters";

/**
 * Desglose del lote por talla y color -> tabla `lote_detalle_talla_color`.
 *
 * Ya no es un campo aparte de "Cantidad programada": la cantidad ES la
 * suma de estas filas (German lo pidio asi -- cantidad, talla y color se
 * cargan juntos, no por separado). Por eso esta disponible desde que se
 * crea el lote, no solo al editarlo: antes de que el lote exista no hay
 * donde guardar las filas en la base, asi que viven en memoria aqui y
 * las sube el formulario del lote junto con el resto, igual que ya hacia
 * con la ficha tecnica.
 *
 * Cada fila exige talla, color y cantidad. German: "Toda produccion,
 * sin excepcion, se trabaja por talla y color. NO SE TRABAJA NADA SIN
 * TALLA". La suma de las filas es la cantidad que se recibio del lote.
 *
 * El color se escoge con su circulo y su codigo, igual que se ve en el
 * modulo Colores: `colorOptions` trae `hex` ademas de `value`/`label`.
 *
 * Reemplaza a `prendas`, que armaba un SKU con talla + color + tipo y
 * obligaba a crear un registro por combinacion antes de poder usarla.
 */
const filaVacia = { id_talla: "", id_color: "", cantidad: "" };

/** El circulo del color. Blanco y claros llevan borde para que se vean. */
function Muestra({ hex, className = "h-4 w-4" }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-shrink-0 rounded-full border border-gray-300 ${className}`}
      style={{ backgroundColor: hex || "transparent" }}
    />
  );
}

/**
 * Lista de colores con su circulo, su nombre y su codigo.
 *
 * Un `<select>` nativo solo sabe pintar texto, por eso es una lista
 * propia. Se despliega dentro del flujo (no flotando) para que el modal
 * no la recorte.
 */
function SelectorColor({ value, options, onChange }) {
  const [abierto, setAbierto] = useState(false);
  const elegido = options.find((opcion) => String(opcion.value) === String(value));

  return (
    <div>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((previo) => !previo)}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 text-left text-sm outline-none focus:border-[#0F4C3F]"
      >
        {elegido ? (
          <>
            <Muestra hex={elegido.hex} />
            <span className="truncate text-gray-800">{elegido.label}</span>
          </>
        ) : (
          <span className="truncate text-gray-400">Elige el color</span>
        )}
        <ChevronDown className="ml-auto h-4 w-4 flex-shrink-0 text-gray-400" />
      </button>

      {abierto && (
        <ul
          role="listbox"
          className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-sm"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-400">No hay colores activos en el modulo Colores</li>
          )}
          {options.map((opcion) => {
            const activo = String(opcion.value) === String(value);
            return (
              <li key={opcion.value} role="option" aria-selected={activo}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opcion.value);
                    setAbierto(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${
                    activo ? "bg-[#0F4C3F]/5" : ""
                  }`}
                >
                  <Muestra hex={opcion.hex} className="h-5 w-5" />
                  <span className="flex-1 text-gray-800">{opcion.label}</span>
                  <span className="font-mono text-xs text-gray-400">{opcion.hex || "—"}</span>
                  {activo && <Check className="h-4 w-4 text-[#0F4C3F]" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function DesgloseTallaColor({
  filas = [],
  tallaOptions = [],
  colorOptions = [],
  error,
  onChange,
}) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [indiceEditando, setIndiceEditando] = useState(null);
  const [borrador, setBorrador] = useState(filaVacia);

  const suma = filas.reduce((total, fila) => total + Number(fila.cantidad || 0), 0);

  const nombreTalla = (id) => tallaOptions.find((o) => String(o.value) === String(id))?.label;
  const colorDe = (id) => colorOptions.find((o) => String(o.value) === String(id));
  const borradorCompleto =
    Boolean(borrador.id_talla) && Boolean(borrador.id_color) && Number(borrador.cantidad || 0) > 0;

  const abrirAgregar = () => {
    setIndiceEditando(null);
    setBorrador(filaVacia);
    setModalAbierto(true);
  };

  const abrirEditar = (indice) => {
    setIndiceEditando(indice);
    setBorrador(filas[indice]);
    setModalAbierto(true);
  };

  const guardarFila = () => {
    if (!borradorCompleto) return;
    const cantidad = Number(borrador.cantidad);

    const fila = { ...borrador, cantidad };
    if (indiceEditando === null) {
      onChange?.([...filas, fila]);
    } else {
      onChange?.(filas.map((f, i) => (i === indiceEditando ? fila : f)));
    }
    setModalAbierto(false);
  };

  const quitarFila = (indice) => {
    onChange?.(filas.filter((_, i) => i !== indice));
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
          <Layers className="h-4 w-4" />
          Talla y color
        </span>
        <span className="text-sm font-bold text-[#0F4C3F]">
          {formatNumero(suma)} {suma === 1 ? "unidad" : "unidades"}
        </span>
      </div>

      {filas.length === 0 ? (
        <p className="mb-3 text-sm text-gray-400">
          Todavia no hay filas. Agrega una por cada talla y color que trae el lote: la suma es la
          cantidad de prendas recibidas.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          {filas.map((fila, indice) => (
            <div
              key={indice}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-sm"
            >
              <button
                type="button"
                onClick={() => abrirEditar(indice)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate text-gray-700">
                  {nombreTalla(fila.id_talla) || "Sin talla"}
                </span>
                <span className="text-gray-300">·</span>
                {colorDe(fila.id_color) ? (
                  <span className="flex min-w-0 items-center gap-1.5 text-gray-700">
                    <Muestra hex={colorDe(fila.id_color).hex} />
                    <span className="truncate">{colorDe(fila.id_color).label}</span>
                  </span>
                ) : (
                  <span className="text-red-500">Sin color</span>
                )}
              </button>
              <span className="flex-shrink-0 font-semibold text-gray-900">
                {formatNumero(fila.cantidad)}
              </span>
              <button
                type="button"
                onClick={() => quitarFila(indice)}
                aria-label={`Quitar la fila ${indice + 1}`}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="button" size="sm" variant="outline" onClick={abrirAgregar}>
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar fila
      </Button>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <Modal
        open={modalAbierto}
        icon={Layers}
        title={indiceEditando === null ? "Agregar fila" : "Editar fila"}
        description="Cada fila lleva talla, color y cantidad: no se trabaja nada sin talla ni color."
        onClose={() => setModalAbierto(false)}
        footer={
          <>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!borradorCompleto}
              onClick={guardarFila}
              className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-start">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Talla <span className="text-red-500">*</span>
              </label>
              <select
                value={borrador.id_talla}
                onChange={(evento) => setBorrador((previo) => ({ ...previo, id_talla: evento.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-[#0F4C3F]"
              >
                <option value="" disabled>
                  Elige la talla
                </option>
                {tallaOptions.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Color <span className="text-red-500">*</span>
              </label>
              <SelectorColor
                value={borrador.id_color}
                options={colorOptions}
                onChange={(idColor) => setBorrador((previo) => ({ ...previo, id_color: idColor }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              autoFocus
              value={borrador.cantidad}
              onChange={(evento) => setBorrador((previo) => ({ ...previo, cantidad: evento.target.value }))}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-[#0F4C3F]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
