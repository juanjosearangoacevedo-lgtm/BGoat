import { StatusBadge } from "@/shared/components/StatusBadge";
import {
  formatFecha,
  formatFechaHora,
  formatMoneda,
  formatNumero,
  formatPorcentaje,
  GUION,
} from "@/shared/utils/formatters";
import { PrioridadBadge } from "./PrioridadBadge";

const fecha = (valor) => (valor ? formatFecha(valor) : null);
const minutos = (valor) => (valor !== null && valor !== undefined ? `${valor} min` : null);
const pct = (valor) => (valor !== null && valor !== undefined ? formatPorcentaje(valor, 1) : null);

/**
 * Toda la informacion de la orden (vista `vw_avance_orden`).
 *
 * La tabla del listado muestra solo cinco columnas; lo demas vive aqui,
 * agrupado por la pregunta que responde: que es, cuanto va, cuando y
 * quien la registro.
 *
 * Solo hay una fecha de ingreso, "Recepcion": la del lote. Cuando se
 * digito la orden en el sistema va junto a quien la creo, para que no
 * se lea como otra fecha de llegada.
 */
export function OrdenInfoPanel({ orden }) {
  const grupos = [
    {
      titulo: "La orden",
      filas: [
        { label: "N. orden", value: orden?.numero_orden },
        { label: "Estado", value: orden?.estado ? <StatusBadge status={orden.estado} /> : null },
        {
          label: "Prioridad",
          value: orden?.prioridad ? <PrioridadBadge prioridad={orden.prioridad} /> : null,
        },
        { label: "Lote", value: orden?.codigo_lote },
        { label: "Pedido", value: orden?.numero_pedido },
        { label: "Cliente", value: orden?.nombre_cliente },
        {
          label: "Referencia",
          value: [orden?.codigo_referencia, orden?.nombre_referencia].filter(Boolean).join(" · "),
        },
        {
          // La orden no se asigna a un modulo: nace libre y la toma el que
          // abre su jornada con ella. Mientras nadie la tome, esto dice
          // "Libre" y no un guion, que se leeria como un dato faltante.
          label: "Modulo",
          value: orden?.codigo_modulo
            ? `${orden.codigo_modulo} · ${orden.nombre_modulo}`
            : "Libre - la toma el modulo que abra jornada con ella",
        },
        { label: "Tomada el", value: orden?.tomada_el ? formatFechaHora(orden.tomada_el) : null },
      ],
    },
    {
      titulo: "Avance",
      filas: [
        { label: "Cantidad programada", value: formatNumero(orden?.cantidad_programada) },
        { label: "Producidas", value: formatNumero(orden?.unidades_producidas) },
        { label: "Defectuosas", value: formatNumero(orden?.unidades_defectuosas) },
        { label: "Restantes", value: formatNumero(orden?.unidades_restantes) },
        { label: "Avance", value: pct(orden?.porcentaje_avance) },
        { label: "Horas registradas", value: formatNumero(orden?.horas_registradas) },
        { label: "Eficiencia esperada", value: pct(orden?.eficiencia_esperada) },
        { label: "Eficiencia real", value: pct(orden?.eficiencia) },
        { label: "SAM pactado", value: minutos(orden?.sam_pactado) },
        { label: "SAM real", value: minutos(orden?.sam_observado) },
        {
          label: "Valor de maquila",
          value: orden?.valor_maquila_unidad ? formatMoneda(orden.valor_maquila_unidad) : null,
        },
      ],
    },
    {
      titulo: "Fechas",
      filas: [
        { label: "Recepcion", value: fecha(orden?.fecha_recepcion) },
        {
          // El dia en que un modulo abrio jornada con la orden por primera vez.
          label: "Inicio",
          value: fecha(orden?.fecha_inicio_real) ?? "Al iniciar jornada",
        },
        {
          // Formula de German desde el inicio; queda fija.
          label: "Entrega",
          value: fecha(orden?.fecha_fin_programada) ?? "Se calcula al iniciar jornada",
        },
        {
          label: "Personas del calculo",
          value: orden?.personas_entrega ? formatNumero(orden.personas_entrega) : null,
        },
        { label: "Personas ultima jornada", value: formatNumero(orden?.personas_ultima_jornada) },
        { label: "Termino", value: fecha(orden?.fecha_fin_real) },
        { label: "Ultimo dia trabajado", value: fecha(orden?.ultimo_dia_trabajado) },
        {
          label: "Atraso",
          value:
            orden?.dias_atraso === null || orden?.dias_atraso === undefined
              ? null
              : Number(orden.dias_atraso) > 0
                ? `${orden.dias_atraso} ${Number(orden.dias_atraso) === 1 ? "dia" : "dias"}`
                : "A tiempo",
        },
      ],
    },
    {
      titulo: "Registro",
      filas: [
        {
          label: "Creada por",
          value: orden?.nombre_creador
            ? `${orden.nombre_creador} · ${formatFechaHora(orden.fecha_emision)}`
            : null,
        },
        { label: "Observaciones", value: orden?.observaciones, largo: true },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-bold text-gray-900">Informacion completa</h3>

      <div className="space-y-5">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
              {grupo.titulo}
            </p>
            <div className="space-y-2.5">
              {grupo.filas.map((fila) =>
                fila.largo ? (
                  <div key={fila.label} className="text-sm">
                    <span className="text-gray-400">{fila.label}</span>
                    <p className="mt-0.5 whitespace-pre-line font-medium text-gray-800">
                      {fila.value || GUION}
                    </p>
                  </div>
                ) : (
                  <div key={fila.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex-shrink-0 text-gray-400">{fila.label}</span>
                    <span className="truncate text-right font-medium text-gray-800">
                      {fila.value || GUION}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
