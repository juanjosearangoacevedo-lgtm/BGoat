import { Lock, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/shared/components/button";
import { ExportMenu } from "@/shared/components/ExportMenu";
import { FilterBar } from "@/shared/components/FilterBar";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatsGrid } from "@/shared/components/StatsGrid";
import { TablePagination } from "@/shared/components/TablePagination";
import { PermisosMatrix, columnasPermisos } from "../components/PermisosMatrix";
import { usePermisosPage } from "../hooks/usePermisosPage";

/**
 * Pantalla de consulta de permisos.
 *
 * Responde "quien puede hacer que" de un vistazo. La edicion no vive aqui:
 * los permisos se marcan dentro del formulario del rol, de modo que crear un
 * rol y darle acceso sea un solo paso.
 */
export function PermisosPage({ onNavigate }) {
  const permisos = usePermisosPage();
  const { lista } = permisos;

  const columnas = columnasPermisos({ roles: permisos.roles, tiene: permisos.tiene });
  const hayBusqueda = lista.hayFiltros || Boolean(permisos.busqueda);

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Permisos"
        subtitle="Catalogo de acciones del sistema y su asignacion por rol"
      >
        <Button
          variant="outline"
          className="h-10 gap-2 rounded-xl px-4"
          onClick={permisos.recargar}
          disabled={permisos.cargando}
        >
          <RefreshCw className={`h-4 w-4 ${permisos.cargando ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
        <Button
          onClick={() => onNavigate?.("roles")}
          className="h-10 gap-2 rounded-xl bg-[#433A9B] px-5 text-white hover:bg-[#433A9B]/90"
        >
          <Shield className="h-4 w-4" />
          Gestionar en Roles
        </Button>
      </PageHeader>

      {permisos.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {permisos.error}
        </div>
      )}

      <StatsGrid
        columns={4}
        items={[
          { label: "Permisos del sistema", value: permisos.resumen.permisos },
          { label: "Modulos protegidos", value: permisos.resumen.modulos, color: "#F39A3D" },
          { label: "Roles configurados", value: permisos.resumen.roles, color: "#10b981" },
          {
            label: "Permisos sin usar",
            value: permisos.resumen.sinUso,
            color: permisos.resumen.sinUso > 0 ? "#f59e0b" : "#6b7280",
            hint: "Ningun rol los tiene concedidos",
          },
        ]}
      />

      <FilterBar
        search={permisos.busqueda}
        onSearch={permisos.setBusqueda}
        searchPlaceholder="Buscar permiso por modulo o accion..."
        definiciones={lista.definiciones}
        filtros={lista.filtros}
        onFiltro={lista.setFiltro}
        filtrosActivos={lista.filtrosActivos}
        onLimpiar={lista.limpiarFiltros}
        acciones={
          <ExportMenu
            columnas={columnas}
            filtrados={lista.filtrados}
            todos={lista.filtrados}
            archivo="permisos"
            label="permisos"
          />
        }
      />

      <PermisosMatrix
        columnas={columnas}
        filas={lista.visibles}
        loading={permisos.cargando}
        orden={lista.orden}
        onOrdenar={lista.ordenarPor}
        empty={{
          icon: Lock,
          title: hayBusqueda ? "Sin resultados" : "No hay permisos configurados",
          description: hayBusqueda
            ? "Ningun permiso coincide con la busqueda o los filtros aplicados."
            : "La matriz se construye con los registros de la tabla permisos (modulo + accion).",
          action: hayBusqueda ? (
            <Button
              variant="outline"
              onClick={() => {
                lista.limpiarFiltros();
                permisos.setBusqueda("");
              }}
            >
              Limpiar busqueda y filtros
            </Button>
          ) : null,
        }}
        footer={
          <TablePagination
            page={lista.page}
            totalPages={lista.totalPages}
            total={lista.total}
            pageSize={lista.pageSize}
            loading={permisos.cargando}
            label="permisos"
            onPageChange={lista.setPage}
            onPageSizeChange={lista.setPageSize}
          />
        }
      />

      <p className="mt-4 text-xs text-gray-400">
        Para conceder o quitar permisos entra a Roles, edita el rol y marca las casillas: rol y permisos
        se guardan en el mismo formulario.
      </p>
    </div>
  );
}
