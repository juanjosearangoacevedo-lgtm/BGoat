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
 *
 * Los recursos con logica propia no estan aqui: la captura, la jornada,
 * las ordenes, los usuarios, los roles y los indicadores tienen su
 * archivo en `routes/`.
 */
export const recursos = {
  /**
   * Cliente-marca: para quien se confecciona.
   *
   * `nombre` es como la planta lo nombra (la marca, casi siempre) y es
   * lo unico obligatorio: cuando llega un lote a media manana, la
   * digitadora tiene que poder registrar el cliente con el nombre que
   * trae la hoja, sin buscar el NIT.
   */
  clientes: {
    tabla: "clientes",
    pk: "id_cliente",
    permiso: "Clientes",
    campos: [
      "nombre", "descripcion", "razon_social", "tipo_documento", "numero_documento",
      "telefono", "correo", "direccion", "estado",
    ],
    obligatorios: ["nombre"],
    buscables: ["nombre", "razon_social", "numero_documento", "correo"],
    filtros: ["estado", "tipo_documento"],
    orden: "nombre ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * El lote es la unica entidad del producto: absorbio al pedido (folio y
   * fechas), a la referencia, a la ficha tecnica (SAM, material, imagen y
   * PDF) y al tipo de prenda. Antes eso eran cinco pantallas distintas
   * para registrar un solo trabajo que llega en una sola hoja.
   *
   * `ruta_imagen` y `ruta_documento_pdf` no estan en `campos` a
   * proposito: no se digitan, las escribe POST /lotes/:id/ficha cuando se
   * sube el archivo.
   */
  lotes: {
    tabla: "lotes",
    pk: "id_lote",
    permiso: "Lotes",
    campos: [
      "codigo_lote", "numero_pedido", "id_cliente", "codigo_referencia",
      "nombre_referencia", "id_tipo_prenda", "sam_pactado", "material_principal",
      "fecha_pedido", "fecha_recepcion", "fecha_entrega_programada",
      "fecha_entrega_real", "fecha_inicio", "fecha_finalizacion",
      "cantidad_programada", "cantidad_recibida", "observaciones", "estado",
    ],
    obligatorios: ["codigo_lote", "id_cliente", "fecha_recepcion"],
    buscables: [
      "codigo_lote", "numero_pedido", "codigo_referencia", "nombre_referencia",
      "material_principal", "observaciones",
    ],
    filtros: ["estado", "id_cliente", "id_tipo_prenda", "fecha_recepcion"],
    orden: "fecha_recepcion DESC, codigo_lote DESC",
    vista: `
      SELECT l.*, c.nombre AS nombre_cliente, tp.nombre AS nombre_tipo_prenda
      FROM lotes l
      JOIN clientes c ON c.id_cliente = l.id_cliente
      LEFT JOIN tipos_prenda tp ON tp.id_tipo_prenda = l.id_tipo_prenda
    `,
    alias: "l",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * Catalogos del producto.
   *
   * No tienen pantalla propia: viven dentro del formulario del lote (el
   * tipo de prenda del lote, y las tallas y colores de su desglose). Por
   * eso los protege el permiso de Lotes y no uno propio: quien puede
   * registrar un lote puede agregarle la talla que le falte sin pedirle
   * permiso a nadie.
   */
  tallas: {
    tabla: "tallas",
    pk: "id_talla",
    permiso: "Lotes",
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
    permiso: "Lotes",
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
    permiso: "Lotes",
    campos: ["nombre", "descripcion", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre", "descripcion"],
    filtros: ["estado"],
    orden: "nombre ASC",
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
    // Solo dos parametros configurables: cuantos puestos tiene y bajo que
    // % se pide la incidencia. Las horas del dia y la eficiencia salen de
    // lo capturado; tenerlas tambien escritas a mano las contradecia.
    campos: [
      "codigo", "nombre", "ubicacion", "capacidad_operarios",
      "umbral_cumplimiento", "orden_visual", "estado", "observaciones",
    ],
    obligatorios: ["codigo", "nombre"],
    buscables: ["codigo", "nombre", "ubicacion"],
    filtros: ["estado", "ubicacion"],
    orden: "orden_visual ASC, codigo ASC",
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /** El catalogo de incidencias que la digitadora ve como botones. */
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
};
