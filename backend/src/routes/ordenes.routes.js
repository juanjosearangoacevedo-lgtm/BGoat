import { Router } from "express";
import { execute, query, queryOne } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { filtrosDeListado } from "../lib/filtros.js";
import { requierePermiso } from "../middleware/auth.js";

export const ordenesRouter = Router();

/**
 * Orden de produccion: el compromiso sobre un lote.
 *
 * NO NOMBRA MODULO. Nace libre y espera en el tablero a que un modulo la
 * tome, y eso pasa en un solo sitio: al abrir la jornada. `id_modulo` y
 * `codigo_modulo` siguen apareciendo en el listado porque `vw_avance_orden`
 * los deduce de quien la tomo, pero no se pueden escribir desde aqui.
 *
 * Ya no lleva ficha tecnica ni pedido. La ficha vive dentro del lote
 * (con su SAM, su imagen y su valor de maquila) y el pedido dejo de
 * existir; la orden ya no aporta nada al calculo de la hora, solo
 * programa fechas, prioridad y estado sobre un lote que ya trae todo lo
 * que hace falta para medir productividad y facturacion.
 *
 * Tampoco lleva detalle por prenda: la produccion se mide por lote, no
 * por talla y color, que es como se mide en planta.
 *
 * `cantidad_programada` y `valor_maquila_unidad` NO vienen en `CAMPOS`:
 * un lote corre en una sola orden, asi que las dos ya estan en el lote
 * (`cantidad_programada`, `valor_maquila_unidad`) y pedirlas otra vez
 * aqui solo abria la puerta a que las cifras se desincronizaran. Las dos
 * se copian del lote al crear la orden, no se digitan.
 *
 * `numero_orden` tampoco viene en `CAMPOS`: no tiene sentido pedirle a
 * quien esta creando la orden que invente un consecutivo sin duplicarse
 * con el resto de la planta. Lo genera `generarNumeroOrden()` al crear.
 *
 * `prioridad` tampoco: ya no es BAJA/MEDIA/ALTA/URGENTE a elegir, es la
 * posicion en la cola global (la orden mas vieja es la numero mas baja).
 * La asigna `siguientePrioridad()` al crear, y no se vuelve a tocar.
 *
 * `eficiencia_esperada` si viene en `CAMPOS` y si se edita libremente:
 * es un supuesto de planeacion (que tan bien le va a ir al modulo que
 * la tome), no una eficiencia declarada de forma fija. El frontend la
 * usa para estimar una fecha de entrega; la eficiencia real se sigue
 * midiendo sola en los indicadores, esto nunca la reemplaza.
 *
 * `estado` tampoco viene en `CAMPOS`: ya no se escoge nada a mano, ni
 * siquiera Pendiente/En proceso. Pendiente es donde nace, En proceso lo
 * pone este mismo archivo... no, lo pone `jornada.routes.js` cuando un
 * modulo toma la orden, y Finalizado lo pone `captura.routes.js` al
 * completarse la cantidad programada.
 *
 * `fecha_inicio_programada` y `fecha_fin_programada` SI vienen en
 * `CAMPOS`, pero tampoco se digitan: el frontend las calcula (inicio =
 * recepcion del lote, fin = la fecha estimada con SAM + eficiencia
 * esperada + dias no laborales) y las manda ya resueltas. Al guardarlas,
 * `fecha_fin_programada` se copia a `lotes.fecha_entrega_programada`
 * (ver `sincronizarEntregaLote`): es el mismo compromiso visto desde el
 * lote.
 */
const CAMPOS = [
  "id_lote",
  "fecha_inicio_programada", "fecha_fin_programada", "eficiencia_esperada",
  "observaciones",
];

/** El compromiso de entrega del lote es el fin estimado de su orden. */
async function sincronizarEntregaLote(idLote, fechaFinProgramada) {
  if (!idLote || !fechaFinProgramada) return;
  await execute("UPDATE lotes SET fecha_entrega_programada = ? WHERE id_lote = ?", [
    fechaFinProgramada,
    idLote,
  ]);
}

/**
 * El siguiente consecutivo del año: OP-2026-0001, OP-2026-0002...
 *
 * Busca el ultimo de este año por orden alfabetico (equivale al numerico
 * porque el sufijo siempre tiene el mismo ancho) y le suma uno. Arranca en
 * 1 el primer dia del año, porque el LIKE no encuentra nada del año nuevo.
 */
async function generarNumeroOrden() {
  const anio = new Date().getFullYear();
  const prefijo = `OP-${anio}-`;
  const ultima = await queryOne(
    `SELECT numero_orden FROM ordenes_produccion
      WHERE numero_orden LIKE ?
      ORDER BY numero_orden DESC LIMIT 1`,
    [`${prefijo}%`],
  );
  const siguiente = ultima ? Number(ultima.numero_orden.slice(prefijo.length)) + 1 : 1;
  return `${prefijo}${String(siguiente).padStart(4, "0")}`;
}

