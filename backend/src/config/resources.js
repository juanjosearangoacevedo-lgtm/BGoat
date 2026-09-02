/**
 * Definicion declarativa de los recursos CRUD.
 *
 * Cada entrada describe una tabla del schema `bgoat`:
 *   tabla       -> nombre real de la tabla
 *   pk          -> llave primaria
 *   permiso     -> modulo de la tabla `permisos` que la protege
 *   campos      -> columnas que el cliente puede enviar (insert / update)
 *   obligatorios-> columnas que no pueden faltar al crear
 *   buscables   -> columnas del parametro ?buscar=
 *   filtros     -> columnas que aceptan filtro exacto por query string
 *   orden       -> ORDER BY por defecto
 *   vista       -> vista o SELECT enriquecido para el listado (opcional)
 *   softDelete  -> si se inactiva en vez de borrar, y con que columna/valor
 *
 * `crudFactory` construye el router a partir de esto, de modo que agregar
 * un recurso no implique escribir un archivo nuevo.
 */
export const recursos = {
  clientes: {
    tabla: "clientes",
    pk: "id_cliente",
    permiso: "Clientes",
    campos: [
      "tipo_documento", "numero_documento", "razon_social", "nombres", "apellidos",
      "telefono", "correo", "direccion", "estado",
    ],
    obligatorios: ["numero_documento"],
    buscables: ["razon_social", "nombres", "apellidos", "numero_documento", "correo"],
    filtros: ["estado", "tipo_documento"],
    orden: "razon_social ASC, nombres ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  marcas: {
    tabla: "marcas",
    pk: "id_marca",
    permiso: "Marcas",
    campos: ["nombre", "descripcion", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre", "descripcion"],
    filtros: ["estado"],
    orden: "nombre ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  referencias: {
    tabla: "referencias",
    pk: "id_referencia",
    permiso: "Referencias",
    campos: ["id_marca", "codigo", "nombre", "descripcion", "estado"],
    obligatorios: ["id_marca", "codigo", "nombre"],
    buscables: ["codigo", "nombre", "descripcion"],
    filtros: ["estado", "id_marca"],
    orden: "codigo ASC",
    vista: `
      SELECT r.*, m.nombre AS nombre_marca
      FROM referencias r
      JOIN marcas m ON m.id_marca = r.id_marca
    `,
    alias: "r",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  lotes: {
    tabla: "lotes",
    pk: "id_lote",
    permiso: "Lotes",
    campos: [
      "codigo_lote", "id_marca", "id_pedido", "id_referencia", "fecha_recepcion",
      "fecha_inicio", "fecha_finalizacion", "cantidad_programada", "cantidad_recibida",
      "observaciones", "estado",
    ],
    obligatorios: ["codigo_lote", "id_marca", "fecha_recepcion"],
    buscables: ["codigo_lote", "observaciones"],
    filtros: ["estado", "id_marca", "fecha_recepcion"],
    orden: "fecha_recepcion DESC, codigo_lote DESC",
    vista: `
      SELECT l.*, m.nombre AS nombre_marca, p.numero_pedido, rf.codigo AS codigo_referencia
      FROM lotes l
      JOIN marcas m ON m.id_marca = l.id_marca
      LEFT JOIN pedidos p ON p.id_pedido = l.id_pedido
      LEFT JOIN referencias rf ON rf.id_referencia = l.id_referencia
    `,
    alias: "l",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  pedidos: {
    tabla: "pedidos",
    pk: "id_pedido",
    permiso: "Pedidos",
    campos: [
      "numero_pedido", "id_cliente", "id_marca", "fecha_pedido",
      "fecha_entrega_programada", "fecha_entrega_real", "estado", "observaciones",
    ],
    obligatorios: ["numero_pedido", "id_cliente", "fecha_pedido"],
    buscables: ["numero_pedido", "observaciones"],
    filtros: ["estado", "id_cliente", "id_marca"],
    orden: "fecha_pedido DESC",
    vista: `
      SELECT p.*,
             COALESCE(c.razon_social, CONCAT(COALESCE(c.nombres,''),' ',COALESCE(c.apellidos,''))) AS nombre_cliente,
             m.nombre AS nombre_marca
      FROM pedidos p
      JOIN clientes c ON c.id_cliente = p.id_cliente
      LEFT JOIN marcas m ON m.id_marca = p.id_marca
    `,
    alias: "p",
  },

  "fichas-tecnicas": {
    tabla: "fichas_tecnicas",
    pk: "id_ficha_tecnica",
    permiso: "Fichas Tecnicas",
    campos: [
      "id_referencia", "codigo_ficha", "version", "descripcion", "material_principal",
      "ruta_imagen", "ruta_documento_pdf", "sam_pactado", "personal_requerido",
      "estado", "fecha_vigencia",
    ],
    obligatorios: ["id_referencia", "codigo_ficha", "version"],
    buscables: ["codigo_ficha", "descripcion", "material_principal"],
    filtros: ["estado", "id_referencia"],
    orden: "codigo_ficha ASC, version DESC",
    vista: `
      SELECT f.*, r.codigo AS codigo_referencia, r.nombre AS nombre_referencia,
             m.nombre AS nombre_marca
      FROM fichas_tecnicas f
      JOIN referencias r ON r.id_referencia = f.id_referencia
      JOIN marcas m ON m.id_marca = r.id_marca
    `,
    alias: "f",
    softDelete: { columna: "estado", valor: "INACTIVA" },
  },

  prendas: {
    tabla: "prendas",
    pk: "id_prenda",
    permiso: "Prendas",
    campos: [
      "id_referencia", "id_tipo_prenda", "id_talla", "id_color",
      "sku", "nombre", "descripcion", "estado",
    ],
    obligatorios: ["id_referencia", "id_tipo_prenda", "id_talla", "id_color", "sku", "nombre"],
    buscables: ["sku", "nombre", "descripcion"],
    filtros: ["estado", "id_referencia", "id_tipo_prenda", "id_talla", "id_color"],
    orden: "sku ASC",
    vista: `
      SELECT p.*, r.codigo AS codigo_referencia, t.nombre AS nombre_talla,
             c.nombre AS nombre_color, c.codigo_hex, tp.nombre AS nombre_tipo_prenda
      FROM prendas p
      JOIN referencias r ON r.id_referencia = p.id_referencia
      JOIN tallas t ON t.id_talla = p.id_talla
      JOIN colores c ON c.id_color = p.id_color
      JOIN tipos_prenda tp ON tp.id_tipo_prenda = p.id_tipo_prenda
    `,
    alias: "p",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  operarios: {
    tabla: "operarios",
    pk: "id_operario",
    permiso: "Operarios",
    campos: [
      "id_usuario", "codigo_operario", "tipo_documento", "numero_documento",
      "nombres", "apellidos", "telefono", "correo", "fecha_ingreso",
      "cargo", "especialidad", "estado",
    ],
    obligatorios: ["codigo_operario", "numero_documento", "nombres", "apellidos", "fecha_ingreso"],
    buscables: ["codigo_operario", "nombres", "apellidos", "numero_documento"],
    filtros: ["estado", "cargo"],
    orden: "nombres ASC, apellidos ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  modulos: {
    tabla: "modulos",
    pk: "id_modulo",
    permiso: "Modulos",
    campos: [
      "codigo", "nombre", "ubicacion", "capacidad_operarios", "horas_jornada",
      "horas_semanales", "eficiencia_esperada", "umbral_cumplimiento",
      "orden_visual", "estado", "observaciones",
    ],
    obligatorios: ["codigo", "nombre"],
    buscables: ["codigo", "nombre", "ubicacion"],
    filtros: ["estado", "ubicacion"],
    orden: "orden_visual ASC, codigo ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  "asignaciones-modulo": {
    tabla: "asignaciones_modulo",
    pk: "id_asignacion",
    permiso: "Asignaciones",
    campos: [
      "id_modulo", "id_operario", "fecha_inicio", "fecha_fin",
      "turno", "rol_asignacion", "estado", "observaciones",
    ],
    obligatorios: ["id_modulo", "id_operario", "fecha_inicio", "turno"],
    buscables: ["observaciones"],
    filtros: ["estado", "id_modulo", "id_operario", "rol_asignacion", "turno"],
    orden: "fecha_inicio DESC",
    vista: `
      SELECT a.*, m.codigo AS codigo_modulo, m.nombre AS nombre_modulo,
             o.codigo_operario, o.nombres, o.apellidos, o.cargo
      FROM asignaciones_modulo a
      JOIN modulos m ON m.id_modulo = a.id_modulo
      JOIN operarios o ON o.id_operario = a.id_operario
    `,
    alias: "a",
    softDelete: { columna: "estado", valor: "CANCELADA" },
  },

  causas: {
    tabla: "causas_desviacion",
    pk: "id_causa",
    permiso: "Causas",
    campos: ["codigo", "nombre", "tipo", "responsable", "requiere_nota", "orden_visual", "estado"],
    obligatorios: ["codigo", "nombre", "tipo"],
    buscables: ["codigo", "nombre", "responsable"],
    filtros: ["estado", "tipo"],
    orden: "orden_visual ASC, nombre ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  tallas: {
    tabla: "tallas",
    pk: "id_talla",
    permiso: "Prendas",
    campos: ["nombre", "orden_visual", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre"],
    filtros: ["estado"],
    orden: "orden_visual ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  colores: {
    tabla: "colores",
    pk: "id_color",
    permiso: "Prendas",
    campos: ["nombre", "codigo_hex", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre"],
    filtros: ["estado"],
    orden: "nombre ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  "tipos-prenda": {
    tabla: "tipos_prenda",
    pk: "id_tipo_prenda",
    permiso: "Prendas",
    campos: ["nombre", "descripcion", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre", "descripcion"],
    filtros: ["estado"],
    orden: "nombre ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },
};
