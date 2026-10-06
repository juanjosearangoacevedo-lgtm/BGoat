import {
  AlertTriangle,
  Building2,
  CalendarOff,
  ClipboardCheck,
  Cog,
  Factory,
  LayoutDashboard,
  Package,
  Package2,
  Palette,
  PlayCircle,
  Ruler,
  Shield,
  Table2,
  Tag,
  UserCog,
  Users,
} from "lucide-react";

/**
 * Menu del panel.
 *
 * "Panel" y "Tablero por modulo" van sueltos y arriba de todo: son las
 * dos pantallas de mirar, no de hacer. El Panel es a donde cae la sesion
 * al entrar; el tablero es lo que se consulta de un modulo a lo largo del
 * dia, y por eso no se esconde dentro de un grupo.
 *
 * - "Produccion" es el flujo real de trabajo, en el orden en que ocurre:
 *   el lote llega del cliente (es la base de toda la cadena), se le abre
 *   una orden, un modulo la toma al abrir su jornada y se registra cada
 *   hora.
 * - "Planta" son los datos base que esa produccion necesita, en el orden
 *   en que se llenan: el lote pide cliente, tallas y colores; la jornada
 *   pide modulos y operarias; la captura pide incidencias; y el calendario
 *   de la entrega descuenta los dias no laborales.
 * - "Configuracion" es la administracion del sistema, no del negocio.
 *   Ya no hay "Consulta de permisos": el ojo de cada rol en "Roles y
 *   permisos" muestra lo que tiene concedido.
 *
 * `permiso` es el modulo de la tabla `permisos` que habilita cada entrada:
 * el sidebar solo muestra lo que el rol del usuario puede ver.
 */
export const adminMenuItems = [
  { icon: LayoutDashboard, label: "Panel", page: "panel", permiso: "Panel" },
  { icon: Table2, label: "Tablero por modulo", page: "tablero-modulo", permiso: "Captura" },
  {
    icon: Factory,
    label: "Produccion",
    children: [
      { icon: Package2, label: "Lotes", page: "lotes", permiso: "Lotes" },
      { icon: Package, label: "Ordenes de produccion", page: "orders", permiso: "Ordenes" },
      { icon: PlayCircle, label: "Inicio de jornada", page: "jornada", permiso: "Jornada" },
      { icon: ClipboardCheck, label: "Registrar produccion", page: "captura", permiso: "Captura" },
    ],
  },
  {
    icon: Building2,
    label: "Planta",
    children: [
      { icon: Tag, label: "Clientes", page: "clients", permiso: "Clientes" },
      { icon: Ruler, label: "Tallas", page: "tallas", permiso: "Lotes" },
      { icon: Palette, label: "Colores", page: "colores", permiso: "Lotes" },
      { icon: UserCog, label: "Modulos", page: "modulos", permiso: "Modulos" },
      { icon: Users, label: "Operarias", page: "operarios", permiso: "Operarios" },
      { icon: AlertTriangle, label: "Incidencias", page: "causas", permiso: "Causas" },
      {
        icon: CalendarOff,
        label: "Dias no laborales",
        page: "dias-no-laborales",
        permiso: "Ordenes",
      },
    ],
  },
  {
    icon: Cog,
    label: "Configuracion",
    children: [
      { icon: Users, label: "Usuarios", page: "users", permiso: "Usuarios" },
      // El formulario de rol incluye la matriz de permisos, y el ojo de
      // cada rol muestra los que tiene concedidos.
      { icon: Shield, label: "Roles y permisos", page: "roles", permiso: "Roles" },
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
