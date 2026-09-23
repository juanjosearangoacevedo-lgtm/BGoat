import { formatMoneda, formatNumero } from "@/shared/utils/formatters";

/** Verde sobre el umbral, ambar cerca, rojo debajo. */
function tonoEficiencia(valor, umbral) {
  if (valor === null || valor === undefined) return "text-gray-300";
  if (valor >= umbral) return "text-green-600";
  if (valor >= umbral * 0.7) return "text-[#b46a12]";
  return "text-red-600";
}

function Celda({ children, className = "", titulo }) {
  return (
    <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${className}`} title={titulo}>
      {children}
    </td>
  );
}

/**
 * El tablero del modulo: una fila por franja, las columnas de la hoja.
 *
 * Se muestran TODAS las franjas de la jornada, tambien las que nadie ha
 * capturado. Un hueco en el tablero es informacion —la digitadora se
 * atraso o el modulo estuvo detenido— y esconderlo haria que el dia
 * pareciera completo cuando no lo esta.
 */
export function TableroTabla({ franjas, totales, umbral = 85, onEditarFranja }) {
  const pendientes = franjas.filter((franja) => !franja.registro).length;

  const columnas = [
    { clave: "franja", etiqueta: "Franja", alineacion: "text-left" },
    { clave: "minutos", etiqueta: "Min." },
    { clave: "meta", etiqueta: "Meta" },
    { clave: "uds", etiqueta: "Uds reales" },
    { clave: "ef", etiqueta: "% Efic." },
    { clave: "efac", etiqueta: "% Efic. acum." },
    { clave: "fmeta", etiqueta: "$ Meta" },
    { clave: "freal", etiqueta: "$ Real" },
    { clave: "maquina", etiqueta: "Maquina" },
    { clave: "calidad", etiqueta: "Calidad" },
    { clave: "montaje", etiqueta: "Montaje/insumos" },
    { clave: "total", etiqueta: "Total min." },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {columnas.map((columna) => (
                <th
                  key={columna.clave}
                  className={`whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                    columna.alineacion || "text-right"
                  }`}
                >
                  {columna.etiqueta}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {franjas.map((franja) => {
              const r = franja.registro;

              if (!r) {
                return (
                  <tr
                    key={franja.orden_franja}
                    className="cursor-pointer bg-gray-50/40 text-gray-300 hover:bg-gray-50"
                    onClick={() => onEditarFranja?.(franja)}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-500">
                      {franja.etiqueta}
                    </td>
                    <Celda className="text-gray-400">{franja.minutos}</Celda>
                    <td colSpan={columnas.length - 2} className="px-3 py-2 text-center text-xs">
                      sin capturar
                    </td>
                  </tr>
                );
              }

              const eficiencia = Number(r.eficiencia);
              const perdidos = Number(r.minutos_perdidos_persona);

              return (
                <tr
                  key={franja.orden_franja}
                  className="cursor-pointer hover:bg-gray-50/60"
                  onClick={() => onEditarFranja?.(franja)}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-left font-medium text-gray-900">
                    {franja.etiqueta}
                    {r.nombre_causa && (
                      <span className="ml-2 rounded-md bg-[#D08E10]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#b46a12]">
                        {r.nombre_causa}
                      </span>
                    )}
                  </td>

                  <Celda
                    className={franja.minutos === 60 ? "text-gray-400" : "font-semibold text-[#D08E10]"}
                    titulo={franja.minutos === 60 ? undefined : "Franja mas corta: la meta baja igual"}
                  >
                    {franja.minutos}
                  </Celda>

                  <Celda className="text-gray-500">{formatNumero(Math.round(r.meta_hora))}</Celda>
                  <Celda className="font-semibold text-gray-900">
                    {formatNumero(r.unidades_producidas)}
                  </Celda>

                  <Celda className={`font-semibold ${tonoEficiencia(eficiencia, umbral)}`}>
                    {eficiencia.toFixed(1)}%
                  </Celda>
                  <Celda
                    className={`font-medium ${tonoEficiencia(Number(r.eficiencia_acumulada), umbral)}`}
                  >
                    {Number(r.eficiencia_acumulada).toFixed(1)}%
                  </Celda>

                  <Celda className="text-gray-400">{formatMoneda(r.facturacion_meta)}</Celda>
                  <Celda className="font-medium text-gray-700">
                    {formatMoneda(r.facturacion_real)}
                  </Celda>

                  <Celda className={r.minutos_maquina ? "text-[#b46a12]" : "text-gray-200"}>
                    {r.minutos_maquina || "·"}
                  </Celda>
                  <Celda className={r.minutos_calidad ? "text-[#b46a12]" : "text-gray-200"}>
                    {r.minutos_calidad || "·"}
                  </Celda>
                  <Celda className={r.minutos_montaje ? "text-[#b46a12]" : "text-gray-200"}>
                    {r.minutos_montaje || "·"}
                  </Celda>
                  <Celda
                    className={perdidos ? "font-semibold text-red-600" : "text-gray-200"}
                    titulo={
                      perdidos
                        ? `${r.minutos_perdidos} min de modulo x ${r.personas_presentes} personas`
                        : undefined
                    }
                  >
                    {perdidos || "·"}
                  </Celda>
                </tr>
              );
            })}
          </tbody>

          {/* Fila de cierre: es la que el jefe de produccion mira primero.
              Suma SOLO lo capturado, para que los minutos, la meta y las
              unidades hablen del mismo pedazo de dia. Lo que la jornada
              completa daria esta en la cabecera. */}
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-900">
              <td className="px-3 py-3 text-left">
                Total capturado
                {pendientes > 0 && (
                  <span className="ml-2 text-xs font-normal text-[#D08E10]">
                    {pendientes} {pendientes === 1 ? "franja" : "franjas"} sin capturar
                  </span>
                )}
              </td>
              <Celda className="text-gray-500">
                {franjas.reduce((total, f) => total + (f.registro ? f.minutos : 0), 0)}
              </Celda>
              <Celda className="text-gray-600">
                {formatNumero(Math.round(totales.meta_dia))}
              </Celda>
              <Celda>{formatNumero(totales.unidades_producidas)}</Celda>
              <Celda className={tonoEficiencia(totales.eficiencia, umbral)}>
                {totales.eficiencia.toFixed(1)}%
              </Celda>
              <Celda className="text-gray-300">—</Celda>
              <Celda className="text-gray-500">{formatMoneda(totales.facturacion_meta)}</Celda>
              <Celda>{formatMoneda(totales.facturacion_real)}</Celda>
              <Celda className="text-[#b46a12]">{totales.minutos_maquina || "·"}</Celda>
              <Celda className="text-[#b46a12]">{totales.minutos_calidad || "·"}</Celda>
              <Celda className="text-[#b46a12]">{totales.minutos_montaje || "·"}</Celda>
              <Celda className={totales.minutos_perdidos_persona ? "text-red-600" : "text-gray-300"}>
                {totales.minutos_perdidos_persona || "·"}
              </Celda>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