/** La siguiente posicion de la cola global: el consecutivo mas alto mas uno. */
async function siguientePrioridad() {
  const ultima = await queryOne("SELECT COALESCE(MAX(prioridad), 0) AS maxima FROM ordenes_produccion");
  return Number(ultima.maxima) + 1;
}

const limpiar = (cuerpo = {}) => {
  const datos = {};
  CAMPOS.forEach((campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
      datos[campo] = cuerpo[campo] === "" ? null : cuerpo[campo];
    }
  });
  return datos;
};

// --- Listado (vista con el avance real) --------------------------------
ordenesRouter.get(
  "/",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    // `id_modulo` filtra por el modulo que la TOMO, que es lo que la
    // vista calcula; `asignacion` separa las libres de las tomadas.
    const { where, valores } = filtrosDeListado(req.query, {
      buscarEn: [
        "numero_orden", "codigo_lote", "nombre_cliente",
        "codigo_referencia", "codigo_modulo",
      ],
      iguales: ["estado", "id_modulo", "id_cliente", "id_lote", "prioridad", "asignacion"],
    });
    const datos = await query(
      `SELECT * FROM vw_avance_orden ${where} ORDER BY fecha_emision DESC`,
      valores,
    );
    res.json({ datos, total: datos.length });
  }),
);

// --- Detalle completo --------------------------------------------------
ordenesRouter.get(
  "/:id",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    const orden = await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [
      req.params.id,
    ]);
    if (!orden) throw ApiError.notFound();

    const [registros, jornadas] = await Promise.all([
      query(
        `SELECT * FROM vw_registro_horario
         WHERE id_orden_produccion = ?
         ORDER BY fecha DESC, hora_jornada DESC
         LIMIT 60`,
        [req.params.id],
      ),
      // Los dias que la digitadora trabajo esta orden, con su nomina.
      query(
        `SELECT jm.id_jornada_modulo, jm.fecha, jm.cantidad_operarias, jm.estado,
                COUNT(jo.id_jornada_operaria) AS operarias_identificadas
         FROM jornada_modulo jm
         LEFT JOIN jornada_operaria jo ON jo.id_jornada_modulo = jm.id_jornada_modulo
                                      AND jo.id_operario IS NOT NULL
         WHERE jm.id_orden_produccion = ?
         GROUP BY jm.id_jornada_modulo, jm.fecha, jm.cantidad_operarias, jm.estado
         ORDER BY jm.fecha DESC`,
        [req.params.id],
      ),
    ]);

    res.json({ ...orden, registros, jornadas });
  }),
);

// --- Crear -------------------------------------------------------------
ordenesRouter.post(
  "/",
  requierePermiso("Ordenes", "CREAR"),
  asyncHandler(async (req, res) => {
    const datos = limpiar(req.body);

    const faltantes = ["id_lote"].filter((campo) => !datos[campo]);
    if (faltantes.length > 0) {
      throw ApiError.badRequest(`Faltan campos obligatorios: ${faltantes.join(", ")}`);
    }

    // La cantidad de la orden es la del lote: un lote corre en una sola
    // orden, asi que no se le pide al usuario, se copia.
    const lote = await queryOne("SELECT cantidad_programada FROM lotes WHERE id_lote = ?", [
      datos.id_lote,
    ]);
    if (!lote) throw ApiError.badRequest("El lote seleccionado no existe");
    // Sin desglose por talla y color no hay cantidad que copiar -y
    // `ordenes_produccion` exige cantidad_programada > 0-: mejor este
    // mensaje que el error crudo del CHECK de la base.
    if (!(Number(lote.cantidad_programada) > 0)) {
      throw ApiError.badRequest(
        "Ese lote todavia no tiene desglose por talla y color: agreguelo antes de crear la orden",
      );
    }
    datos.cantidad_programada = lote.cantidad_programada;

    // `creado_por` sale de la sesion, no del formulario.
    datos.creado_por = req.usuario.id_usuario;
    datos.prioridad = await siguientePrioridad();

    // Reintenta si dos personas crearon una orden en el mismo instante y
    // ambas calcularon el mismo consecutivo: el UNIQUE INDEX rechaza la
    // segunda, y aqui se le genera uno nuevo en vez de fallarle al usuario.
    let resultado;
    for (let intento = 0; ; intento++) {
      datos.numero_orden = await generarNumeroOrden();
      const columnas = Object.keys(datos);
      try {
        resultado = await execute(
          `INSERT INTO ordenes_produccion (${columnas.join(", ")})
           VALUES (${columnas.map(() => "?").join(", ")})`,
          columnas.map((columna) => datos[columna]),
        );
        break;
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY" && intento < 2) continue;
        throw error;
      }
    }

    // Si hay UNA sola jornada abierta corriendo ese lote sin orden, la
    // orden recien creada es la que le faltaba para poder facturar y se
    // la queda. Con dos o mas no se adivina: la orden se queda libre y la
    // toma quien corresponda al abrir la jornada.
    const huerfanas = await query(
      `SELECT id_jornada_modulo FROM jornada_modulo
        WHERE id_lote = ? AND id_orden_produccion IS NULL AND estado = 'ABIERTA'`,
      [datos.id_lote],
    );

    if (huerfanas.length === 1) {
      await execute("UPDATE jornada_modulo SET id_orden_produccion = ? WHERE id_jornada_modulo = ?", [
        resultado.insertId,
        huerfanas[0].id_jornada_modulo,
      ]);
    }

    await sincronizarEntregaLote(datos.id_lote, datos.fecha_fin_programada);

    res.status(201).json(
      await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [
        resultado.insertId,
      ]),
    );
  }),
);

