import { useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
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
 * Si todavia no se conoce el detalle por talla (la hoja del cliente no
 * lo trae el primer dia), se puede agregar una sola fila con la cantidad
 * total y dejar talla y color en blanco -son opcionales en la base- para
 * completarlos despues.
 *
 * Reemplaza a `prendas`, que armaba un SKU con talla + color + tipo y
 * obligaba a crear un registro por combinacion antes de poder usarla.
 */
const filaVacia = { id_talla: "", id_color: "", cantidad: "" };

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
  const nombreColor = (id) => colorOptions.find((o) => String(o.value) === String(id))?.label;

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
    const cantidad = Number(borrador.cantidad || 0);
    if (cantidad <= 0) return;

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
          Todavia no hay filas. Agrega al menos una: si no conoces el detalle por talla y color
          todavia, puedes poner solo la cantidad total y dejar talla y color en blanco.
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
                  {nombreTalla(fila.id_talla) || "Sin talla"} · {nombreColor(fila.id_color) || "Sin color"}
                </span>
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
        description="Talla y color son opcionales si todavia no los sabes; la cantidad si hace falta."
        onClose={() => setModalAbierto(false)}
        footer={
          <>
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={Number(borrador.cantidad || 0) <= 0}
              onClick={guardarFila}
              className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Talla</label>
              <select
                value={borrador.id_talla}
                onChange={(evento) => setBorrador((previo) => ({ ...previo, id_talla: evento.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-[#0F4C3F]"
              >
                <option value="">Sin talla</option>
                {tallaOptions.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Color</label>
              <select
                value={borrador.id_color}
                onChange={(evento) => setBorrador((previo) => ({ ...previo, id_color: evento.target.value }))}
                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-[#0F4C3F]"
              >
                <option value="">Sin color</option>
                {colorOptions.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Cantidad</label>
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
