import { Router } from "express";
import { execute, query, queryOne, transaction } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { fechaValida, hoy } from "../lib/fechas.js";
import { requierePermiso } from "../middleware/auth.js";

export const jornadaRouter = Router();


/**
 * Jornada de un modulo: lo que la digitadora configura al entrar.
 *
 *   POST /jornada                -> abrir (modulo + operarias + lote)
 *   GET  /jornada/opciones       -> todo lo que el asistente necesita, de un golpe
 *   GET  /jornada?fecha=         -> como esta la planta hoy
 *   GET  /jornada/modulo/:id     -> la jornada de un modulo (o null)
 *   PUT  /jornada/:id            -> cambiar lote, orden, cantidad, nomina
 *                                  u observaciones
 *   POST /jornada/:id/cerrar     -> cerrar el dia del modulo
 */

/** SELECT completo de una jornada, con lo que la pantalla necesita mostrar. */
const SELECT_JORNADA = `
  SELECT jm.id_jornada_modulo, jm.id_modulo, jm.fecha, jm.id_lote,
         jm.id_orden_produccion, jm.cantidad_operarias, jm.estado,
         jm.abierta_por, jm.fecha_apertura, jm.fecha_cierre, jm.observaciones,
         m.codigo AS codigo_modulo, m.nombre AS nombre_modulo,
         m.capacidad_operarios, m.umbral_cumplimiento,
         l.codigo_lote, l.codigo_referencia, l.nombre_referencia,
         l.sam_pactado, l.ruta_imagen, l.ruta_documento_pdf, l.cantidad_programada,
         c.id_cliente, c.nombre AS nombre_cliente,
         o.numero_orden, o.valor_maquila_unidad,
         CONCAT(u.nombres, ' ', u.apellidos) AS nombre_digitadora
  FROM jornada_modulo jm
  JOIN modulos m ON m.id_modulo = jm.id_modulo
  JOIN lotes l ON l.id_lote = jm.id_lote
  JOIN clientes c ON c.id_cliente = l.id_cliente
  JOIN usuarios u ON u.id_usuario = jm.abierta_por
  LEFT JOIN ordenes_produccion o ON o.id_orden_produccion = jm.id_orden_produccion
`;

/** La nomina de una jornada, con el nombre de quien esta identificada. */
async function operariasDe(idJornada) {
  return query(
    `SELECT jo.id_jornada_operaria, jo.numero, jo.id_operario,
            op.codigo_operario, op.nombres, op.apellidos, op.especialidad
     FROM jornada_operaria jo
     LEFT JOIN operarios op ON op.id_operario = jo.id_operario
     WHERE jo.id_jornada_modulo = ?
     ORDER BY jo.numero`,
    [idJornada],
  );
}

/**
 * La orden que cubre ese lote en ese modulo.
 *
 * La digitadora escoge cliente y lote, no orden: la orden es un dato
 * administrativo y de ella solo sale el valor de maquila. Si todavia no
 * existe, la jornada arranca igual --con la meta, que sale del SAM del
 * lote-- y la facturacion queda en cero hasta que alguien la cree.
 *
 * La orden NO nombra modulo: nace libre y este es el unico sitio donde
 * un modulo la toma.
 */
const SELECT_ORDEN_TOMADA = `
  LEFT JOIN (
    SELECT id_orden_produccion, MIN(id_modulo) AS id_modulo
    FROM jornada_modulo
    WHERE id_orden_produccion IS NOT NULL
    GROUP BY id_orden_produccion
  ) tom ON tom.id_orden_produccion = o.id_orden_produccion
`;

/**
 * Las ordenes de ese lote que este modulo puede tomar.
 *
 * Son las que estan libres, mas la que este mismo modulo ya tomo (para
 * que reabrir o corregir la jornada no se quede sin orden). Las que tomo
 * otro modulo no aparecen: una orden la trabaja un solo modulo.
 */