// --- Actualizar --------------------------------------------------------
ordenesRouter.put(
  "/:id",
  requierePermiso("Ordenes", "EDITAR"),
  asyncHandler(async (req, res) => {
    const existente = await queryOne(
      "SELECT id_orden_produccion, id_lote, estado FROM ordenes_produccion WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    const datos = limpiar(req.body);

    // Si la orden cambia de lote, la cantidad se resincroniza con el
    // nuevo lote: sigue sin ser un dato que se digite.
    if (datos.id_lote) {
      const lote = await queryOne("SELECT cantidad_programada FROM lotes WHERE id_lote = ?", [
        datos.id_lote,
      ]);
      if (!lote) throw ApiError.badRequest("El lote seleccionado no existe");
      if (!(Number(lote.cantidad_programada) > 0)) {
        throw ApiError.badRequest(
          "Ese lote todavia no tiene desglose por talla y color: agreguelo antes de asignarlo a la orden",
        );
      }
      datos.cantidad_programada = lote.cantidad_programada;
    }

    const columnas = Object.keys(datos);

    if (columnas.length > 0) {
      await execute(
        `UPDATE ordenes_produccion SET ${columnas.map((c) => `${c} = ?`).join(", ")}
         WHERE id_orden_produccion = ?`,
        [...columnas.map((columna) => datos[columna]), req.params.id],
      );
    }

    await sincronizarEntregaLote(datos.id_lote ?? existente.id_lote, datos.fecha_fin_programada);

    res.json(
      await queryOne("SELECT * FROM vw_avance_orden WHERE id_orden_produccion = ?", [req.params.id]),
    );
  }),
);

// --- Eliminar ----------------------------------------------------------
ordenesRouter.delete(
  "/:id",
  requierePermiso("Ordenes", "ELIMINAR"),
  asyncHandler(async (req, res) => {
    const conProduccion = await queryOne(
      `SELECT COUNT(*) AS total FROM registros_horarios
       WHERE id_orden_produccion = ? AND estado <> 'ANULADO'`,
      [req.params.id],
    );

    // Regla del alcance: no se elimina una orden con produccion registrada.
    // Esa historia no se puede borrar, y la orden tampoco se puede marcar
    // Finalizada a mano para "cerrarla": Finalizado es automatico.
    if (conProduccion.total > 0) {
      throw ApiError.conflict(
        `No se puede eliminar: la orden tiene ${conProduccion.total} registro(s) de produccion, ` +
          "y esa historia no se borra.",
      );
    }

    const enJornada = await queryOne(
      "SELECT COUNT(*) AS total FROM jornada_modulo WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (enJornada.total > 0) {
      throw ApiError.conflict(
        "No se puede eliminar: hay jornadas configuradas con esta orden.",
      );
    }

    const existente = await queryOne(
      "SELECT id_orden_produccion FROM ordenes_produccion WHERE id_orden_produccion = ?",
      [req.params.id],
    );
    if (!existente) throw ApiError.notFound();

    await execute("DELETE FROM ordenes_produccion WHERE id_orden_produccion = ?", [req.params.id]);
    res.json({ eliminado: true, id_orden_produccion: Number(req.params.id) });
  }),
);

// --- Curva de arranque de la orden -------------------------------------
ordenesRouter.get(
  "/:id/curva",
  requierePermiso("Ordenes", "VER"),
  asyncHandler(async (req, res) => {
    res.json({
      datos: await query(
        `SELECT hora_desde_inicio, fecha, hora_jornada, unidades_producidas, eficiencia, codigo_causa
         FROM vw_curva_arranque WHERE id_orden_produccion = ? ORDER BY hora_desde_inicio`,
        [req.params.id],
      ),
    });
  }),
);
