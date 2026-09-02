import { CalendarDays, ClipboardList, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageHeader } from "@/shared/components/PageHeader";
import { formatMoneda, formatNumero } from "@/shared/utils/formatters";
import { CapturaCeldaModal } from "../components/CapturaCeldaModal";
import { CapturaRejilla } from "../components/CapturaRejilla";
import { hoyLocal, useCapturaPage } from "../hooks/useCapturaPage";

/**
 * Captura de produccion.
 *
 * Reemplaza el tablero de la pared: la supervisora recorre la planta y va
 * llenando una celda por modulo y franja. El sistema hace la meta, el
 * porcentaje y los pesos, que hoy ella calcula a mano unas 200 veces al dia.
 */
export function CapturaPage({ onNavigate }) {
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
  } = useCapturaPage();

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Captura de Produccion"
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
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#433A9B]/30"
          />
        </div>
        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={recargar}>
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </PageHeader>

      {/* Avance del recorrido y cierre de la planta */}
      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-700">
            Avance del recorrido
            {jornada?.codigo && (
              <span className="ml-2 rounded-md bg-[#433A9B]/10 px-2 py-0.5 text-xs font-medium text-[#433A9B]">
                {jornada.nombre}
              </span>
            )}
          </span>
          <span className="text-sm text-gray-500">
            <strong className="text-[#433A9B]">{resumen.registradas}</strong> de {resumen.totales} celdas
            {resumen.pendientes > 0 && (
              <span className="ml-2 text-[#F39A3D]">· {resumen.pendientes} pendientes</span>
            )}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${
              resumen.porcentaje === 100 ? "bg-green-500" : "bg-[#433A9B]"
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
          onAbrirCelda={abrirCelda}
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
        La meta de cada franja se calcula como (personas x minutos de la franja) / SAM de la
        referencia: las franjas cortas de cierre de turno tienen meta mas baja. Si la eficiencia cae
        por debajo del umbral del modulo, el sistema pide la causa. Toca el codigo del modulo para
        ver su tablero del dia.
      </p>

      <CapturaCeldaModal
        celda={celdaActiva}
        calculo={calculoActivo}
        causas={rejilla?.causas || []}
        guardando={guardando}
        onCambiar={actualizarValor}
        onCambiarMinutosPerdidos={actualizarMinutosPerdidos}
        onCerrar={cerrarCelda}
        onGuardar={guardarCelda}
      />
    </div>
  );
}
