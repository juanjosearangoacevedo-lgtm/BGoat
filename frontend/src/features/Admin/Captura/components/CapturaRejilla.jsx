import { Check, Lock, Plus, Timer } from "lucide-react";
import { formatNumero } from "@/shared/utils/formatters";

/** Color de la celda segun el cumplimiento contra el umbral del modulo. */
function tonoCelda(celda, umbral) {
  if (!celda) return "border-dashed border-gray-200 bg-gray-50 text-gray-300 hover:border-[#0F4C3F]/40";

  const cumplimiento = Number(celda.cumplimiento || 0);
  if (celda.unidades_producidas === 0) return "border-red-200 bg-red-50 text-red-600";
  if (cumplimiento >= umbral) return "border-green-200 bg-green-50 text-green-700";
  if (cumplimiento >= umbral * 0.7) return "border-[#D08E10]/40 bg-[#D08E10]/10 text-[#b46a12]";
  return "border-red-200 bg-red-50 text-red-600";
}

/** "6:00am - 7:00am" -> "6:00" para que quepa en el encabezado. */
function horaCorta(franja) {
  return String(franja.hora_inicio || "").slice(0, 5);
}

/**
 * La rejilla: filas = modulos, columnas = franjas de la jornada.
 * Es el tablero fisico de toda la planta en una sola pantalla.
 *
 * Las franjas vienen del backend porque no todas duran lo mismo: la
 * ultima de martes a viernes son 40 minutos y la del sabado 20. El
 * encabezado marca las que no son de 60 para que se vea por que su meta
 * es mas baja.
 */
