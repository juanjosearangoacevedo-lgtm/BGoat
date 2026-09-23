import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  Cog,
  Factory,
  LayoutDashboard,
  Lock,
  Package,
  Package2,
  PlayCircle,
  Shield,
  Table2,
  Tag,
  UserCog,
  Users,
} from "lucide-react";

/**
 * Menu del panel.
 *
 * "Panel" va suelto y arriba de todo: es la pantalla de mirar, no de
 * hacer, y es a donde cae la sesion al entrar.
 *
 * - "Produccion" es el dia en el piso, en el orden en que ocurre: la
 *   orden existe suelta, un modulo la toma al abrir su jornada, se
 *   registra cada hora y se mira el tablero.
 * - "Planta" es lo que sostiene esa produccion: el material que entra,
 *   para quien es y la gente.
 * - "Configuracion" es la administracion del sistema, no del negocio.
 *
 * "Panel" es una sola entrada porque es una sola pantalla: el resumen,
 * los indicadores y los reportes eran tres entradas distintas que leian
 * las mismas vistas y respondian a la misma pregunta.
 *
 * `permiso` es el modulo de la tabla `permisos` que habilita cada entrada:
 * el sidebar solo muestra lo que el rol del usuario puede ver.
 */
export const adminMenuItems = [
  { icon: LayoutDashboard, label: "Panel", page: "panel", permiso: "Panel" },
  {
    icon: Factory,
    label: "Produccion",
    children: [
      { icon: Package, label: "Ordenes de produccion", page: "orders", permiso: "Ordenes" },
      { icon: PlayCircle, label: "Inicio de jornada", page: "jornada", permiso: "Jornada" },
      { icon: ClipboardCheck, label: "Registrar produccion", page: "captura", permiso: "Captura" },
      { icon: Table2, label: "Tablero por modulo", page: "tablero-modulo", permiso: "Captura" },
      { icon: UserCog, label: "Modulos", page: "modulos", permiso: "Modulos" },
    ],
  },
  {
    icon: Building2,
    label: "Planta",
    children: [
      { icon: Package2, label: "Lotes", page: "lotes", permiso: "Lotes" },
      { icon: Tag, label: "Clientes", page: "clients", permiso: "Clientes" },
      { icon: Users, label: "Operarias", page: "operarios", permiso: "Operarios" },
      { icon: AlertTriangle, label: "Incidencias", page: "causas", permiso: "Causas" },
    ],
  },
  {
    icon: Cog,
    label: "Configuracion",
    children: [
      { icon: Users, label: "Usuarios", page: "users", permiso: "Usuarios" },
      // El formulario de rol incluye la matriz de permisos: la pantalla de
      // Permisos queda como consulta de "quien puede hacer que".
      { icon: Shield, label: "Roles y permisos", page: "roles", permiso: "Roles" },
      { icon: Lock, label: "Consulta de permisos", page: "permissions", permiso: "Permisos" },
    ],
  },
];

/** Filtra el menu segun los permisos del rol (funcion `puede` del AuthContext). */
export function filtrarMenu(items, puede) {
  if (typeof puede !== "function") return items;

  return items
    .map((item) => {
      if (!item.children) {
        return !item.permiso || puede(item.permiso, "VER") ? item : null;
      }

      const hijos = item.children.filter((hijo) => !hijo.permiso || puede(hijo.permiso, "VER"));
      return hijos.length > 0 ? { ...item, children: hijos } : null;
    })
    .filter(Boolean);
}

/**
 * Paginas que se abren desde un listado y no tienen entrada propia en el menu.
 * Sin esto el breadcrumb las mostraba todas como "Inicio".
 */
const paginasSinMenu = {
  "create-order": "Nueva orden de produccion",
  "edit-order": "Editar orden de produccion",
  "order-detail": "Detalle de la orden",
};

export function findAdminPageLabel(page) {
  for (const item of adminMenuItems) {
    if (item.page === page) return item.label;
    const hijo = item.children?.find((entrada) => entrada.page === page);
    if (hijo) return hijo.label;
  }

  return paginasSinMenu[page] || "Inicio";
}