async function ordenesDisponiblesDelLote(idLote, idModulo) {
  return query(
    `SELECT o.id_orden_produccion, o.numero_orden, o.valor_maquila_unidad,
            o.prioridad, o.estado, o.cantidad_programada,
            tom.id_modulo AS tomada_por
     FROM ordenes_produccion o
     ${SELECT_ORDEN_TOMADA}
     WHERE o.id_lote = ? AND o.estado NOT IN ('CANCELADA', 'FINALIZADA')
       AND (tom.id_modulo IS NULL OR tom.id_modulo = ?)
     ORDER BY FIELD(o.estado, 'EN_PROCESO', 'PENDIENTE', 'PAUSADA'), o.fecha_emision ASC`,
    [idLote, idModulo],
  );
}

/**
 * El modulo que ya tomo esa orden, o null si sigue libre.
 *
 * Es la regla del negocio: una orden la toma un modulo y desde ahi
 * ningun otro puede cogerla. No es una restriccion de la base porque el
 * mismo modulo abre una jornada por dia sobre la misma orden --serian
 * varias filas legitimas--; lo que no puede haber es DOS modulos.
 */
async function moduloQueTomoLaOrden(idOrden) {
  const fila = await queryOne(
    `SELECT jm.id_modulo, m.codigo
     FROM jornada_modulo jm
     JOIN modulos m ON m.id_modulo = jm.id_modulo
     WHERE jm.id_orden_produccion = ?
     ORDER BY jm.fecha ASC
     LIMIT 1`,
    [idOrden],
  );
  return fila ?? null;
}

/**
 * Resuelve que orden se lleva la jornada de este modulo sobre este lote.
 *
 * Si la digitadora escogio una, se valida que este libre (o que ya sea de
 * este modulo). Si no escogio, se toma la primera disponible: con una
 * sola orden por lote --el caso normal-- no tiene sentido preguntarselo.
 */
async function resolverOrden(idLote, idModulo, idOrdenPedida) {
  if (idOrdenPedida) {
    const duena = await moduloQueTomoLaOrden(idOrdenPedida);
    if (duena && Number(duena.id_modulo) !== Number(idModulo)) {
      throw ApiError.conflict(
        `Esa orden ya la tomo el modulo ${duena.codigo}: una orden la trabaja un solo modulo`,
        { id_orden_produccion: Number(idOrdenPedida), id_modulo: duena.id_modulo },
      );
    }

    const suya = await queryOne(
      "SELECT id_orden_produccion FROM ordenes_produccion WHERE id_orden_produccion = ? AND id_lote = ?",
      [idOrdenPedida, idLote],
    );
    if (!suya) throw ApiError.badRequest("Esa orden no es de ese lote");

    return Number(idOrdenPedida);
  }

  const disponibles = await ordenesDisponiblesDelLote(idLote, idModulo);
  return disponibles[0]?.id_orden_produccion ?? null;
}

/**
 * Normaliza la nomina que llega del formulario.
 *
 * Acepta las tres formas en que la pantalla puede mandarla, porque la
 * lista es posicional y forzar un solo formato solo agrega ceremonia:
 *   [5, null, 7]                              -> ids en orden
 *   [{ id_operario: 5 }, { id_operario: null }]
 *   [{ numero: 1, id_operario: 5 }]
 *
 * `null` es una operaria anonima, que es un dato valido y frecuente.
 */
function normalizarOperarias(crudo, cantidad) {
  const lista = Array.isArray(crudo) ? crudo : [];

  const filas = lista.slice(0, cantidad).map((entrada, indice) => {
    const esObjeto = entrada !== null && typeof entrada === "object";
    const id = esObjeto ? entrada.id_operario : entrada;
    const numero = esObjeto && entrada.numero ? Number(entrada.numero) : indice + 1;

    return {
      numero,
      id_operario: id === "" || id === undefined || id === null ? null : Number(id),
    };
  });

  // Los puestos que la digitadora no alcanzo a asignar quedan anonimos:
  // el modulo tiene esa persona sentada aunque no sepamos quien es.
  for (let numero = filas.length + 1; numero <= cantidad; numero += 1) {
    filas.push({ numero, id_operario: null });
  }

  const identificadas = filas.filter((fila) => fila.id_operario !== null);
  const unicas = new Set(identificadas.map((fila) => fila.id_operario));
  if (unicas.size !== identificadas.length) {
    throw ApiError.badRequest("Una misma operaria no puede ocupar dos puestos del modulo");
  }

  return filas;
}

