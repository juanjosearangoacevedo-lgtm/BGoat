import { Layers } from "lucide-react";

/**
 * Reparto de las unidades BUENAS de la celda por talla y color.
 *
 * Ya no hay un campo suelto de "unidades producidas": el total es la
 * suma de estas filas. Las filas no las inventa la digitadora -son las
 * que el lote ya tiene asignadas en `lote_detalle_talla_color`-, asi que
 * aqui no hay boton de "agregar fila": solo un numero por cada combinacion
 * que el lote definio, con lo que le queda al lado. Al llegar a 0 esa
 * combinacion ya no se puede seguir capturando (ni aqui ni en el backend,
 * que es quien de verdad lo impide).
 *
 * Un lote sin desglose (la hoja del cliente no lo trajo) llega con una
 * sola fila sin talla ni color: se ve igual que el contador de antes.
 */
export function CapturaDesgloseTallaColor({ combos = [], valores = [], onChange }) {
  const cantidadDe = (idTalla, idColor) =>
    valores.find(
      (fila) =>
        String(fila.id_talla ?? "") === String(idTalla ?? "") &&
        String(fila.id_color ?? "") === String(idColor ?? ""),
    )?.cantidad ?? 0;

  const cambiarCantidad = (idTalla, idColor, cantidad, restante) => {
    const limpio = Math.min(Math.max(Number(cantidad) || 0, 0), restante);
    const resto = valores.filter(
      (fila) =>
        !(String(fila.id_talla ?? "") === String(idTalla ?? "") &&
          String(fila.id_color ?? "") === String(idColor ?? "")),
    );
    onChange?.(limpio > 0 ? [...resto, { id_talla: idTalla, id_color: idColor, cantidad: limpio }] : resto);
  };

  const total = valores.reduce((suma, fila) => suma + Number(fila.cantidad || 0), 0);

  if (combos.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-400">
        Este lote no tiene desglose por talla y color: no se puede capturar produccion.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <Layers className="h-3.5 w-3.5" />
          Unidades producidas
        </span>
        <span className="text-xl font-bold text-marca-letra">{total}</span>
      </div>

      <div className="space-y-2">
        {combos.map((combo) => {
          const clave = `${combo.id_talla ?? "x"}-${combo.id_color ?? "x"}`;
          const cantidad = cantidadDe(combo.id_talla, combo.id_color);
          const completo = combo.restante <= 0 && cantidad === 0;
          const etiqueta =
            combo.nombre_talla || combo.nombre_color
              ? [combo.nombre_talla, combo.nombre_color].filter(Boolean).join(" · ")
              : "Sin talla / sin color";

          return (
            <div
              key={clave}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                completo ? "border-gray-100 bg-gray-100/60" : "border-gray-200 bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${completo ? "text-gray-400" : "text-gray-800"}`}>
                  {etiqueta}
                </p>
                <p className="text-xs text-gray-400">
                  {completo ? "Completa" : `Quedan ${combo.restante}`}
                </p>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={combo.restante}
                value={cantidad}
                disabled={completo}
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) =>
                  cambiarCantidad(combo.id_talla, combo.id_color, evento.target.value, combo.restante)
                }
                className={`h-11 w-20 flex-shrink-0 rounded-lg border text-center text-lg font-bold outline-none focus:border-marca ${
                  cantidad > 0
                    ? "border-marca/40 bg-marca/5 text-marca-letra"
                    : "border-gray-200 text-gray-400"
                } ${completo ? "cursor-not-allowed opacity-60" : ""}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
