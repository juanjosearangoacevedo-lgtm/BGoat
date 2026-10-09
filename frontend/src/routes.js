import { LandingPage } from "@/features/landing/pages/LandingPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/auth/pages/RegisterPage";
import { RecoverPasswordPage } from "@/features/auth/pages/RecoverPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { PanelPage } from "@/features/Admin/Panel/pages/PanelPage";
import { JornadaPage } from "@/features/Admin/Jornada/pages/JornadaPage";
import { CapturaPage } from "@/features/Admin/Captura/pages/CapturaPage";
import { TableroModuloPage } from "@/features/Admin/Captura/pages/TableroModuloPage";
import { UsuariosPage } from "@/features/Admin/Usuarios/pages/UsuariosPage";
import { RolesPage } from "@/features/Admin/Roles/pages/RolesPage";
import { ClientesPage } from "@/features/Admin/Clientes/pages/ClientesPage";
import { LotesPage } from "@/features/Admin/Lotes/pages/LotesPage";
import { TallasPage } from "@/features/Admin/Tallas/pages/TallasPage";
import { ColoresPage } from "@/features/Admin/Colores/pages/ColoresPage";
import { OperariosPage } from "@/features/Admin/Operarios/pages/OperariosPage";
import { ModulosPage } from "@/features/Admin/Modulos/pages/ModulosPage";
import { CausasPage } from "@/features/Admin/Causas/pages/CausasPage";
import { OrdenesPage } from "@/features/Admin/Ordenes/pages/OrdenesPage";
import { OrdenFormPage } from "@/features/Admin/Ordenes/pages/OrdenFormPage";
import { OrdenDetallePage } from "@/features/Admin/Ordenes/pages/OrdenDetallePage";
import { DiasNoLaboralesPage } from "@/features/Admin/DiasNoLaborales/pages/DiasNoLaboralesPage";

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
  // A esta se llega desde el enlace del correo (`/?restablecer=<token>`).
  "reset-password": { component: ResetPasswordPage, props: (data) => ({ token: data?.token }) },
};

export const adminRoutes = {
  // Panel y tablero por modulo (entradas sueltas, arriba del menu)
  panel: { component: PanelPage },
  "tablero-modulo": {
    component: TableroModuloPage,
    props: (data) => ({ modulo: data?.modulo ?? data, fecha: data?.fecha }),
  },

  // Produccion
  lotes: { component: LotesPage },
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
  modulos: { component: ModulosPage },
  "dias-no-laborales": { component: DiasNoLaboralesPage },

  // Planta
  tallas: { component: TallasPage },
  colores: { component: ColoresPage },
  clients: { component: ClientesPage },
  operarios: { component: OperariosPage },
  causas: { component: CausasPage },

  // Configuracion
  users: { component: UsuariosPage },
  roles: { component: RolesPage },

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
