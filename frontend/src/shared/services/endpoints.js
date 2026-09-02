/**
 * Mapa unico de recursos del backend.
 *
 * Cada entrada corresponde a una tabla o vista del schema `bgoat`
 * (ver `database/01_schema_bgoat.sql`) y coincide con las rutas que monta
 * `backend/src/routes/index.js`.
 */
export const endpoints = {
  // --- Acceso ----------------------------------------------------------
  login: "/auth/login",
  logout: "/auth/logout",
  perfil: "/auth/perfil",
  registro: "/auth/registro",
  recuperarClave: "/auth/recuperar",
  restablecerClave: "/auth/restablecer",

  // --- Configuracion ---------------------------------------------------
  usuarios: "/usuarios",                 // tabla usuarios
  roles: "/roles",                       // tabla roles
  permisos: "/permisos",                 // tabla permisos
  rolPermisos: "/roles/:id/permisos",    // tabla rol_permiso

  // --- Gestion de produccion -------------------------------------------
  clientes: "/clientes",
  marcas: "/marcas",
  pedidos: "/pedidos",
  referencias: "/referencias",
  lotes: "/lotes",
  fichasTecnicas: "/fichas-tecnicas",
  fichaOperaciones: "/fichas-tecnicas/:id/operaciones",
  fichaMateriales: "/fichas-tecnicas/:id/materiales",
  fichaMedidas: "/fichas-tecnicas/:id/medidas",
  prendas: "/prendas",
  tallas: "/tallas",
  colores: "/colores",
  tiposPrenda: "/tipos-prenda",
  operarios: "/operarios",
  modulos: "/modulos",
  asignaciones: "/asignaciones-modulo",
  causas: "/causas",                     // tabla causas_desviacion
  ordenes: "/ordenes-produccion",
  curvaOrden: "/ordenes-produccion/:id/curva",

  // --- Captura horaria (el nucleo) -------------------------------------
  captura: "/captura",                   // tabla registros_horarios
  capturaModulo: "/captura/modulo/:id",  // vw_tablero_modulo_dia
  capturaJornadas: "/captura/jornadas",  // jornadas + jornada_franjas

  // --- Indicadores (vistas) --------------------------------------------
  resumen: "/indicadores/resumen",
  estadoModulos: "/indicadores/estado-modulos",       // vw_estado_modulo_dia
  plantaHora: "/indicadores/planta-hora",             // vw_estado_planta_hora
  productividadModulo: "/indicadores/productividad-modulo",
  productividadOperario: "/indicadores/productividad-operario",
  causasPareto: "/indicadores/causas",                // vw_perdidas_por_causa
  sam: "/indicadores/sam",                            // SAM pactado vs observado
  tendencia: "/indicadores/tendencia",
  produccionMarca: "/indicadores/produccion-marca",
  lotesEstado: "/indicadores/lotes-estado",
  ordenesRiesgo: "/indicadores/ordenes-riesgo",
};

/** Reemplaza `:id` (y cualquier otro parametro) en una ruta del mapa. */
export function buildPath(template, params = {}) {
  return Object.entries(params).reduce(
    (path, [clave, valor]) => path.replace(`:${clave}`, encodeURIComponent(valor)),
    template,
  );
}
