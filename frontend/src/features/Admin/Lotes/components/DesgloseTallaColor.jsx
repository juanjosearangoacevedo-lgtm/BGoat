import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { formatNumero } from "@/shared/utils/formatters";

/**
 * Desglose del lote por talla y color -> tabla `lote_detalle_talla_color`.
 *
 * Va COLAPSADO por defecto y es opcional a proposito: el negocio todavia
 * no decide si lo va a usar, y a veces la hoja del cliente no lo trae.
 * Dejarlo vacio no bloquea el guardado del lote --la produccion se mide
 * por lote, no por talla-- y abrirlo cerrado mantiene el formulario
 * corto para el caso normal.
 *
 * Reemplaza a `prendas`, que armaba un SKU con talla + color + tipo y
 * obligaba a crear un registro por combinacion antes de poder usarla.
 */
const filaVacia = { id_talla: "", id_color: "", cantidad: "" };

export function DesgloseTallaColor({
  lote,
  desglose = [],
  tallaOptions = [],
  colorOptions = [],
  guardando = false,
  cantidadProgramada = 0,
  onGuardar,
}) {
  const [abierto, setAbierto] = useState(false);
  const [filas, setFilas] = useState([]);

  // El desglose llega despues que el lote (es otra peticion): se copia al
  // estado local cuando cambia, para poder editarlo sin guardar aun.
  useEffect(() => {
    setFilas(
      desglose.map((entrada) => ({
        id_talla: entrada.id_talla ?? "",
        id_color: entrada.id_color ?? "",
        cantidad: entrada.cantidad ?? "",
      })),
    );
    // Si el lote ya trae desglose, se abre solo: es informacion que ya
    // existe y esconderla obligaria a descubrirla por accidente.
    if (desglose.length > 0) setAbierto(true);
  }, [desglose]);

  if (!lote) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
        El desglose por talla y color se agrega despues de crear el lote.
      </p>
    );
  }

  const cambiar = (indice, campo, valor) =>
    setFilas((previo) =>
      previo.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila)),
    );

  const suma = filas.reduce((total, fila) => total + Number(fila.cantidad || 0), 0);
  const programada = Number(cantidadProgramada || 0);
  const excede = programada > 0 && suma > programada;

  return (
    <div className="rounded-2xl border border-gray-200">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
          {abierto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          Desglose por talla y color
          <span className="font-normal normal-case tracking-normal text-gray-400">(opcional)</span>
        </span>
        <span className="text-xs text-gray-500">
          {filas.length === 0
            ? "Sin desglose"
            : `${filas.length} filas · ${formatNumero(suma)} unidades`}
        </span>
      </button>

      {abierto && (
        <div className="space-y-3 border-t border-gray-100 p-4">
          {filas.length === 0 && (
            <p className="text-sm text-gray-400">
              Todavia no hay desglose. El lote se produce igual: esto solo sirve para saber
              despues cuantas unidades salieron de cada talla.
            </p>
          )}

          {filas.map((fila, indice) => (
            <div key={indice} className="flex items-center gap-2">
              <select
                value={fila.id_talla}
                onChange={(evento) => cambiar(indice, "id_talla", evento.target.value)}
                aria-label={`Talla de la fila ${indice + 1}`}
                className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 text-sm outline-none focus:border-[#0F4C3F]"
              >
                <option value="">Talla</option>
                {tallaOptions.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <select
                value={fila.id_color}
                onChange={(evento) => cambiar(indice, "id_color", evento.target.value)}
                aria-label={`Color de la fila ${indice + 1}`}
                className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-2 text-sm outline-none focus:border-[#0F4C3F]"
              >
                <option value="">Color</option>
                {colorOptions.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0}
                placeholder="Cantidad"
                value={fila.cantidad}
                onChange={(evento) => cambiar(indice, "cantidad", evento.target.value)}
                aria-label={`Cantidad de la fila ${indice + 1}`}
                className="h-10 w-28 rounded-xl border border-gray-200 px-2 text-sm outline-none focus:border-[#0F4C3F]"
              />

              <button
                type="button"
                onClick={() => setFilas((previo) => previo.filter((_, i) => i !== indice))}
                aria-label={`Quitar la fila ${indice + 1}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {excede && (
            <p className="text-sm font-medium text-red-600">
              El desglose suma {formatNumero(suma)} y el lote programa {formatNumero(programada)}.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setFilas((previo) => [...previo, { ...filaVacia }])}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Agregar fila
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={guardando || excede}
              onClick={() => onGuardar?.(lote.id_lote, filas)}
              className="bg-[#D08E10] text-white hover:bg-[#B67F14]"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {guardando ? "Guardando..." : "Guardar desglose"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
