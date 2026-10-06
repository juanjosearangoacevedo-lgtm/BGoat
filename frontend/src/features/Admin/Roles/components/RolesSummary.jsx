import { StatsGrid } from "@/shared/components/StatsGrid";

/** Resumen de la tabla `roles` y de las asignaciones en `rol_permiso`. */
export function RolesSummary({ resumen }) {
  return (
    <StatsGrid
      columns={4}
      items={[
        { label: "Roles configurados", value: resumen.total },
        { label: "Roles activos", value: resumen.activos, color: "var(--exito-vivo)" },
        { label: "Roles inactivos", value: resumen.inactivos, color: "var(--neutro-500)" },
        { label: "Permisos asignados", value: resumen.permisosAsignados, color: "var(--dorado)" },
      ]}
    />
  );
}
