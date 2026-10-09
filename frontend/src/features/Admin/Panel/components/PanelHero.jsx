import { Activity, FileText, Plus } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Card } from "@/shared/components/card";

function HeroStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white/15 p-4 backdrop-blur-sm">
      <p className="mb-1 text-sm text-white/80">{label}</p>
      <p className="text-2xl font-bold text-white">{value ?? "--"}</p>
    </div>
  );
}

/**
 * "Modulos cumpliendo meta" cuenta cuantos modulos ya estan en la banda
 * verde de eficiencia (>= 80%) -- el mismo umbral y los mismos datos del
 * semaforo de `EficienciaModulos`, asi el numero de aqui y el de ahi
 * siempre coinciden. Un modulo sin jornada abierta tiene eficiencia 0 y
 * nunca cuenta, sin necesidad de filtrarlo aparte.
 */
function contarModulosEnMeta(modules) {
  return modules.filter((modulo) => Number(modulo.eficiencia || 0) >= 80).length;
}

/**
 * Hero del panel: verde institucional (#2F8068, "--banner-bg" de la
 * propuesta 4), con el badge y los botones en los tonos exactos de esa
 * paleta.
 */
export function PanelHero({ summary = {}, modules = [], onNavigate }) {
  const enMeta = contarModulosEnMeta(modules);

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-marca-claro to-marca-medio-2 p-8 text-white">
      <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-48 w-48 rounded-full bg-ambar/20" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-marca-suave px-3 py-1.5 text-xs font-semibold text-marca-texto">
              <Activity className="h-4 w-4" />
              Sistema en Tiempo Real
            </span>
            <h2 className="mb-2 text-3xl font-bold">Bienvenido al Sistema de Gestión de Producción</h2>
            <p className="mb-6 text-lg text-white/90">
              Monitorea, controla y optimiza tu producción textil en tiempo real
            </p>

            <div className="mb-6 grid grid-cols-2 gap-6">
              <HeroStat label="Órdenes en Proceso" value={summary.ordenes_en_proceso} />
              <HeroStat label="Módulos Cumpliendo Meta" value={enMeta} />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => onNavigate?.("captura")}
                className="bg-ambar text-white hover:bg-ambar-texto"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte
              </Button>
              <Button
                onClick={() => onNavigate?.("create-order")}
                className="border border-linea bg-white text-marca-profundo hover:bg-fondo"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Orden de Producción
              </Button>
            </div>
          </div>

          <div className="ml-8 hidden lg:block">
            <div className="relative h-48 w-48">
              <div className="absolute inset-0 animate-pulse rounded-full bg-ambar/20" />
              <div className="delay-75 absolute inset-4 animate-pulse rounded-full bg-white/15" />
              <div className="absolute inset-8 flex items-center justify-center rounded-full bg-white/20">
                <Activity className="h-16 w-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
