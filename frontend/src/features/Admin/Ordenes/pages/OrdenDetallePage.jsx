import { ArrowLeft, Package, Shirt } from "lucide-react";
import { Button } from "@/shared/components/button";
import { EmptyState } from "@/shared/components/EmptyState";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { GUION } from "@/shared/utils/formatters";
import { OrdenCurva } from "../components/OrdenCurva";
import { OrdenInfoPanel } from "../components/OrdenInfoPanel";
import { OrdenJornadas } from "../components/OrdenJornadas";
import { OrdenProgresoHero } from "../components/OrdenProgresoHero";
import { OrdenRegistros } from "../components/OrdenRegistros";
import { useOrdenDetalle } from "../hooks/useOrdenDetalle";

export function OrdenDetallePage({ orderId, onNavigate }) {
  const { orden, registros, jornadas, curva, loading, error, progress } =
    useOrdenDetalle(orderId);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-start gap-4">
        <button
          onClick={() => onNavigate?.("orders")}
          className="mt-1 flex items-center gap-2 text-gray-500 transition-colors hover:text-[#0F4C3F]"
          type="button"
          aria-label="Volver a ordenes"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{orden?.numero_orden || "Orden"}</h1>
            <StatusBadge status={orden?.estado} />
            <StatusBadge status={orden?.prioridad} />
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
            title="No se encontro la orden"
            description="Vuelve al listado y selecciona una orden de produccion."
          />
        </div>
      ) : (
        orden && (
          <>
            <OrdenProgresoHero orden={orden} progress={progress} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <OrdenCurva curva={curva} />
                <OrdenRegistros registros={registros} />
                <OrdenJornadas jornadas={jornadas} />
              </div>

              <div className="space-y-6">
                <OrdenInfoPanel orden={orden} />

                <div className="rounded-2xl border border-[#0F4C3F]/20 bg-[#0F4C3F]/5 p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <Shirt className="h-5 w-5 text-[#0F4C3F]" />
                    <h3 className="font-bold text-[#0F4C3F]">Lo que pactamos</h3>
                  </div>
                  <p className="mb-1 text-sm text-gray-600">
                    {orden.nombre_referencia || orden.codigo_referencia || GUION}
                  </p>
                  <p className="text-xs text-gray-400">
                    Lote {orden.codigo_lote || GUION} · SAM pactado {orden.sam_pactado ?? GUION} min
                  </p>
                  {orden.sam_observado && (
                    <p
                      className={`mt-2 text-xs font-medium ${
                        Number(orden.sam_observado) > Number(orden.sam_pactado)
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      SAM real: {orden.sam_observado} min
                      {Number(orden.sam_observado) > Number(orden.sam_pactado)
                        ? " · por encima de lo pactado"
                        : " · dentro de lo pactado"}
                    </p>
                  )}
                  <button
                    onClick={() => onNavigate?.("ficha-tecnica")}
                    className="mt-3 text-xs font-medium text-[#0F4C3F] hover:underline"
                    type="button"
                  >
                    Ver ficha completa
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
