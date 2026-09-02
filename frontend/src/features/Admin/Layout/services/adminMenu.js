import {
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Cog,
  Factory,
  FileText,
  LayoutDashboard,
  Lock,
  Package,
  Package2,
  Shield,
  Shirt,
  ShoppingCart,
  Tag,
  Tags,
  UserCog,
  Users,
  Table2,
} from "lucide-react";

/**
 * Menu del panel.
 *
 * `permiso` es el modulo de la tabla `permisos` que habilita cada entrada:
 * el sidebar solo muestra lo que el rol del usuario puede ver.
 */
export const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", page: "dashboard", permiso: "Dashboard" },
  { icon: ClipboardCheck, label: "Captura de Produccion", page: "captura", permiso: "Captura" },
  { icon: Table2, label: "Tablero por Modulo", page: "tablero-modulo", permiso: "Captura" },
  {
    icon: Factory,
    label: "Planta",
    children: [
      { icon: UserCog, label: "Modulos", page: "modulos", permiso: "Modulos" },
      { icon: Users, label: "Operarios", page: "operarios", permiso: "Operarios" },
      { icon: ClipboardList, label: "Asignacion operativa", page: "asignaciones", permiso: "Asignaciones" },
      { icon: AlertTriangle, label: "Causas de desviacion", page: "causas", permiso: "Causas" },
    ],
  },
  {
    icon: Package2,
    label: "Produccion",
    children: [
      { icon: Package, label: "Ordenes de Produccion", page: "orders", permiso: "Ordenes" },
      { icon: Package2, label: "Lotes", page: "lotes", permiso: "Lotes" },
      { icon: Shirt, label: "Fichas Tecnicas", page: "ficha-tecnica", permiso: "Fichas Tecnicas" },
      { icon: Tags, label: "Referencias", page: "referencias", permiso: "Referencias" },
      { icon: Shirt, label: "Prendas", page: "prendas", permiso: "Prendas" },
    ],
  },
  {
    icon: ShoppingCart,
    label: "Comercial",
    children: [
      { icon: Tag, label: "Clientes", page: "clients", permiso: "Clientes" },
      { icon: Tag, label: "Marcas", page: "brands", permiso: "Marcas" },
      { icon: FileText, label: "Pedidos", page: "pedidos", permiso: "Pedidos" },
    ],
  },
  { icon: BarChart3, label: "Indicadores", page: "indicadores", permiso: "Indicadores" },
  { icon: FileText, label: "Reportes", page: "reports", permiso: "Reportes" },
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
