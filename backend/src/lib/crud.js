import { Router } from "express";
import { execute, query, queryOne } from "../config/db.js";
import { requierePermiso } from "../middleware/auth.js";
import { ApiError, asyncHandler } from "./http.js";
import { filtrosDeListado } from "./filtros.js";

const IDENTIFICADOR = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/** Cuantas veces se vuelve a pedir un consecutivo que otra peticion se llevo primero. */
const REINTENTOS_CONSECUTIVO = 2;

/** Valida que un nombre de columna venga de la definicion y no del cliente. */
function columnaSegura(nombre) {
  if (!IDENTIFICADOR.test(nombre)) {
    throw new Error(`Nombre de columna invalido en la definicion del recurso: ${nombre}`);
  }
  return `\`${nombre}\``;
}

/** Deja solo los campos declarados y convierte "" en NULL. */
function limpiarCuerpo(cuerpo = {}, campos) {
  const limpio = {};
  campos.forEach((campo) => {
    if (Object.prototype.hasOwnProperty.call(cuerpo, campo)) {
      const valor = cuerpo[campo];
      limpio[campo] = valor === "" ? null : valor;
    }
  });
  return limpio;
}

/**
 * Construye un router REST completo a partir de la definicion de un recurso.
 *
 *   GET    /            listado (?buscar=, ?pagina=, ?porPagina=, filtros)
 *   GET    /:id         detalle
 *   POST   /            crear
 *   PUT    /:id         actualizar
 *   DELETE /:id         eliminar (o inactivar si el recurso usa softDelete)
 */
