import { queryOne } from "./db.js";
import { generarCodigoModulo, generarCodigoOperario, ordenModulosSql } from "../lib/codigos.js";
import { enlacesDe } from "../lib/enlaces.js";
import { ApiError } from "../lib/http.js";
import { prepararIdentidad } from "../lib/identidad.js";
import { generarCodigoLote, prepararLote } from "../lib/lotes.js";
import { ordenTallasSql } from "../lib/tallas.js";
import { buscarUbicacion } from "../lib/ubicaciones.js";

/**
 * Si `clientes` ya tiene las columnas `departamento` y `municipio`
 * (migracion `00l`). Entre desplegar el codigo y aplicar la migracion, el
 * backend corre sobre la tabla vieja: en vez de fallar al guardar un cliente
 * ("Unknown column"), no guarda la ubicacion y avisa una vez. Mientras
 * faltan se vuelve a mirar cada minuto, para notar la migracion sin reiniciar.
 */
const ubicacionDeClientes = { disponible: false, revisadaEn: 0, avisada: false };

async function clientesTienenUbicacion() {
  if (ubicacionDeClientes.disponible) return true;
  if (Date.now() - ubicacionDeClientes.revisadaEn < 60_000) return false;

  const fila = await queryOne(
    `SELECT COUNT(*) AS total FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clientes'
        AND COLUMN_NAME IN ('departamento', 'municipio')`,
  );
  ubicacionDeClientes.revisadaEn = Date.now();
  ubicacionDeClientes.disponible = Number(fila?.total) === 2;

  if (!ubicacionDeClientes.disponible && !ubicacionDeClientes.avisada) {
    ubicacionDeClientes.avisada = true;
    console.warn(
      "[BGoat] La tabla clientes no tiene departamento ni municipio: falta aplicar " +
        "database/00l_migracion_cliente_ubicacion.sql. Mientras tanto la ubicación no se guarda.",
    );
  }
  return ubicacionDeClientes.disponible;
}

/**
 * Documento, correo y telefono del cliente, y su departamento y municipio.
 * Lo que no cambio no se vuelve a juzgar (ver `prepararIdentidad`).
 */
async function prepararCliente(datos, { id }) {
  const conUbicacion = await clientesTienenUbicacion();

  const existente = id
    ? await queryOne(
        `SELECT tipo_documento, numero_documento, correo, telefono${conUbicacion ? ", departamento, municipio" : ""}
           FROM clientes WHERE id_cliente = ?`,
        [id],
      )
    : null;

  // Sin las columnas no hay donde guardar la ubicacion: se descarta.
  const { departamento: _departamento, municipio: _municipio, ...sinUbicacion } = datos;
  const listo = prepararIdentidad(conUbicacion ? datos : sinUbicacion, {
    existente,
    tiposValidos: ["CC", "CE", "NIT", "PASAPORTE", "OTRO"],
    tipoPorDefecto: "NIT",
  });

  if (listo.departamento === undefined && listo.municipio === undefined) return listo;

  // Departamento y municipio van juntos y el municipio tiene que ser de ese
  // departamento. Se guardan con su escritura oficial ("Bogotá D.C.").
  const departamento = listo.departamento !== undefined ? listo.departamento : existente?.departamento;
  const municipio = listo.municipio !== undefined ? listo.municipio : existente?.municipio;
  if (!departamento && !municipio) return { ...listo, departamento: null, municipio: null };
  if (!departamento || !municipio) {
    throw ApiError.badRequest("Elige el departamento y el municipio: van juntos");
  }
  const oficial = buscarUbicacion(departamento, municipio);
  if (!oficial) throw ApiError.badRequest("El municipio no pertenece a ese departamento");
  return { ...listo, ...oficial };
}

/** Documento, correo y telefono del operario. */
async function prepararOperario(datos, { id }) {
  const existente = id
    ? await queryOne(
        `SELECT tipo_documento, numero_documento, correo, telefono
           FROM operarios WHERE id_operario = ?`,
        [id],
      )
    : null;

  return prepararIdentidad(datos, {
    existente,
    tiposValidos: ["CC", "CE", "TI", "PASAPORTE", "OTRO"],
    tipoPorDefecto: "CC",
  });
}

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
 *   antesDeGuardar -> hook async opcional, ver `lib/crud.js`
 *   consecutivo -> campo que asigna el servidor al crear, ver `lib/crud.js`
 *
 * `crudFactory` construye el router a partir de esto, de modo que agregar
 * un recurso no implique escribir un archivo nuevo.
 *
 * Los recursos con logica propia no estan aqui: la captura, la jornada,
 * las ordenes, los usuarios, los roles y los indicadores tienen su
 * archivo en `routes/`.
 *
 * `enlaces` (ver `lib/enlaces.js`) dice que mantiene en uso a un registro:
 * mientras algo lo mantenga, no se puede eliminar ni dejar inactivo.
 */
