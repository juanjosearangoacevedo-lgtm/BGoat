import { LandingPage } from "@/features/landing/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { RecoverPasswordPage } from "@/features/auth/pages/RecoverPasswordPage";
import { PanelPage } from "@/features/Admin/Panel/pages/PanelPage";
import { JornadaPage } from "@/features/Admin/Jornada/pages/JornadaPage";
import { CapturaPage } from "@/features/Admin/Captura/pages/CapturaPage";
import { TableroModuloPage } from "@/features/Admin/Captura/pages/TableroModuloPage";
import { UsuariosPage } from "@/features/Admin/Usuarios/pages/UsuariosPage";
import { RolesPage } from "@/features/Admin/Roles/pages/RolesPage";
import { PermisosPage } from "@/features/Admin/Permisos/pages/PermisosPage";
import { ClientesPage } from "@/features/Admin/Clientes/pages/ClientesPage";
import { LotesPage } from "@/features/Admin/Lotes/pages/LotesPage";
import { OperariosPage } from "@/features/Admin/Operarios/pages/OperariosPage";
import { ModulosPage } from "@/features/Admin/Modulos/pages/ModulosPage";
import { CausasPage } from "@/features/Admin/Causas/pages/CausasPage";
import { OrdenesPage } from "@/features/Admin/Ordenes/pages/OrdenesPage";
import { OrdenFormPage } from "@/features/Admin/Ordenes/pages/OrdenFormPage";
import { OrdenDetallePage } from "@/features/Admin/Ordenes/pages/OrdenDetallePage";

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
  // Panel (entrada suelta, arriba del menu)
  panel: { component: PanelPage },

  // Produccion
  orders: { component: OrdenesPage },
  jornada: {
    component: JornadaPage,
    props: (data) => ({
      moduloInicial: data?.id_modulo ?? null,
      fechaInicial: data?.fecha ?? null,
    }),
  },
  captura: {
    component: CapturaPage,
    props: (data) => ({ moduloInicial: data?.id_modulo ?? null, fechaInicial: data?.fecha }),
  },
  "tablero-modulo": {
    component: TableroModuloPage,
    props: (data) => ({ modulo: data?.modulo ?? data, fecha: data?.fecha }),
  },
  modulos: { component: ModulosPage },

  // Planta
  lotes: { component: LotesPage },
  clients: { component: ClientesPage },
  operarios: { component: OperariosPage },
  causas: { component: CausasPage },

  // Configuracion
  users: { component: UsuariosPage },
  roles: { component: RolesPage },
  permissions: { component: PermisosPage },

  // Sin entrada en el menu: se llega desde el listado de ordenes.
  "create-order": { component: OrdenFormPage },
  "edit-order": { component: OrdenFormPage, props: (data) => ({ orderData: data, isEdit: true }) },
  "order-detail": {
    component: OrdenDetallePage,
    props: (data) => ({ orderId: data?.id_orden_produccion }),
  },
};

export const routes = { ...publicRoutes, ...adminRoutes };

export const defaultPage = "landing";

export function isPublicPage(page) {
  return Object.prototype.hasOwnProperty.call(publicRoutes, page);
}

export function resolveRoute(page) {
  return routes[page] || routes[defaultPage];
}
