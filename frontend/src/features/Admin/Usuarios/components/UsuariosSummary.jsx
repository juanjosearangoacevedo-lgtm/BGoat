import { StatsGrid } from "@/shared/components/StatsGrid";

/** Resumen por `estado` de la tabla `usuarios` (ACTIVO / INACTIVO / BLOQUEADO). */
export function UsuariosSummary({ resumen }) {
  return (
    <StatsGrid
      columns={4}
      items={[
        { label: "Total usuarios", value: resumen.total },
        { label: "Activos", value: resumen.activos, color: "#10b981" },
        { label: "Inactivos", value: resumen.inactivos, color: "#6b7280" },
        { label: "Bloqueados", value: resumen.bloqueados, color: "#ef4444" },
      ]}
    />
  );
}
