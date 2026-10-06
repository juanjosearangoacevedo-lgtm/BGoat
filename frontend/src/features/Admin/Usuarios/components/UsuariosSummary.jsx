import { StatsGrid } from "@/shared/components/StatsGrid";

/** Resumen por `estado` de la tabla `usuarios` (ACTIVO / INACTIVO / BLOQUEADO). */
export function UsuariosSummary({ resumen }) {
  return (
    <StatsGrid
      columns={4}
      items={[
        { label: "Total usuarios", value: resumen.total },
        { label: "Activos", value: resumen.activos, color: "var(--exito-vivo)" },
        { label: "Inactivos", value: resumen.inactivos, color: "var(--neutro-500)" },
        { label: "Bloqueados", value: resumen.bloqueados, color: "var(--peligro-vivo)" },
      ]}
    />
  );
}
