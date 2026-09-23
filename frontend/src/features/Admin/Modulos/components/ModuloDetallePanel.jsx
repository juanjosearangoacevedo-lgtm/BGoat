import { X } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import {
  formatMoneda,
  formatNumero,
  GUION,
  iniciales,
  nombreCompleto,
} from "@/shared/utils/formatters";

/**
 * Detalle de un `modulo`: el bloque de cabecera del tablero de la empresa.
 *
 * Esta ordenado igual que la hoja, y por la misma razon: arriba lo que
 * alguien declaro (el lote, la gente, el SAM, la tarifa) y debajo lo que
 * el sistema saca de eso. Antes este panel mezclaba las dos cosas bajo
 * "Configuracion del modulo", con unas horas de jornada y una eficiencia
 * esperada escritas a mano que no cuadraban con nada.
 */
function Dato({ label, value, destacado = false }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="flex-shrink-0 text-gray-500">{label}</span>
      <span
        className={`truncate text-right font-medium ${destacado ? "text-[#0F4C3F]" : "text-gray-800"}`}
      >
        {value ?? GUION}
      </span>
    </div>
  );
}

function Bloque({ titulo, nota, children }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs font-medium text-gray-600">{titulo}</p>
      {nota && <p className="mt-1 text-[11px] text-gray-400">{nota}</p>}
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

export function ModuloDetallePanel({ modulo, jornada = null, onClose }) {
  if (!modulo) return null;

  const operarios = jornada?.operarias ?? [];
  const eficiencia = Math.round(Number(modulo.eficiencia || 0));
  const num = (campo) => Number(modulo[campo] || 0);

  // Lo que alguien declaro: las celdas amarillas de la hoja.
  const declarado = [
    { label: "Cliente", value: jornada?.nombre_cliente },
    { label: "Referencia", value: jornada?.nombre_referencia || jornada?.codigo_referencia },
    { label: "Lote", value: jornada?.codigo_lote },
    {
      label: "Personas",
      value: jornada
        ? `${jornada.cantidad_operarias} de ${modulo.capacidad_operarios ?? 0} puestos`
        : null,
    },
    { label: "SAM pactado", value: jornada?.sam_pactado ? `${jornada.sam_pactado} min` : null },
    {
      label: "Valor de maquila",
      value: jornada?.valor_maquila_unidad
        ? `${formatMoneda(jornada.valor_maquila_unidad)} / und`
        : null,
    },
  ];

  // Lo que el sistema calcula: las celdas verdes.
  const calculado = [
    {
      label: "Horas de la jornada",
      value: modulo.horas_horario ? `${modulo.horas_horario} h` : null,
    },
    { label: "Meta del dia", value: formatNumero(Math.round(num("meta_dia"))), destacado: true },
    { label: "Producido", value: formatNumero(num("unidades_producidas")), destacado: true },
    { label: "Horas registradas", value: modulo.horas_registradas ?? 0 },
    { label: "Prendas por hora", value: Number(num("prendas_por_hora")).toFixed(1) },
    {
      label: "SAM observado",
      value: modulo.sam_observado ? `${Number(modulo.sam_observado).toFixed(2)} min` : null,
    },
    { label: "Minutos puestos", value: formatNumero(num("minutos_disponibles")) },
    { label: "Minutos ganados", value: formatNumero(Math.round(num("minutos_ganados"))) },
    {
      label: "Defectos",
      value: `${formatNumero(num("unidades_defectuosas"))} (${Number(num("porcentaje_defectos")).toFixed(2)}%)`,
    },
  ];

  const facturacion = [
    { label: "Meta", value: formatMoneda(num("facturacion_meta")) },
    { label: "Real", value: formatMoneda(num("facturacion_real")), destacado: true },
    {
      label: "Cumplimiento",
      value:
        modulo.cumplimiento_facturacion == null
          ? null
          : `${Number(modulo.cumplimiento_facturacion).toFixed(2)}%`,
      destacado: true,
    },
  ];

  const perdidas = [
    { label: "Maquina", value: num("minutos_maquina") },
    { label: "Calidad", value: num("minutos_calidad") },
    { label: "Montaje o insumos", value: num("minutos_montaje") },
    { label: "Otras causas", value: num("minutos_otras") },
  ];
  const hayPerdidas = perdidas.some((linea) => linea.value > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
      <div className="flex h-full w-full flex-col bg-white shadow-2xl md:w-[480px]">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{modulo.nombre}</h2>
            <p className="text-xs text-gray-500">
              {modulo.codigo} · {modulo.ubicacion || "Sin ubicacion"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={modulo.estado} />
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-gray-100"
              type="button"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className="rounded-xl bg-[#0F4C3F]/5 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-[#0F4C3F]">Eficiencia del dia</span>
              <span className="font-bold text-[#0F4C3F]">{eficiencia}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#0F4C3F]"
                style={{ width: `${Math.min(eficiencia, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-[#0F4C3F]/70">
              <span>{formatNumero(num("unidades_producidas"))} producidas</span>
              <span>umbral {Number(modulo.umbral_cumplimiento ?? 85)}%</span>
            </div>
          </div>

          {jornada ? (
            <Bloque
              titulo="Lo que esta corriendo hoy"
              nota="Lo declara la digitadora al abrir la jornada."
            >
              {declarado.map((dato) => (
                <Dato key={dato.label} {...dato} />
              ))}
            </Bloque>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
              Este modulo todavia no tiene jornada abierta hoy.
            </div>
          )}

          <Bloque
            titulo="Lo que el sistema calcula"
            nota="Nada de esto se digita: sale de las horas capturadas."
          >
            {calculado.map((dato) => (
              <Dato key={dato.label} {...dato} />
            ))}
          </Bloque>

          <Bloque titulo="Facturacion del dia" nota="Meta y real de las mismas franjas.">
            {facturacion.map((dato) => (
              <Dato key={dato.label} {...dato} />
            ))}
          </Bloque>

          {hayPerdidas && (
            <Bloque
              titulo="Minutos perdidos"
              nota="Minutos de modulo por causa. El total va en minutos-persona, que es la unidad de los minutos puestos."
            >
              {perdidas.map((linea) => (
                <Dato key={linea.label} label={linea.label} value={`${linea.value} min`} />
              ))}
              <div className="border-t border-gray-200 pt-2">
                <Dato
                  label="Total minutos-persona"
                  value={formatNumero(num("minutos_perdidos_persona"))}
                  destacado
                />
              </div>
            </Bloque>
          )}

          <Bloque titulo="Configuracion" nota="Lo unico que se escribe a mano de este modulo.">
            <Dato label="Puestos" value={modulo.capacidad_operarios ?? 0} />
            <Dato
              label="Umbral de cumplimiento"
              value={`${Number(modulo.umbral_cumplimiento ?? 85)}%`}
            />
          </Bloque>

          <div>
            <h3 className="mb-3 font-semibold text-gray-900">
              Operarias de hoy{jornada ? ` · ${operarios.length}` : ""}
            </h3>
            {!jornada ? (
              <p className="text-sm text-gray-400">Sin jornada abierta no hay nomina.</p>
            ) : operarios.length === 0 ? (
              <p className="text-sm text-gray-400">La jornada no tiene operarias registradas.</p>
            ) : (
              <div className="space-y-2">
                {operarios.map((operario) => (
                  <div
                    key={operario.id_jornada_operaria}
                    className="flex items-center gap-3 rounded-xl bg-gray-50 p-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0F4C3F]/10 text-sm font-bold text-[#0F4C3F]">
                      {operario.id_operario ? iniciales(nombreCompleto(operario)) : operario.numero}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {operario.id_operario ? nombreCompleto(operario) : "Operaria anonima"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Puesto {operario.numero}
                        {operario.codigo_operario ? ` · ${operario.codigo_operario}` : ""}
                        {operario.especialidad ? ` · ${operario.especialidad}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={jornada.estado} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {modulo.observaciones && (
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-1 text-xs font-medium text-gray-600">Observaciones</p>
              <p className="text-sm text-gray-600">{modulo.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
