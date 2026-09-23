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

  // --- Jornada (lo primero que hace la digitadora) ---------------------
  jornada: "/jornada",                       // tabla jornada_modulo
  jornadaOpciones: "/jornada/opciones",      // modulos + clientes + lotes + operarias
  jornadaModulo: "/jornada/modulo/:id",      // la jornada de un modulo en una fecha
  jornadaHorario: "/jornada/horario",        // vw_horario_jornada: cuanto dura el dia
  cerrarJornada: "/jornada/:id/cerrar",
  reabrirJornada: "/jornada/:id/reabrir",

  // --- Gestion de produccion -------------------------------------------
  clientes: "/clientes",                 // cliente-marca unificado
  lotes: "/lotes",
  fichaLote: "/lotes/:id/ficha",         // sube la imagen o el PDF de la ficha
  fichaLoteTipo: "/lotes/:id/ficha/:tipo", // quita uno de los dos ("imagen" | "pdf")
  detalleLote: "/lotes/:id/detalle",     // tabla lote_detalle_talla_color
  tallas: "/tallas",                     // catalogos del producto: no tienen
  colores: "/colores",                   // pantalla propia, viven dentro del
  tiposPrenda: "/tipos-prenda",          // formulario del lote
  operarios: "/operarios",
  modulos: "/modulos",
  causas: "/causas",                     // tabla causas_desviacion (incidencias)
  ordenes: "/ordenes-produccion",
  curvaOrden: "/ordenes-produccion/:id/curva",

  // --- Captura horaria (el nucleo) -------------------------------------
  captura: "/captura",                   // tabla registros_horarios
  capturaPendientes: "/captura/pendientes", // horas vencidas sin registrar
  capturaModulo: "/captura/modulo/:id",  // vw_tablero_modulo_dia

  // --- Indicadores (vistas) --------------------------------------------
  resumen: "/indicadores/resumen",
  estadoModulos: "/indicadores/estado-modulos",       // vw_estado_modulo_dia
  plantaHora: "/indicadores/planta-hora",             // vw_estado_planta_hora
  productividadModulo: "/indicadores/productividad-modulo",
  productividadOperario: "/indicadores/productividad-operario",
  causasPareto: "/indicadores/causas",                // vw_perdidas_por_causa
  sam: "/indicadores/sam",                            // SAM pactado vs observado
  tendencia: "/indicadores/tendencia",
  produccionCliente: "/indicadores/produccion-cliente",
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