/** Reemplaza la nomina completa. Es reemplazo y no suma: la pantalla manda. */
async function guardarOperarias(conexion, idJornada, filas) {
  await conexion.execute("DELETE FROM jornada_operaria WHERE id_jornada_modulo = ?", [idJornada]);

  for (const fila of filas) {
    await conexion.execute(
      "INSERT INTO jornada_operaria (id_jornada_modulo, numero, id_operario) VALUES (?, ?, ?)",
      [idJornada, fila.numero, fila.id_operario],
    );
  }
}

/** Una jornada con su nomina, lista para la pantalla. */
async function jornadaCompleta(idJornada) {
  const jornada = await queryOne(`${SELECT_JORNADA} WHERE jm.id_jornada_modulo = ?`, [idJornada]);
  if (!jornada) return null;
  return { ...jornada, operarias: await operariasDe(idJornada) };
}

// =====================================================================
// GET /jornada/opciones
//   Todo lo que el asistente de inicio necesita, en una sola llamada:
//   los modulos con su estado de hoy, los clientes que tienen lotes
//   disponibles, esos lotes, y las operarias del catalogo.
//
//   Va junto a proposito. Son cuatro catalogos pequenos y la digitadora
//   abre la jornada de pie, con el celular: cuatro peticiones en serie
//   son cuatro oportunidades de que la pantalla se quede pensando.
// =====================================================================
jornadaRouter.get(
  "/opciones",
  requierePermiso("Jornada", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const [modulos, clientes, lotes, operarias, ordenes] = await Promise.all([
      query(
        `SELECT m.id_modulo, m.codigo, m.nombre, m.ubicacion, m.capacidad_operarios,
                m.umbral_cumplimiento, m.estado,
                jm.id_jornada_modulo, jm.estado AS estado_jornada,
                jm.cantidad_operarias, l.codigo_lote, cl.nombre AS nombre_cliente
         FROM modulos m
         LEFT JOIN jornada_modulo jm ON jm.id_modulo = m.id_modulo AND jm.fecha = ?
         LEFT JOIN lotes l ON l.id_lote = jm.id_lote
         LEFT JOIN clientes cl ON cl.id_cliente = l.id_cliente
         WHERE m.estado = 'ACTIVO'
         ORDER BY m.orden_visual ASC, m.codigo ASC`,
        [fecha],
      ),
      // Solo clientes que tienen al menos un lote utilizable: ofrecer un
      // cliente sin lotes lleva a la digitadora a un paso sin salida.
      query(
        `SELECT c.id_cliente, c.nombre, COUNT(l.id_lote) AS lotes_disponibles
         FROM clientes c
         JOIN lotes l ON l.id_cliente = c.id_cliente
                     AND l.estado IN ('REGISTRADO', 'APROBADO', 'EN_PROCESO')
         WHERE c.estado = 'ACTIVO'
         GROUP BY c.id_cliente, c.nombre
         ORDER BY c.nombre ASC`,
      ),
      query(
        `SELECT l.id_lote, l.id_cliente, l.codigo_lote, l.codigo_referencia,
                l.nombre_referencia, l.sam_pactado, l.ruta_imagen,
                l.ruta_documento_pdf, l.cantidad_programada,
                l.fecha_entrega_programada, l.estado
         FROM lotes l
         WHERE l.estado IN ('REGISTRADO', 'APROBADO', 'EN_PROCESO')
         ORDER BY l.fecha_recepcion DESC, l.codigo_lote ASC`,
      ),
      query(
        `SELECT id_operario, codigo_operario, nombres, apellidos, especialidad
         FROM operarios
         WHERE estado = 'ACTIVO' AND cargo = 'OPERARIO'
         ORDER BY nombres ASC, apellidos ASC`,
      ),
      // Las ordenes vivas con el modulo que las tomo, si alguno lo hizo.
      // La pantalla arma con esto la lista de lo que cada modulo puede
      // coger; el backend vuelve a validarlo al guardar, porque entre que
      // ella abre el asistente y le da a iniciar puede pasar un rato.
      query(
        `SELECT o.id_orden_produccion, o.numero_orden, o.id_lote, o.prioridad,
                o.estado, o.cantidad_programada, o.valor_maquila_unidad,
                o.fecha_fin_programada,
                tom.id_modulo AS tomada_por, m.codigo AS codigo_modulo_tomador
         FROM ordenes_produccion o
         ${SELECT_ORDEN_TOMADA}
         LEFT JOIN modulos m ON m.id_modulo = tom.id_modulo
         WHERE o.estado NOT IN ('CANCELADA', 'FINALIZADA')
         ORDER BY FIELD(o.estado, 'EN_PROCESO', 'PENDIENTE', 'PAUSADA'), o.fecha_emision ASC`,
      ),
    ]);

    res.json({ fecha, modulos, clientes, lotes, operarias, ordenes });
  }),
);

