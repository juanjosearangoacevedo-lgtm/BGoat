import { AlertTriangle, Clock, Package, Target, TrendingUp } from "lucide-react";

/**
 * Las tarjetas de KPI del panel.
 *
 * Antes habia tres pantallas para esto --Dashboard, Indicadores y
 * Reportes-- cada una con su propio catalogo. Ahora es un solo catalogo
 * y la pestana Indicadores y Reportes escoge que claves muestra, todas
 * calculadas sobre el mismo periodo y modulo que el resto de la pantalla.
 */
export const KPIS = {
  produccion_periodo: {
    titulo: "Produccion del periodo",
    unidad: "unidades",
    icono: Package,
    color: "#D49A17",
  },
  eficiencia: {
    titulo: "Eficiencia",
    unidad: "% de minutos aprovechados",
    icono: Target,
    color: "#22A447",
    sufijo: "%",
  },
  cumplimiento_meta: {
    titulo: "Cumplimiento de meta",
    unidad: "% de la meta del periodo",
    icono: TrendingUp,
    color: "#2F8068",
    sufijo: "%",
  },
  porcentaje_defectos: {
    titulo: "Tasa de defectos",
    unidad: "sobre lo producido",
    icono: AlertTriangle,
    color: "#D64545",
    sufijo: "%",
  },
  minutos_por_prenda: {
    titulo: "SAM real promedio",
    unidad: "minutos por prenda",
    icono: Clock,
    color: "#A87508",
  },
};

export const KPIS_INDICADORES_REPORTES = [
  "eficiencia",
  "produccion_periodo",
  "porcentaje_defectos",
  "cumplimiento_meta",
  "minutos_por_prenda",
];

export function PanelKpis({ valores = {}, claves = KPIS_INDICADORES_REPORTES, conIcono = true }) {
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
          <div key={clave} className="rounded-2xl border border-emerald-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-[#5C6B64]">{kpi.titulo}</p>
                <p className="mt-1 text-3xl font-bold" style={{ color: kpi.color }}>
                  {texto}
                </p>
                <p className="mt-1 text-xs text-[#8B968F]">{kpi.unidad}</p>
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
