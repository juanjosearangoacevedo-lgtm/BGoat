import { ArrowLeft, CalendarDays, RefreshCw, Timer } from "lucide-react";
import { Button } from "@/shared/components/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { formatMoneda, formatNumero, hoyLocal } from "@/shared/utils/formatters";
import { TableroCabecera } from "../components/TableroCabecera";
import { TableroTabla } from "../components/TableroTabla";
import { useTableroModulo } from "../hooks/useTableroModulo";

function Indicador({ etiqueta, valor, nota, tono = "gris" }) {
  const tonos = {
    gris: "text-gray-900",
    marca: "text-[#0F4C3F]",
    verde: "text-green-600",
    rojo: "text-red-600",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{etiqueta}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tonos[tono]}`}>{valor}</p>
      {nota && <p className="mt-0.5 text-xs text-gray-400">{nota}</p>}
    </div>
  );
}

/**
 * Tablero de un modulo en un dia.
 *
 * Es la hoja de calculo que la empresa llena a mano, ya cuadrada: la
 * cabecera del modulo, una fila por franja con eficiencia, acumulado,
 * pesos y tiempo perdido, y el cierre del dia.
 *
 * La rejilla de captura sirve para el recorrido —toda la planta de un
 * vistazo—; esto sirve para pararse frente a un modulo y entender el dia.
 */
export function TableroModuloPage({ onNavigate, modulo: moduloInicial, fecha: fechaInicial }) {
  const {
    idModulo,
    setIdModulo,
    fecha,
    setFecha,
    modulos,
    cabecera,
    franjas,
    jornada,
    totales,
    cargando,
    error,
    recargar,
  } = useTableroModulo(moduloInicial?.id_modulo, fechaInicial);

  const modulo = modulos.find((m) => String(m.id_modulo) === String(idModulo)) ?? moduloInicial;
  const umbral = Number(modulo?.umbral_cumplimiento ?? 85);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Tablero del Modulo"
        subtitle={
          jornada?.codigo
            ? `${jornada.nombre} · ${franjas.length} franjas · ${jornada.minutos_totales} minutos`
            : "Este dia no tiene jornada configurada"
        }
      >
        <select
          value={idModulo ?? ""}
          onChange={(evento) => setIdModulo(evento.target.value)}
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#0F4C3F]/30"
        >
          {modulos.map((m) => (
            <option key={m.id_modulo} value={m.id_modulo}>
              {m.codigo} — {m.nombre}
            </option>
          ))}
        </select>

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

        <Button variant="outline" className="h-10 gap-2 rounded-xl" onClick={recargar}>
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-xl"
          onClick={() => onNavigate?.("captura")}
        >
          <ArrowLeft className="h-4 w-4" />
          Rejilla
        </Button>
      </PageHeader>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <TableroCabecera cabecera={cabecera} jornada={jornada} modulo={modulo} />

      {/* Cierre del dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          etiqueta="Unidades del dia"
          valor={formatNumero(totales.unidades_producidas)}
          nota={`de ${formatNumero(Math.round(totales.meta_dia))} de meta`}
          tono="marca"
        />
        <Indicador
          etiqueta="Eficiencia del dia"
          valor={`${totales.eficiencia.toFixed(1)}%`}
          nota={`umbral del modulo ${umbral}%`}
          tono={totales.eficiencia >= umbral ? "verde" : "rojo"}
        />
        <Indicador
          etiqueta="Facturacion real"
          valor={formatMoneda(totales.facturacion_real)}
          nota={`de ${formatMoneda(totales.facturacion_meta)} de meta`}
          tono="verde"
        />
        <Indicador
          etiqueta="Minutos-persona perdidos"
          valor={formatNumero(totales.minutos_perdidos_persona)}
          nota={`${totales.minutos_perdidos} min de modulo detenido`}
          tono={totales.minutos_perdidos_persona > 0 ? "rojo" : "gris"}
        />
      </div>

      {cargando && !cabecera ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center text-gray-400">
          Cargando el tablero...
        </div>
      ) : franjas.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <Timer className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-medium text-gray-700">Este dia no tiene jornada configurada</p>
          <p className="mt-1 text-sm text-gray-400">
            La planta no trabaja este dia, o falta definir su horario.
          </p>
        </div>
      ) : (
        <TableroTabla
          franjas={franjas}
          totales={totales}
          umbral={umbral}
          onEditarFranja={() => onNavigate?.("captura")}
        />
      )}

      <p className="mt-4 text-xs leading-relaxed text-gray-400">
        La meta de cada franja es (personas x minutos de la franja) / SAM: por eso la franja de{" "}
        {jornada?.franjas?.at(-1)?.minutos ?? 40} minutos tiene una meta mas baja que las de 60.
        El % de cumplimiento de facturacion se mide contra la meta de la MISMA franja, no contra la
        de la primera hora.
      </p>
    </div>
  );
}
