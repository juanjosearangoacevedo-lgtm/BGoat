import { Activity, FileText, Plus } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Card } from "@/shared/components/card";

function HeroStat({ label, value, hint }) {
  return (
    <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
      <p className="mb-1 text-sm text-white/80">{label}</p>
      <p className="text-2xl font-bold">{value ?? "--"}</p>
      {hint && <p className="text-xs text-[#E3A81B]">{hint}</p>}
    </div>
  );
}

export function PanelHero({ summary = {}, onNavigate }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-[#0F4C3F] to-[#1B6B55] p-8 text-white">
      <div className="absolute right-0 top-0 -mr-32 -mt-32 h-64 w-64 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-24 -ml-24 h-48 w-48 rounded-full bg-[#D08E10]/20" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-6 w-6 text-[#E3A81B]" />
              <span className="text-sm font-medium text-white/80">Sistema en Tiempo Real</span>
            </div>
            <h2 className="mb-2 text-3xl font-bold">Bienvenido al Sistema de Gestion de Produccion</h2>
            <p className="mb-6 text-lg text-white/90">
              Monitorea, controla y optimiza tu produccion textil en tiempo real
            </p>

            <div className="mb-6 grid grid-cols-3 gap-6">
              <HeroStat label="Produccion Hoy" value={summary.produccion_dia} />
              <HeroStat label="Cumplimiento de Meta" value={summary.cumplimiento_meta} />
              <HeroStat label="Ordenes en Proceso" value={summary.ordenes_en_proceso} />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => onNavigate?.("captura")}
                className="bg-[#D08E10] text-white hover:bg-[#B67F14]"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Reporte
              </Button>
              <Button
                onClick={() => onNavigate?.("create-order")}
                className="bg-white text-[#0F4C3F] hover:bg-white/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Orden de Produccion
              </Button>
            </div>
          </div>

          <div className="ml-8 hidden lg:block">
            <div className="relative h-48 w-48">
              <div className="absolute inset-0 animate-pulse rounded-full bg-[#D08E10]/20" />
              <div className="delay-75 absolute inset-4 animate-pulse rounded-full bg-[#E3A81B]/20" />
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
