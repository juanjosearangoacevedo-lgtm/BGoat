import { Plus, Shirt, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { formatNumero } from "@/shared/utils/formatters";
import { OrdenSelectField } from "./OrdenSelectField";

/**
 * Editor de la tabla `detalle_orden_produccion`: la orden se reparte en
 * prendas (referencia + talla + color) con su cantidad y meta por hora.
 */
export function OrdenDetalleLineas({
  detalle = [],
  prendaOptions = [],
  cantidadProgramada = 0,
  total = 0,
  onAdd,
  onUpdate,
  onRemove,
  error = "",
}) {
  const descuadre = Number(cantidadProgramada || 0) > 0 && total !== Number(cantidadProgramada);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-bold text-gray-900">
            <Shirt className="h-4 w-4 text-[#433A9B]" />
            Detalle por prenda
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Distribucion de la orden por talla y color (tabla detalle_orden_produccion).
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar prenda
        </Button>
      </div>

      {error && (
        <p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {detalle.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
          Sin prendas agregadas. La orden necesita al menos una para poder registrar produccion.
        </p>
      ) : (
        <div className="space-y-3">
          {detalle.map((linea, index) => (
            <div key={index} className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
              <div className="md:col-span-6">
                <OrdenSelectField
                  label={index === 0 ? "Prenda (SKU)" : ""}
                  placeholder="Seleccionar prenda"
                  value={linea.id_prenda}
                  onChange={(value) => onUpdate(index, "id_prenda", value)}
                  options={prendaOptions}
                />
              </div>
              <div className="md:col-span-5">
                {index === 0 && <p className="mb-2 text-sm font-medium text-gray-700">Cantidad</p>}
                <Input
                  type="number"
                  min="1"
                  value={linea.cantidad_programada}
                  onChange={(event) => onUpdate(index, "cantidad_programada", event.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onRemove(index)}
                  aria-label="Quitar prenda"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="text-gray-500">Total del detalle</span>
        <span className={`font-bold ${descuadre ? "text-[#b46a12]" : "text-gray-800"}`}>
          {formatNumero(total)}
          {Number(cantidadProgramada || 0) > 0 && ` / ${formatNumero(cantidadProgramada)}`}
        </span>
      </div>

      {descuadre && (
        <p className="mt-1 text-right text-xs text-[#b46a12]">
          El detalle no coincide con la cantidad programada de la orden.
        </p>
      )}
    </div>
  );
}
