import { ArrowLeft, Package } from "lucide-react";
import { Button } from "@/shared/components/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { GUION } from "@/shared/utils/formatters";
import { OrdenAvisoEntrega } from "../components/OrdenAvisoEntrega";
import { OrdenCurva } from "../components/OrdenCurva";
import { OrdenInfoPanel } from "../components/OrdenInfoPanel";
import { OrdenJornadas } from "../components/OrdenJornadas";
import { OrdenProgresoHero } from "../components/OrdenProgresoHero";
import { OrdenRegistros } from "../components/OrdenRegistros";
import { PrioridadBadge } from "../components/PrioridadBadge";
import { useOrdenDetalle } from "../hooks/useOrdenDetalle";

export function OrdenDetallePage({ orderId, onNavigate }) {
  const { orden, registros, jornadas, curva, lote, loading, error, progress, decidiendo, decidirEntrega } =
    useOrdenDetalle(orderId);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <button
          onClick={() => onNavigate?.("orders")}
          className="mt-1 flex items-center gap-2 text-gray-500 transition-colors hover:text-marca-letra"
          type="button"
          aria-label="Volver a órdenes"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{orden?.numero_orden || "Orden"}</h1>
            <StatusBadge status={orden?.estado} />
            <PrioridadBadge prioridad={orden?.prioridad} />
          </div>
          <p className="mt-1 text-gray-600">
            {orden
              ? `${orden.nombre_referencia || GUION} · ${orden.nombre_cliente || GUION}`
              : "Cargando el detalle de la orden..."}
          </p>
        </div>
        {orden && (
          <Button onClick={() => onNavigate?.("edit-order", orden)} variant="outline" className="rounded-xl">
            Editar orden
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {!loading && !orden ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <EmptyState
            icon={Package}
            title="No se encontró la orden"
            description="Vuelve al listado y selecciona una orden de producción."
          />
        </div>
      ) : (
        orden && (
          <>
            <OrdenProgresoHero orden={orden} progress={progress} />

            <OrdenAvisoEntrega
              key={`${orden.id_orden_produccion}-${orden.fecha_fin_programada}`}
              orden={orden}
              decidiendo={decidiendo}
              onDecidir={decidirEntrega}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                {/* La meta de la curva es el umbral del modulo: viene en cada hora registrada. */}
                <OrdenCurva curva={curva} umbral={registros[0]?.umbral_cumplimiento ?? 85} />
                <OrdenRegistros registros={registros} />
                <OrdenJornadas jornadas={jornadas} />
              </div>

              <div className="space-y-6">
                <OrdenInfoPanel orden={orden} lote={lote} />
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
