import { useCallback } from "react";
import { BellRing, CalendarDays, ClipboardList, PlayCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { useRecordatorioHora } from "@/shared/hooks/useRecordatorioHora";
import { formatMoneda, formatNumero, hoyLocal } from "@/shared/utils/formatters";
import { CapturaCeldaModal } from "../components/CapturaCeldaModal";
import { CapturaRejilla } from "../components/CapturaRejilla";
import { useCapturaPage } from "../hooks/useCapturaPage";

/**
 * Captura de produccion.
 *
 * Reemplaza el tablero de la pared: la digitadora recorre la planta y va
 * llenando una celda por modulo y franja. El sistema hace la meta, el
 * porcentaje y los pesos, que hoy ella calcula a mano unas 200 veces al dia.
 *
 * Cada hora que se cierra y queda sin registrar dispara el recordatorio.
 * Es la unica parte del sistema que interrumpe a la digitadora, y lo hace
 * por una razon: el tablero de pared se llenaba porque estaba a la vista;
 * una pantalla que hay que acordarse de abrir se queda vacia.
 */
export function CapturaPage({ onNavigate, moduloInicial = null, fechaInicial = null }) {
  const {
    fecha,
    setFecha,
    esHoy,
    rejilla,
    jornada,
    cargando,
    error,
    resumen,
    celdaActiva,
    calculoActivo,
    guardando,
    abrirCelda,
    cerrarCelda,
    actualizarValor,
    actualizarMinutosPerdidos,
    guardarCelda,
    recargar,
  } = useCapturaPage({ fechaInicial });

  const irACelda = useCallback(
    (pendiente) => {
      const modulo = rejilla?.modulos?.find((fila) => fila.id_modulo === pendiente.id_modulo);
      const franja = jornada?.franjas?.find(
        (entrada) => entrada.orden_franja === pendiente.hora_jornada,
      );
      if (modulo && franja) abrirCelda(modulo, franja);
    },
    [rejilla, jornada, abrirCelda],
  );

  const recordatorio = useRecordatorioHora({ fecha, activo: esHoy, onIr: irACelda });

  const guardarYActualizar = async () => {
    const modulo = celdaActiva?.modulo;
    const hora = celdaActiva?.franja?.orden_franja;
    const ok = await guardarCelda();
    if (ok && modulo) recordatorio.marcarRegistrada(modulo.id_modulo, hora);
    return ok;
  };

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Registrar produccion"
        subtitle={
          esHoy
            ? "Recorrido de hoy: toca una celda para registrar la franja"
            : `Consultando el ${fecha}`
        }
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={fecha}
            max={hoyLocal()}
            onChange={(evento) => setFecha(evento.target.value)}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0F4C3F]/30"
          />
        </div>
        {/* El inicio de jornada salio del menu lateral, asi que este es su
            unico acceso permanente. El aviso de "modulos sin jornada" que
            aparece mas abajo solo esta cuando falta alguno, y la jornada
            tambien se cierra, se reabre y se corrige cuando ya estan todas
            abiertas. */}
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-xl"
          onClick={() => onNavigate?.("jornada", { fecha })}
          title="Abrir, cerrar o corregir la jornada de un modulo"
        >
          <PlayCircle className="h-4 w-4" />
          Jornadas
        </Button>
        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={recargar}>
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </PageHeader>

      {/* El recordatorio de la hora. Es la traduccion del tablero que
          estaba colgado en la pared: visible sin que nadie lo busque. */}
      {esHoy && recordatorio.total > 0 && (
        <button
          type="button"
          onClick={() => irACelda(recordatorio.siguiente)}
          className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-[#D08E10]/40 bg-[#D08E10]/10 p-4 text-left transition hover:bg-[#D08E10]/15"
        >
          <BellRing className="h-5 w-5 shrink-0 animate-pulse text-[#D08E10]" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#b46a12]">
              {recordatorio.total === 1
                ? "Falta registrar una hora"
                : `Faltan ${recordatorio.total} horas por registrar`}
            </p>
            <p className="truncate text-sm text-[#b46a12]/80">
              La mas atrasada: {recordatorio.siguiente?.etiqueta} en{" "}
              {recordatorio.siguiente?.codigo_lote} · toca para registrarla
            </p>
          </div>
        </button>
      )}

      {/* Un modulo sin jornada no se puede capturar: se avisa arriba, con
          el camino de salida, en vez de dejar que lo descubra al tocar. */}
      {esHoy && resumen.sinJornada > 0 && (
        <button
          type="button"
          onClick={() => onNavigate?.("jornada", { fecha })}
          className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-[#D08E10]/40"
        >
          <PlayCircle className="h-5 w-5 shrink-0 text-[#0F4C3F]" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-800">
              {resumen.sinJornada === 1
                ? "Un modulo todavia no tiene jornada"
                : `${resumen.sinJornada} modulos todavia no tienen jornada`}
            </p>
            <p className="text-sm text-gray-500">
              Configura el lote y las operarias para poder registrarles la produccion.
            </p>
          </div>
        </button>
      )}

      {/* Avance del recorrido y cierre de la planta */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">
            Avance del recorrido
            {jornada?.codigo && (
              <span className="ml-2 rounded-md bg-[#0F4C3F]/10 px-2 py-0.5 text-xs font-medium text-[#0F4C3F]">
                {jornada.nombre}
              </span>
            )}
          </span>
          <span className="text-sm text-gray-500">
            <strong className="text-[#0F4C3F]">{resumen.registradas}</strong> de {resumen.totales} celdas
            {resumen.pendientes > 0 && (
              <span className="ml-2 text-[#D08E10]">· {resumen.pendientes} pendientes</span>
            )}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${
              resumen.porcentaje === 100 ? "bg-green-500" : "bg-[#0F4C3F]"
            }`}
            style={{ width: `${resumen.porcentaje}%` }}
          />
        </div>

        {resumen.registradas > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-xs text-gray-400">Unidades de la planta</p>
              <p className="font-semibold text-gray-900">{formatNumero(resumen.unidades)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Facturacion real</p>
              <p className="font-semibold text-green-600">
                {formatMoneda(resumen.facturacionReal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Meta de facturacion</p>
              <p className="font-semibold text-gray-500">
                {formatMoneda(resumen.facturacionMeta)}
                {resumen.cumplimientoFacturacion !== null && (
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    · {resumen.cumplimientoFacturacion}%
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Minutos-persona perdidos</p>
              <p
                className={`font-semibold ${
                  resumen.minutosPerdidos > 0 ? "text-red-600" : "text-gray-400"
                }`}
              >
                {formatNumero(resumen.minutosPerdidos)}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {cargando && !rejilla ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center text-gray-400">
          Cargando la rejilla...
        </div>
      ) : rejilla && rejilla.modulos.length > 0 ? (
        <CapturaRejilla
          rejilla={rejilla}
          pendientes={recordatorio.pendientes}
          moduloDestacado={moduloInicial}
          onAbrirCelda={abrirCelda}
          onAbrirJornada={(modulo) => onNavigate?.("jornada", { id_modulo: modulo.id_modulo, fecha })}
          onVerModulo={(modulo) => onNavigate?.("tablero-modulo", { modulo, fecha })}
        />
      ) : (
        !error && (
          <EmptyState
            icon={ClipboardList}
            title="No hay modulos activos"
            description="Crea los modulos de la planta para poder registrar la produccion por hora."
          />
        )
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-400">
        La meta de cada franja se calcula como (personas x minutos de la franja) / SAM del lote:
        las franjas cortas de cierre de turno tienen meta mas baja. Si la eficiencia cae por debajo
        del umbral del modulo, el sistema pide la incidencia. Toca el codigo del modulo para ver su
        tablero del dia.
      </p>

      <CapturaCeldaModal
        celda={celdaActiva}
        calculo={calculoActivo}
        causas={rejilla?.causas || []}
        guardando={guardando}
        onCambiar={actualizarValor}
        onCambiarMinutosPerdidos={actualizarMinutosPerdidos}
        onCerrar={cerrarCelda}
        onGuardar={guardarYActualizar}
      />
    </div>
  );
}