export const recursos = {
  /**
   * Cliente: para quien se confecciona.
   *
   * `nombre` es "Nombre o razon social": un solo campo, el nombre con que la
   * planta lo conoce (la marca, la empresa o la persona), y es lo unico
   * obligatorio: cuando llega un lote a media manana, la digitadora tiene
   * que poder registrar el cliente con lo que trae la hoja, sin buscar el
   * NIT. La columna `razon_social` ya no se escribe ni se muestra; se deja
   * en la tabla para no perder lo que ya habia.
   */
  clientes: {
    tabla: "clientes",
    pk: "id_cliente",
    permiso: "Clientes",
    campos: [
      "nombre", "tipo_documento", "numero_documento", "correo", "telefono",
      "direccion", "departamento", "municipio", "estado", "descripcion",
    ],
    obligatorios: ["nombre"],
    buscables: ["nombre", "numero_documento", "correo"],
    filtros: ["estado", "tipo_documento"],
    orden: "nombre ASC",
    antesDeGuardar: prepararCliente,
    enlaces: enlacesDe.clientes,
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * El lote es la unica entidad del producto: absorbio al pedido (folio),
   * a la referencia, a la ficha tecnica (SAM, valor de maquila, imagen y
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
    // `estado` NO esta aqui: ya no se digita. Pendiente es donde nace,
    // En proceso lo pone el backend al abrir jornada, y Finalizado lo
    // pone solo al completarse la cantidad programada (ver
    // `captura.routes.js`). `activo` si es editable: es el apagado del
    // lote, una pregunta aparte de en que va su produccion.
    //
    // `cantidad_programada` tampoco esta aqui: es la suma del desglose
    // por talla y color, y la escribe solo `PUT /lotes/:id/detalle`
    // (ver `lotes.routes.js`). `fecha_entrega_programada` tampoco: la
    // escribe solo el plan de produccion (`lib/plan.js`) cuando su orden
    // inicia jornada, con la formula de German. Dejarlas aqui
    // permitia que cualquiera las pisara por este CRUD generico, sin
    // pasar por ninguna de las dos reglas.
    //
    // `codigo_lote` tampoco: no se digita, lo asigna el sistema al crear
    // (`consecutivo`, abajo) y despues no cambia. Un cliente que lo mande
    // es ignorado, igual que `numero_orden` en las ordenes.
    //
    // `cantidad_recibida` tampoco: lo que llego es exactamente lo que se
    // desgloso por talla y color, el mismo numero que
    // `cantidad_programada`, y lo escribe la misma ruta del desglose.
    campos: [
      "numero_pedido", "id_cliente", "codigo_referencia",
      "nombre_referencia", "id_tipo_prenda", "sam_pactado", "valor_maquila_unidad",
      "fecha_recepcion", "observaciones", "activo",
    ],
    obligatorios: ["id_cliente", "fecha_recepcion"],
    // Lo que identifica al lote es el numero de pedido, el codigo de
    // referencia o el nombre de la referencia: segun lo que traiga la hoja
    // del cliente, basta con uno (ver `lib/lotes.js`). Ahi mismo se
    // guardan los codigos en mayusculas.
    antesDeGuardar: prepararLote,
    // Un lote con ordenes sin terminar o con la jornada abierta sigue en uso.
    enlaces: enlacesDe.lotes,
    // El codigo de lote es el consecutivo del año: LT-2026-0001, 0002...
    consecutivo: { campo: "codigo_lote", generar: generarCodigoLote },
    buscables: [
      "codigo_lote", "numero_pedido", "codigo_referencia", "nombre_referencia",
      "observaciones",
    ],
    filtros: ["estado", "activo", "id_cliente", "id_tipo_prenda", "fecha_recepcion"],
    orden: "fecha_recepcion DESC, codigo_lote DESC",
    vista: `
      SELECT l.*, c.nombre AS nombre_cliente, tp.nombre AS nombre_tipo_prenda
      FROM lotes l
      JOIN clientes c ON c.id_cliente = l.id_cliente
      LEFT JOIN tipos_prenda tp ON tp.id_tipo_prenda = l.id_tipo_prenda
    `,
    alias: "l",
    softDelete: { columna: "activo", valor: 0 },
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
    // El orden ya no se digita: sale del nombre (letras, numericas de adulto,
    // bebes, ninos), ver `lib/tallas.js`. `orden_visual` queda sin usarse.
    campos: ["nombre", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre"],
    filtros: ["estado"],
    orden: ordenTallasSql("nombre"),
    enlaces: enlacesDe.tallas,
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
    enlaces: enlacesDe.colores,
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
    enlaces: enlacesDe["tipos-prenda"],
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  operarios: {
    tabla: "operarios",
    pk: "id_operario",
    permiso: "Operarios",
    // `codigo_operario` no se digita: lo asigna el sistema al crear (OP-001,
    // OP-002...) y despues no cambia, igual que el codigo del lote.
    campos: [
      "id_usuario", "tipo_documento", "numero_documento",
      "nombres", "apellidos", "telefono", "correo", "fecha_ingreso",
      "cargo", "estado",
    ],
    obligatorios: ["numero_documento", "nombres", "apellidos", "fecha_ingreso"],
    buscables: ["codigo_operario", "nombres", "apellidos", "numero_documento"],
    filtros: ["estado", "cargo"],
    orden: "nombres ASC, apellidos ASC",
    antesDeGuardar: prepararOperario,
    consecutivo: { campo: "codigo_operario", generar: generarCodigoOperario },
    // Una operaria retirada tampoco puede estar en la nomina de una jornada abierta.
    enlaces: enlacesDe.operarios,
    estadosInactivos: ["INACTIVO", "RETIRADO"],
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  modulos: {
    tabla: "modulos",
    pk: "id_modulo",
    permiso: "Modulos",
    // Solo dos parametros configurables: cuantos puestos tiene y bajo que
    // % se pide la incidencia. Las horas del dia y la eficiencia salen de
    // lo capturado; tenerlas tambien escritas a mano las contradecia.
    //
    // `codigo` no se digita: lo asigna el sistema al crear (MOD-01, MOD-02...)
    // y despues no cambia. `ubicacion` y `orden_visual` ya no se piden (la
    // primera era un texto suelto que solo se mostraba; el orden sale del
    // codigo, ver `ordenModulosSql`): las columnas quedan en la tabla, sin usarse.
    campos: [
      "nombre", "capacidad_operarios",
      "umbral_cumplimiento", "estado", "observaciones",
    ],
    obligatorios: ["nombre"],
    buscables: ["codigo", "nombre"],
    filtros: ["estado"],
    orden: ordenModulosSql("codigo"),
    consecutivo: { campo: "codigo", generar: generarCodigoModulo },
    // Con la jornada abierta el modulo esta trabajando: no sale de servicio.
    enlaces: enlacesDe.modulos,
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * El catalogo de incidencias que la digitadora ve como botones.
   *
   * `codigo` ES el nombre de la causa; `descripcion` es la explicacion
   * larga y es opcional. El responsable ya no es texto libre: apunta al
   * catalogo `responsables`, y la vista trae su nombre para el listado.
   */
  causas: {
    tabla: "causas_desviacion",
    pk: "id_causa",
    permiso: "Causas",
    // Sin "orden en pantalla": las incidencias salen por orden alfabetico, en
    // la captura y en el listado. `orden_visual` queda en la tabla, sin usarse.
    campos: ["codigo", "descripcion", "tipo", "id_responsable", "requiere_nota", "estado"],
    obligatorios: ["codigo", "tipo"],
    buscables: ["codigo", "descripcion", "nombre_responsable"],
    filtros: ["estado", "tipo", "id_responsable"],
    orden: "codigo ASC",
    vista: `
      SELECT c.*, r.nombre AS nombre_responsable
      FROM causas_desviacion c
      LEFT JOIN responsables r ON r.id_responsable = c.id_responsable
    `,
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * Quien responde por una incidencia (Produccion, Mantenimiento...).
   *
   * No tiene pantalla propia: se escoge y se agrega dentro del formulario
   * de la causa, igual que el tipo de prenda dentro del lote. Por eso lo
   * protege el permiso de Causas.
   */
  responsables: {
    tabla: "responsables",
    pk: "id_responsable",
    permiso: "Causas",
    campos: ["nombre", "estado"],
    obligatorios: ["nombre"],
    buscables: ["nombre"],
    filtros: ["estado"],
    orden: "nombre ASC",
    enlaces: enlacesDe.responsables,
    softDelete: { columna: "estado", valor: "INACTIVO" },
  },

  /**
   * Calendario de festivos y cierres -> tabla `dias_no_laborales`.
   *
   * Antes el sistema solo sabia que domingo no se trabaja (por la
   * ausencia de fila en `jornada_dia`); esto son fechas sueltas que se
   * restan al estimar cuando estaria lista una orden. La llave es la
   * propia fecha: no tiene sentido repetir el mismo dia dos veces.
   */
  "dias-no-laborales": {
    tabla: "dias_no_laborales",
    pk: "fecha",
    permiso: "Ordenes",
    campos: ["fecha", "descripcion"],
    obligatorios: ["fecha"],
    buscables: ["descripcion"],
    orden: "fecha ASC",
  },
};