export function CapturaRejilla({
  rejilla,
  onAbrirCelda,
  soloLectura = false,
  onVerModulo,
  onAbrirJornada,
  pendientes = [],
  moduloDestacado = null,
}) {
  if (!rejilla) return null;

  const franjas = rejilla.jornada?.franjas ?? [];
  const { modulos } = rejilla;

  // Las franjas que el backend marco como vencidas y sin registrar: son
  // las que el recordatorio esta reclamando, y se resaltan en la rejilla
  // para que se vea DONDE esta el hueco y no solo cuantos hay.
  const reclamadas = new Set(pendientes.map((p) => `${p.id_modulo}|${p.hora_jornada}`));

  if (franjas.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
        <Timer className="mx-auto mb-3 h-8 w-8 text-gray-300" />
        <p className="font-medium text-gray-700">Este dia no tiene jornada configurada</p>
        <p className="mt-1 text-sm text-gray-400">
          La planta no trabaja este dia. El horario se define en las jornadas.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="sticky left-0 z-10 min-w-44 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Modulo
              </th>
              {franjas.map((franja) => (
                <th
                  key={franja.orden_franja}
                  title={`${franja.etiqueta} · ${franja.minutos} minutos`}
                  className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  <div>{horaCorta(franja)}</div>
                  <div
                    className={`mt-0.5 text-[10px] font-normal normal-case ${
                      franja.minutos === 60 ? "text-gray-300" : "text-[#D08E10]"
                    }`}
                  >
                    {franja.minutos} min
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Dia
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {modulos.map((modulo) => {
              const umbral = Number(modulo.umbral_cumplimiento || 85);

              // Sin jornada no hay nada que capturar: el modulo aparece en
              // gris con la salida obvia --abrirla-- en vez de celdas que
              // al tocarlas darian un error.
              if (!modulo.tiene_jornada) {
                return (
                  <tr key={modulo.id_modulo} className="bg-gray-50/60">
                    <td className="sticky left-0 z-10 bg-gray-50/60 px-4 py-3">
                      <span className="font-semibold text-gray-500">{modulo.codigo}</span>
                      <div className="truncate text-xs text-gray-400">Sin jornada</div>
                    </td>
                    <td colSpan={franjas.length + 1} className="px-4 py-3">
                      <button
                        type="button"
                        disabled={soloLectura}
                        onClick={() => onAbrirJornada?.(modulo)}
                        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-[#0F4C3F] hover:text-[#0F4C3F] disabled:cursor-default disabled:hover:border-gray-300 disabled:hover:text-gray-500"
                      >
                        <Lock className="h-4 w-4" />
                        Abrir la jornada de este modulo para poder registrar
                      </button>
                    </td>
                  </tr>
                );
              }

              // El modulo del que se viene (recien abierta su jornada) se
              // marca: en una planta de 12 filas, encontrar la propia es
              // lo primero que hay que hacer y no deberia costar nada.
              const destacado = String(moduloDestacado) === String(modulo.id_modulo);

              return (
                <tr
                  key={modulo.id_modulo}
                  className={destacado ? "bg-[#0F4C3F]/5" : "hover:bg-gray-50/40"}
                >
                  <td
                    className={`sticky left-0 z-10 px-4 py-3 ${
                      destacado ? "bg-[#0F4C3F]/5" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onVerModulo?.(modulo)}
                      className="text-left font-semibold text-gray-900 hover:text-[#0F4C3F] hover:underline"
                    >
                      {modulo.codigo}
                    </button>
                    <div className="truncate text-xs text-gray-400">
                      {modulo.jornada?.nombre_cliente
                        ? `${modulo.jornada.nombre_cliente} · ${modulo.jornada.codigo_lote} · SAM ${modulo.sam_sugerido ?? "—"}`
                        : "Sin lote"}
                    </div>
                  </td>

                  {franjas.map((franja) => {
                    const celda = modulo.celdas?.[franja.orden_franja];
                    const reclamada =
                      !celda && reclamadas.has(`${modulo.id_modulo}|${franja.orden_franja}`);

                    return (
                      <td key={franja.orden_franja} className="px-1 py-2 text-center">
                        <button
                          type="button"
                          disabled={soloLectura}
                          onClick={() => onAbrirCelda?.(modulo, franja)}
                          title={
                            celda
                              ? `${franja.etiqueta}: ${celda.unidades_producidas} de ` +
                                `${Math.round(celda.meta_hora)} · ${celda.cumplimiento}%` +
                                (celda.nombre_causa ? ` · ${celda.nombre_causa}` : "")
                              : `Registrar ${franja.etiqueta}`
                          }
                          className={`relative flex h-14 w-16 flex-col items-center justify-center rounded-lg border-2 text-sm transition-all disabled:cursor-default ${tonoCelda(
                            celda,
                            umbral,
                          )} ${soloLectura ? "" : "hover:shadow-sm"} ${
                            reclamada
                              ? "animate-pulse border-solid border-[#D08E10] bg-[#D08E10]/10 text-[#b46a12]"
                              : ""
                          }`}
                        >
                          {celda ? (
                            <>
                              <span className="text-base font-bold leading-none">
                                {celda.unidades_producidas}
                              </span>
                              <span className="mt-0.5 text-[10px] leading-none opacity-70">
                                /{Math.round(celda.meta_hora)} · {Math.round(celda.cumplimiento)}%
                              </span>
                              {celda.minutos_perdidos > 0 && (
                                <span
                                  className="absolute -right-1 -top-1 rounded-full bg-[#0F4C3F] px-1 text-[9px] font-bold leading-tight text-white"
                                  title={`${celda.minutos_perdidos} minutos perdidos`}
                                >
                                  {celda.minutos_perdidos}
                                </span>
                              )}
                            </>
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  <td className="px-4 py-3 text-right">
                    <div className="font-semibold text-gray-900">
                      {formatNumero(modulo.resumen.unidades_producidas)}
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        /{formatNumero(Math.round(modulo.resumen.meta_dia))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {modulo.resumen.eficiencia}% ef.
                      {modulo.resumen.franjas_pendientes > 0 && (
                        <span className="ml-1 text-[#D08E10]">
                          · {modulo.resumen.franjas_pendientes} pend.
                        </span>
                      )}
                      {modulo.resumen.franjas_pendientes === 0 && (
                        <Check className="ml-1 inline h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