export function crudRouter(definicion) {
  const {
    tabla, pk, permiso, campos, obligatorios = [], buscables = [],
    filtros = [], orden = null, vista = null, alias = null, softDelete = null,
    // Hook opcional: `async (datos, { id }) => datos`. Corre antes de crear
    // o actualizar, con los datos ya limpios; `id` solo llega al actualizar.
    // Sirve para normalizar un valor o validar una regla que cruza varios
    // campos (ninguna de las dos cosas caben en `obligatorios`, que solo
    // mira un campo a la vez).
    antesDeGuardar = null,
    // Campo que asigna el servidor al crear, nunca el cliente:
    // `{ campo, generar }` con `generar: async () => valor`. Tiene que ser
    // UNIQUE: si dos personas piden el siguiente numero en el mismo
    // instante y las dos calculan el mismo, el indice rechaza a la segunda
    // y aqui se le pide otro en vez de fallarle al usuario.
    consecutivo = null,
  } = definicion;

  const router = Router();
  const tablaSegura = columnaSegura(tabla);
  const pkSegura = columnaSegura(pk);
  const prefijo = alias ? `${alias}.` : "";

  const origen = vista ? `(${vista}) AS sub` : tablaSegura;
  const origenPrefijo = vista ? "sub." : "";

  // Crear con consecutivo es "calcular el siguiente numero y guardarlo", y
  // dos peticiones a la vez calculan el mismo. Dentro de este proceso se
  // atienden de a una, asi no chocan entre ellas; el indice UNIQUE y el
  // reintento de `insertar` cubren lo que llegue desde otro proceso.
  let turno = Promise.resolve();
  const enFila = (tarea) => {
    const corre = turno.then(tarea);
    turno = corre.catch(() => {});
    return corre;
  };

  /** El INSERT. Con consecutivo, le pone el numero y reintenta si otro se lo llevo primero. */
  const insertar = async (datos) => {
    for (let intento = 0; ; intento++) {
      if (consecutivo) datos[consecutivo.campo] = await consecutivo.generar();

      const columnas = Object.keys(datos);
      try {
        return await execute(
          `INSERT INTO ${tablaSegura} (${columnas.map(columnaSegura).join(", ")})
           VALUES (${columnas.map(() => "?").join(", ")})`,
          columnas.map((columna) => datos[columna]),
        );
      } catch (error) {
        // Un duplicado solo se reintenta si fue el consecutivo el que
        // choco. Las demas llaves unicas (por ejemplo el numero de pedido)
        // no se arreglan generando otro numero: se le avisa al usuario. Se
        // sabe cual fue mirando si el valor que se probo ya esta ocupado.
        if (!consecutivo || error.code !== "ER_DUP_ENTRY" || intento >= REINTENTOS_CONSECUTIVO) {
          throw error;
        }
        const ocupado = await queryOne(
          `SELECT 1 AS ocupado FROM ${tablaSegura} WHERE ${columnaSegura(consecutivo.campo)} = ?`,
          [datos[consecutivo.campo]],
        );
        if (!ocupado) throw error;
      }
    }
  };

  // --- Listado ---------------------------------------------------------
  router.get(
    "/",
    requierePermiso(permiso, "VER"),
    asyncHandler(async (req, res) => {
      const { where, valores } = filtrosDeListado(req.query, {
        buscarEn: buscables.map((campo) => `${origenPrefijo}${columnaSegura(campo)}`),
        iguales: filtros.map((campo) => ({
          parametro: campo,
          columna: `${origenPrefijo}${columnaSegura(campo)}`,
        })),
      });
      // `orden` viene de la definicion del recurso, nunca del cliente.
      const orderBy = orden ? `ORDER BY ${orden}` : "";

      const porPagina = Math.min(Number(req.query.porPagina) || 200, 500);
      const pagina = Math.max(Number(req.query.pagina) || 1, 1);
      const offset = (pagina - 1) * porPagina;

      const total = await queryOne(`SELECT COUNT(*) AS total FROM ${origen} ${where}`, valores);
      const filas = await query(
        `SELECT * FROM ${origen} ${where} ${orderBy} LIMIT ${porPagina} OFFSET ${offset}`,
        valores,
      );

      res.json({ datos: filas, total: total?.total ?? 0, pagina, porPagina });
    }),
  );

  // --- Detalle ---------------------------------------------------------
  router.get(
    "/:id",
    requierePermiso(permiso, "VER"),
    asyncHandler(async (req, res) => {
      const fila = await queryOne(
        `SELECT * FROM ${origen} WHERE ${origenPrefijo}${pkSegura} = ?`,
        [req.params.id],
      );
      if (!fila) throw ApiError.notFound();
      res.json(fila);
    }),
  );

  // --- Crear -----------------------------------------------------------
  router.post(
    "/",
    requierePermiso(permiso, "CREAR"),
    asyncHandler(async (req, res) => {
      let datos = limpiarCuerpo(req.body, campos);
      if (antesDeGuardar) datos = await antesDeGuardar(datos, {});

      const faltantes = obligatorios.filter(
        (campo) => datos[campo] === undefined || datos[campo] === null,
      );
      if (faltantes.length > 0) {
        throw ApiError.badRequest(`Faltan campos obligatorios: ${faltantes.join(", ")}`, faltantes);
      }

      if (Object.keys(datos).length === 0) throw ApiError.badRequest("No se enviaron datos");

      const resultado = consecutivo ? await enFila(() => insertar(datos)) : await insertar(datos);

      const creado = await queryOne(
        `SELECT * FROM ${origen} WHERE ${origenPrefijo}${pkSegura} = ?`,
        [resultado.insertId],
      );
      res.status(201).json(creado);
    }),
  );

  // --- Actualizar ------------------------------------------------------
  router.put(
    "/:id",
    requierePermiso(permiso, "EDITAR"),
    asyncHandler(async (req, res) => {
      let datos = limpiarCuerpo(req.body, campos);
      if (antesDeGuardar) datos = await antesDeGuardar(datos, { id: req.params.id });
      const columnas = Object.keys(datos);
      if (columnas.length === 0) throw ApiError.badRequest("No se enviaron datos");

      const existente = await queryOne(
        `SELECT ${pkSegura} FROM ${tablaSegura} WHERE ${pkSegura} = ?`,
        [req.params.id],
      );
      if (!existente) throw ApiError.notFound();

      await execute(
        `UPDATE ${tablaSegura} SET ${columnas.map((c) => `${columnaSegura(c)} = ?`).join(", ")}
         WHERE ${pkSegura} = ?`,
        [...columnas.map((columna) => datos[columna]), req.params.id],
      );

      const actualizado = await queryOne(
        `SELECT * FROM ${origen} WHERE ${origenPrefijo}${pkSegura} = ?`,
        [req.params.id],
      );
      res.json(actualizado);
    }),
  );

  // --- Eliminar --------------------------------------------------------
  router.delete(
    "/:id",
    requierePermiso(permiso, "ELIMINAR"),
    asyncHandler(async (req, res) => {
      const existente = await queryOne(
        `SELECT ${pkSegura} FROM ${tablaSegura} WHERE ${pkSegura} = ?`,
        [req.params.id],
      );
      if (!existente) throw ApiError.notFound();

      if (softDelete) {
        // Regla de negocio del alcance: no se borran registros con historia,
        // se inactivan para conservar la trazabilidad.
        await execute(
          `UPDATE ${tablaSegura} SET ${columnaSegura(softDelete.columna)} = ? WHERE ${pkSegura} = ?`,
          [softDelete.valor, req.params.id],
        );
        return res.json({ inactivado: true, [pk]: Number(req.params.id) });
      }

      await execute(`DELETE FROM ${tablaSegura} WHERE ${pkSegura} = ?`, [req.params.id]);
      return res.status(204).send();
    }),
  );

  return router;
}