// =====================================================================
// GET /jornada/horario?fecha=
//   Cuanto dura de verdad un dia de planta.
//
//   Existe porque "horas de jornada" era una columna que se escribia a
//   mano en cada modulo y decia 9, mientras la planta trabaja 8.67 (520
//   minutos) entre semana y 7.33 (440) el sabado. El horario no es del
//   modulo: es de la planta, y sale de sumar sus franjas.
//
//   `del_dia` es el patron que rige la fecha pedida, o null si ese dia
//   no se trabaja.
// =====================================================================
jornadaRouter.get(
  "/horario",
  requierePermiso("Jornada", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const [patrones, franjas, delDia] = await Promise.all([
      query("SELECT * FROM vw_horario_jornada ORDER BY codigo"),
      query(
        `SELECT id_franja, id_jornada, orden_franja, hora_inicio, hora_fin, minutos, etiqueta
         FROM jornada_franjas ORDER BY id_jornada, orden_franja`,
      ),
      // WEEKDAY() devuelve 0 = lunes y `jornada_dia` usa 1 = lunes.
      queryOne(
        `SELECT h.* FROM jornada_dia d
          JOIN vw_horario_jornada h ON h.id_jornada = d.id_jornada
         WHERE d.dia_semana = WEEKDAY(?) + 1`,
        [fecha],
      ),
    ]);

    const conFranjas = patrones.map((patron) => ({
      ...patron,
      dias: String(patron.dias_semana || "").split(",").filter(Boolean).map(Number),
      franjas: franjas.filter((franja) => franja.id_jornada === patron.id_jornada),
    }));

    res.json({
      fecha,
      patrones: conFranjas,
      del_dia: delDia
        ? conFranjas.find((patron) => patron.id_jornada === delDia.id_jornada) ?? delDia
        : null,
    });
  }),
);

// =====================================================================
// GET /jornada?fecha=  -> como esta la planta ese dia
// =====================================================================
jornadaRouter.get(
  "/",
  requierePermiso("Jornada", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();
    const datos = await query(`${SELECT_JORNADA} WHERE jm.fecha = ? ORDER BY m.orden_visual`, [
      fecha,
    ]);

    res.json({ fecha, datos, total: datos.length });
  }),
);

// =====================================================================
// GET /jornada/modulo/:idModulo?fecha=
//   La jornada de un modulo, o null si todavia no se ha abierto. Es lo
//   primero que pregunta la pantalla de captura.
// =====================================================================
jornadaRouter.get(
  "/modulo/:idModulo",
  requierePermiso("Jornada", "VER"),
  asyncHandler(async (req, res) => {
    const fecha = fechaValida(req.query.fecha) ? req.query.fecha : hoy();

    const jornada = await queryOne(`${SELECT_JORNADA} WHERE jm.id_modulo = ? AND jm.fecha = ?`, [
      req.params.idModulo,
      fecha,
    ]);

    if (!jornada) return res.json(null);
    res.json({ ...jornada, operarias: await operariasDe(jornada.id_jornada_modulo) });
  }),
);

