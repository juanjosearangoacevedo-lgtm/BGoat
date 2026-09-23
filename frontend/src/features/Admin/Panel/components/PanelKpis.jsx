import {
  AlertTriangle,
  Calendar,
  Clock,
  Package,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Las tarjetas de KPI del panel.
 *
 * Antes habia dos componentes para esto --`KPICards` del Dashboard e
 * `IndicadoresKpis`-- con su propio catalogo cada uno. Los cuatro
 * indicadores de Indicadores eran un subconjunto exacto de los ocho del
 * Dashboard: el mismo numero pintado de dos formas distintas, y dos
 * sitios que corregir cuando cambiaba una definicion.
 *
 * Ahora el catalogo es uno solo y cada pestana escoge que claves muestra.
 */
export const KPIS = {
  produccion_dia: {
    titulo: "Produccion del dia",
    unidad: "unidades",
    icono: Package,
    color: "#D08E10",
  },
  operarios_activos: {
    titulo: "Operarias en planta",
    unidad: "personas",
    icono: Users,
    color: "#D08E10",
  },
  ordenes_en_proceso: {
    titulo: "Ordenes en proceso",
    unidad: "activas",
    icono: Clock,
    color: "#E3A81B",
  },
  eficiencia: {
    titulo: "Eficiencia",
    unidad: "% de minutos aprovechados",
    icono: Target,
    color: "#10b981",
    sufijo: "%",
  },
  cumplimiento_meta: {
    titulo: "Cumplimiento de meta",
    unidad: "% de la meta del dia",
    icono: TrendingUp,
    color: "#7AB396",
    sufijo: "%",
  },
  produccion_mes: {
    titulo: "Producido en el mes",
    unidad: "unidades",
    icono: Calendar,
    color: "#24973A",
  },
  porcentaje_defectos: {
    titulo: "Tasa de defectos",
    unidad: "sobre lo producido",
    icono: AlertTriangle,
    color: "#ef4444",
    sufijo: "%",
  },
  minutos_por_prenda: {
    titulo: "SAM real promedio",
    unidad: "minutos por prenda",
    icono: Clock,
    color: "#f59e0b",
  },
};

/** Las ocho del resumen y las cuatro de indicadores, en su orden. */
export const KPIS_RESUMEN = [
  "produccion_dia",
  "operarios_activos",
  "ordenes_en_proceso",
  "eficiencia",
  "cumplimiento_meta",
  "produccion_mes",
  "porcentaje_defectos",
  "minutos_por_prenda",
];

export const KPIS_INDICADORES = [
  "eficiencia",
  "produccion_dia",
  "porcentaje_defectos",
  "cumplimiento_meta",
];

export function PanelKpis({ valores = {}, claves = KPIS_RESUMEN, conIcono = true }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {claves.map((clave) => {
        const kpi = KPIS[clave];
        if (!kpi) return null;

        const Icono = kpi.icono;
        const valor = valores[clave];
        // "--" y no "0": no tener el dato y tener cero son cosas
        // distintas, y a primera hora del dia casi todo es lo primero.
        const texto =
          valor === undefined || valor === null
            ? "--"
            : `${Number(valor).toLocaleString("es-CO")}${kpi.sufijo || ""}`;

        return (
          <div
            key={clave}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-600">{kpi.titulo}</p>
                <p className="mt-1 text-3xl font-bold" style={{ color: kpi.color }}>
                  {texto}
                </p>
                <p className="mt-1 text-xs text-gray-400">{kpi.unidad}</p>
              </div>

              {conIcono && (
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${kpi.color}15` }}
                >
                  <Icono className="h-5 w-5" style={{ color: kpi.color }} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
