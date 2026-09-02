import { LandingPage } from "@/features/landing/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { RecoverPasswordPage } from "@/features/auth/pages/RecoverPasswordPage";
import { DashboardPage } from "@/features/Admin/Dashboard/pages/DashboardPage";
import { CapturaPage } from "@/features/Admin/Captura/pages/CapturaPage";
import { TableroModuloPage } from "@/features/Admin/Captura/pages/TableroModuloPage";
import { UsuariosPage } from "@/features/Admin/Usuarios/pages/UsuariosPage";
import { RolesPage } from "@/features/Admin/Roles/pages/RolesPage";
import { PermisosPage } from "@/features/Admin/Permisos/pages/PermisosPage";
import { ClientesPage } from "@/features/Admin/Clientes/pages/ClientesPage";
import { MarcasPage } from "@/features/Admin/Marcas/pages/MarcasPage";
import { PedidosPage } from "@/features/Admin/Pedidos/pages/PedidosPage";
import { LotesPage } from "@/features/Admin/Lotes/pages/LotesPage";
import { ReferenciasPage } from "@/features/Admin/Referencias/pages/ReferenciasPage";
import { FichasTecnicasPage } from "@/features/Admin/FichasTecnicas/pages/FichasTecnicasPage";
import { PrendasPage } from "@/features/Admin/Prendas/pages/PrendasPage";
import { OperariosPage } from "@/features/Admin/Operarios/pages/OperariosPage";
import { ModulosPage } from "@/features/Admin/Modulos/pages/ModulosPage";
import { AsignacionesPage } from "@/features/Admin/Asignaciones/pages/AsignacionesPage";
import { CausasPage } from "@/features/Admin/Causas/pages/CausasPage";
import { OrdenesPage } from "@/features/Admin/Ordenes/pages/OrdenesPage";
import { OrdenFormPage } from "@/features/Admin/Ordenes/pages/OrdenFormPage";
import { OrdenDetallePage } from "@/features/Admin/Ordenes/pages/OrdenDetallePage";
import { IndicadoresPage } from "@/features/Admin/Indicadores/pages/IndicadoresPage";
import { ReportesPage } from "@/features/Admin/Reportes/pages/ReportesPage";

/**
 * Registro de rutas del proyecto.
 *
 * - `publicRoutes`: paginas sin sesion, se renderizan a pantalla completa.
 * - `adminRoutes`: paginas del panel, siempre dentro del AdminLayout.
 *
 * `props` traduce la informacion que viaja en la navegacion (por ejemplo la
 * orden seleccionada) a props del componente.
 */
export const publicRoutes = {
  landing: { component: LandingPage },
  login: { component: LoginPage },
  register: { component: RegisterPage },
  "recover-password": { component: RecoverPasswordPage },
};

export const adminRoutes = {
  dashboard: { component: DashboardPage },
  captura: { component: CapturaPage },
  "tablero-modulo": {
    component: TableroModuloPage,
    props: (data) => ({ modulo: data?.modulo ?? data, fecha: data?.fecha }),
  },

  // Configuracion
  users: { component: UsuariosPage },
  roles: { component: RolesPage },
  permissions: { component: PermisosPage },

  // Gestion de produccion
  clients: { component: ClientesPage },
  brands: { component: MarcasPage },
  pedidos: { component: PedidosPage },
  lotes: { component: LotesPage },
  referencias: { component: ReferenciasPage },
  "ficha-tecnica": { component: FichasTecnicasPage },
  prendas: { component: PrendasPage },
  operarios: { component: OperariosPage },
  modulos: { component: ModulosPage },
  asignaciones: { component: AsignacionesPage },
  causas: { component: CausasPage },

  // Ordenes
  orders: { component: OrdenesPage },
  "create-order": { component: OrdenFormPage },
  "edit-order": { component: OrdenFormPage, props: (data) => ({ orderData: data, isEdit: true }) },
  "order-detail": {
    component: OrdenDetallePage,
    props: (data) => ({ orderId: data?.id_orden_produccion }),
  },

  // Analisis
  indicadores: { component: IndicadoresPage },
  reports: { component: ReportesPage },
};

export const routes = { ...publicRoutes, ...adminRoutes };

export const defaultPage = "landing";

export function isPublicPage(page) {
  return Object.prototype.hasOwnProperty.call(publicRoutes, page);
}

export function resolveRoute(page) {
  return routes[page] || routes[defaultPage];
}