// =====================================================================
// POST /jornada  -> abrir la jornada
// =====================================================================
jornadaRouter.post(
  "/",
  requierePermiso("Jornada", "CREAR"),
  asyncHandler(async (req, res) => {
    const {
      id_modulo,
      id_lote,
      id_orden_produccion = null,
      fecha = hoy(),
      cantidad_operarias,
      operarias = [],
      observaciones = null,
    } = req.body || {};

    if (!id_modulo) throw ApiError.badRequest("Falta el modulo");
    if (!id_lote) throw ApiError.badRequest("Falta el lote que se va a producir");
    if (!fechaValida(fecha)) throw ApiError.badRequest("La fecha debe tener formato YYYY-MM-DD");
    if (fecha > hoy()) throw ApiError.badRequest("No se puede abrir una jornada de una fecha futura");

    const cantidad = Number(cantidad_operarias ?? operarias.length ?? 0);
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw ApiError.badRequest("Indique cuantas operarias trabajan en el modulo");
    }
    if (cantidad > 99) throw ApiError.badRequest("Un modulo no puede tener mas de 99 operarias");

    const modulo = await queryOne(
      "SELECT id_modulo, codigo, estado FROM modulos WHERE id_modulo = ?",
      [id_modulo],
    );
    if (!modulo) throw ApiError.notFound("El modulo no existe");
    if (modulo.estado !== "ACTIVO") {
      throw ApiError.badRequest(`El modulo ${modulo.codigo} no esta activo`);
    }

    const lote = await queryOne(
      "SELECT id_lote, codigo_lote, sam_pactado, estado FROM lotes WHERE id_lote = ?",
      [id_lote],
    );
    if (!lote) throw ApiError.notFound("El lote no existe");
    if (!["REGISTRADO", "APROBADO", "EN_PROCESO"].includes(lote.estado)) {
      throw ApiError.badRequest(`El lote ${lote.codigo_lote} ya no esta disponible para producir`);
    }

    // Sin SAM no hay meta, y sin meta la captura de la hora no dice nada.
    // Se avisa aqui, al abrir, y no dentro de la primera hora capturada.
    if (!lote.sam_pactado || Number(lote.sam_pactado) <= 0) {
      throw ApiError.badRequest(
        `El lote ${lote.codigo_lote} no tiene SAM pactado: sin el no se puede calcular la meta de la hora`,
        { campo: "sam_pactado", id_lote: lote.id_lote },
      );
    }

    const existente = await queryOne(
      "SELECT id_jornada_modulo FROM jornada_modulo WHERE id_modulo = ? AND fecha = ?",
      [id_modulo, fecha],
    );
    if (existente) {
      throw ApiError.conflict(
        `El modulo ${modulo.codigo} ya tiene la jornada abierta para esa fecha`,
        { id_jornada_modulo: existente.id_jornada_modulo },
      );
    }

    const filas = normalizarOperarias(operarias, cantidad);

    // Aqui el modulo TOMA la orden. Si otro ya la tiene, se rechaza.
    const idOrden = await resolverOrden(id_lote, id_modulo, id_orden_produccion);

    const idJornada = await transaction(async (conexion) => {
      const [resultado] = await conexion.execute(
        `INSERT INTO jornada_modulo
           (id_modulo, fecha, id_lote, id_orden_produccion, cantidad_operarias,
            estado, abierta_por, observaciones)
         VALUES (?, ?, ?, ?, ?, 'ABIERTA', ?, ?)`,
        [
          id_modulo, fecha, id_lote, idOrden,
          cantidad, req.usuario.id_usuario, observaciones,
        ],
      );
      await guardarOperarias(conexion, resultado.insertId, filas);
      return resultado.insertId;
    });

    // El lote pasa a EN_PROCESO al arrancar: deja de ser algo que llego
    // y pasa a ser algo que se esta haciendo.
    await execute(
      `UPDATE lotes SET estado = 'EN_PROCESO', fecha_inicio = COALESCE(fecha_inicio, ?)
       WHERE id_lote = ? AND estado IN ('REGISTRADO', 'APROBADO')`,
      [fecha, id_lote],
    );

    res.status(201).json(await jornadaCompleta(idJornada));
  }),
);

// =====================================================================
// PUT /jornada/:id  -> cambiar lote, cantidad de operarias u observaciones
//
//   Cambiar el lote a mitad del dia es normal (es la incidencia "cambio
//   de referencia"). Las horas ya capturadas guardan su propio lote y no
//   se tocan: lo que se cambia aqui rige de la siguiente hora en adelante.
// =====================================================================
jornadaRouter.put(
  "/:id",
  requierePermiso("Jornada", "EDITAR"),
  asyncHandler(async (req, res) => {
    const jornada = await queryOne(
      "SELECT * FROM jornada_modulo WHERE id_jornada_modulo = ?",
      [req.params.id],
    );
    if (!jornada) throw ApiError.notFound("La jornada no existe");

    const { id_lote, id_orden_produccion, cantidad_operarias, operarias, observaciones } =
      req.body || {};

    let idLote = jornada.id_lote;
    let idOrden = jornada.id_orden_produccion;

    if (id_lote && Number(id_lote) !== Number(jornada.id_lote)) {
      const lote = await queryOne(
        "SELECT id_lote, codigo_lote, sam_pactado, estado FROM lotes WHERE id_lote = ?",
        [id_lote],
      );
      if (!lote) throw ApiError.notFound("El lote no existe");
      if (!lote.sam_pactado || Number(lote.sam_pactado) <= 0) {
        throw ApiError.badRequest(`El lote ${lote.codigo_lote} no tiene SAM pactado`);
      }

      idLote = lote.id_lote;
      idOrden = await resolverOrden(idLote, jornada.id_modulo, id_orden_produccion);
    } else if (id_orden_produccion !== undefined && id_orden_produccion !== null) {
      // Cambiar solo la orden, sin cambiar de lote: pasa cuando la orden
      // se creo despues de abrir la jornada.
      idOrden = await resolverOrden(idLote, jornada.id_modulo, id_orden_produccion);
    }

    const cantidad =
      cantidad_operarias === undefined ? jornada.cantidad_operarias : Number(cantidad_operarias);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      throw ApiError.badRequest("La cantidad de operarias debe estar entre 1 y 99");
    }

    await transaction(async (conexion) => {
      await conexion.execute(
        `UPDATE jornada_modulo
            SET id_lote = ?, id_orden_produccion = ?, cantidad_operarias = ?, observaciones = ?
          WHERE id_jornada_modulo = ?`,
        [
          idLote, idOrden, cantidad,
          observaciones === undefined ? jornada.observaciones : observaciones,
          req.params.id,
        ],
      );

      // Si cambio la cantidad y no mandaron nomina, se conserva lo que
      // habia y se completa (o recorta) hasta el numero nuevo.
      if (operarias !== undefined) {
        await guardarOperarias(conexion, req.params.id, normalizarOperarias(operarias, cantidad));
      } else if (cantidad !== jornada.cantidad_operarias) {
        const actuales = await operariasDe(req.params.id);
        await guardarOperarias(
          conexion,
          req.params.id,
          normalizarOperarias(actuales.map((fila) => fila.id_operario), cantidad),
        );
      }
    });

    res.json(await jornadaCompleta(req.params.id));
  }),
);

// =====================================================================
// POST /jornada/:id/cerrar
//   Cierra el dia del modulo. No borra nada: deja de pedir las horas
//   pendientes y saca al modulo de la lista de recordatorios.
// =====================================================================
jornadaRouter.post(
  "/:id/cerrar",
  requierePermiso("Jornada", "EDITAR"),
  asyncHandler(async (req, res) => {
    const jornada = await queryOne(
      "SELECT id_jornada_modulo, estado FROM jornada_modulo WHERE id_jornada_modulo = ?",
      [req.params.id],
    );
    if (!jornada) throw ApiError.notFound("La jornada no existe");
    if (jornada.estado === "CERRADA") return res.json(await jornadaCompleta(req.params.id));

    await execute(
      "UPDATE jornada_modulo SET estado = 'CERRADA', fecha_cierre = NOW() WHERE id_jornada_modulo = ?",
      [req.params.id],
    );

    res.json(await jornadaCompleta(req.params.id));
  }),
);

// =====================================================================
// POST /jornada/:id/reabrir
//   Se cerro por error, o entro una hora mas. Es reversible a proposito.
// =====================================================================
jornadaRouter.post(
  "/:id/reabrir",
  requierePermiso("Jornada", "EDITAR"),
  asyncHandler(async (req, res) => {
    const jornada = await queryOne(
      "SELECT id_jornada_modulo FROM jornada_modulo WHERE id_jornada_modulo = ?",
      [req.params.id],
    );
    if (!jornada) throw ApiError.notFound("La jornada no existe");

    await execute(
      "UPDATE jornada_modulo SET estado = 'ABIERTA', fecha_cierre = NULL WHERE id_jornada_modulo = ?",
      [req.params.id],
    );

    res.json(await jornadaCompleta(req.params.id));
  }),
);
