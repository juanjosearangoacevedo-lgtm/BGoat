import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, unlink } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execute, query, queryOne, transaction } from "../config/db.js";
import { ApiError, asyncHandler } from "../lib/http.js";
import { requierePermiso } from "../middleware/auth.js";

/**
 * Lo que el CRUD generico no cubre del lote: los archivos de la ficha
 * tecnica y el desglose por talla y color.
 *
 *   POST   /lotes/:id/ficha        sube la imagen o el PDF (segun el tipo)
 *   DELETE /lotes/:id/ficha/:tipo  quita uno de los dos
 *   GET    /lotes/:id/detalle      el desglose por talla y color
 *   PUT    /lotes/:id/detalle      lo reemplaza completo
 *
 * Antes las fichas eran un modulo entero: referencia, version,
 * operaciones, materiales y medidas transcritas a mano. En la practica
 * cada lote llega con SU ficha en papel y todas son distintas, asi que
 * transcribirla era trabajo de digitacion que nadie volvia a leer. Ahora
 * se le toma una foto --o se adjunta el PDF que mando el cliente-- y se
 * sube.
 */
export const lotesRouter = Router();

/**
 * Donde quedan los archivos: `backend/uploads/fichas`.
 * `server.js` sirve esta carpeta en /uploads/fichas.
 *
 * La ruta se calcula desde este archivo y no desde `process.cwd()`: el
 * contenedor arranca con otro directorio de trabajo, y la carpeta tiene
 * que ser la misma que el volumen de docker-compose.
 */
export const CARPETA_SUBIDAS = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../uploads/fichas",
);

/**
 * La imagen y el PDF van en columnas distintas porque son dos cosas
 * distintas: la foto de la prenda se reconoce de un vistazo al escoger
 * el lote, y el PDF se abre para leer el detalle. Guardarlos en la misma
 * columna obligaba a escoger uno de los dos.
 */
const COLUMNA_POR_TIPO = {
  imagen: "ruta_imagen",
  pdf: "ruta_documento_pdf",
};

const TIPOS_IMAGEN = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const LIMITE_BYTES = 8 * 1024 * 1024;

const almacenamiento = multer.diskStorage({
  destination: async (_req, _archivo, callback) => {
    try {
      await mkdir(CARPETA_SUBIDAS, { recursive: true });
      callback(null, CARPETA_SUBIDAS);
    } catch (error) {
      callback(error);
    }
  },
  // Nombre propio, no el del cliente: el nombre original puede traer
  // rutas, acentos o repetirse entre dos lotes distintos.
  filename: (_req, archivo, callback) => {
    const extension = extname(archivo.originalname || "").toLowerCase().slice(0, 10);
    callback(null, `${randomUUID()}${extension || ".jpg"}`);
  },
});

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: LIMITE_BYTES, files: 1 },
  fileFilter: (_req, archivo, callback) => {
    if (!TIPOS_IMAGEN.has(archivo.mimetype) && archivo.mimetype !== "application/pdf") {
      callback(
        ApiError.badRequest(
          "La ficha tecnica debe ser una imagen (JPG, PNG, WEBP, HEIC) o un PDF",
        ),
      );
      return;
    }
    callback(null, true);
  },
});

/** Traduce los errores de multer a la respuesta que el front entiende. */
function recibirFicha(req, res, next) {
  subida.single("ficha")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return next(ApiError.badRequest("La ficha tecnica no puede pesar mas de 8 MB"));
    }
    return next(error);
  });
}

/** Borra el archivo anterior. Que falle no debe tumbar la peticion. */
async function borrarArchivo(ruta) {
  if (!ruta) return;
  const nombre = ruta.split("/").pop();
  if (!nombre) return;

  try {
    await unlink(resolve(CARPETA_SUBIDAS, nombre));
  } catch {
    // El archivo ya no estaba: el objetivo se cumplio igual.
  }
}

/** El desglose por talla y color de un lote, listo para la pantalla. */
async function detalleDe(idLote) {
  return query(
    `SELECT d.id_detalle, d.id_talla, d.id_color, d.cantidad,
            t.nombre AS nombre_talla, t.orden_visual,
            c.nombre AS nombre_color, c.codigo_hex
     FROM lote_detalle_talla_color d
     LEFT JOIN tallas t ON t.id_talla = d.id_talla
     LEFT JOIN colores c ON c.id_color = d.id_color
     WHERE d.id_lote = ?
     ORDER BY t.orden_visual, c.nombre`,
    [idLote],
  );
}

// =====================================================================
// POST /lotes/:id/ficha  -> sube la imagen o el PDF
//   El destino lo decide el tipo del archivo, no un parametro: la
//   digitadora sube lo que tiene a mano y el sistema lo acomoda.
// =====================================================================
lotesRouter.post(
  "/:id/ficha",
  requierePermiso("Lotes", "EDITAR"),
  recibirFicha,
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No llego ningun archivo");

    const esImagen = TIPOS_IMAGEN.has(req.file.mimetype);
    const columna = esImagen ? COLUMNA_POR_TIPO.imagen : COLUMNA_POR_TIPO.pdf;

    const lote = await queryOne(
      "SELECT id_lote, codigo_lote, ruta_imagen, ruta_documento_pdf FROM lotes WHERE id_lote = ?",
      [req.params.id],
    );

    const ruta = `/uploads/fichas/${req.file.filename}`;

    if (!lote) {
      await borrarArchivo(ruta);
      throw ApiError.notFound("El lote no existe");
    }

    // `columna` sale del mapa de arriba, nunca del cliente.
    await execute(`UPDATE lotes SET ${columna} = ? WHERE id_lote = ?`, [ruta, lote.id_lote]);

    // El archivo viejo se va solo despues de que el nuevo quedo guardado.
    await borrarArchivo(lote[columna]);

    res.status(201).json({
      id_lote: lote.id_lote,
      codigo_lote: lote.codigo_lote,
      tipo: esImagen ? "imagen" : "pdf",
      campo: columna,
      ruta,
      mime: req.file.mimetype,
      bytes: req.file.size,
    });
  }),
);

// =====================================================================
// DELETE /lotes/:id/ficha/:tipo  -> quita la imagen o el PDF
// =====================================================================
lotesRouter.delete(
  "/:id/ficha/:tipo",
  requierePermiso("Lotes", "EDITAR"),
  asyncHandler(async (req, res) => {
    const columna = COLUMNA_POR_TIPO[req.params.tipo];
    if (!columna) throw ApiError.badRequest("El tipo debe ser 'imagen' o 'pdf'");

    const lote = await queryOne(
      "SELECT id_lote, ruta_imagen, ruta_documento_pdf FROM lotes WHERE id_lote = ?",
      [req.params.id],
    );
    if (!lote) throw ApiError.notFound("El lote no existe");

    await execute(`UPDATE lotes SET ${columna} = NULL WHERE id_lote = ?`, [lote.id_lote]);
    await borrarArchivo(lote[columna]);

    res.json({ id_lote: lote.id_lote, tipo: req.params.tipo, ruta: null });
  }),
);

// =====================================================================
// GET /lotes/:id/detalle  -> el desglose por talla y color
// =====================================================================
lotesRouter.get(
  "/:id/detalle",
  requierePermiso("Lotes", "VER"),
  asyncHandler(async (req, res) => {
    const datos = await detalleDe(req.params.id);
    res.json({ datos, total: datos.length });
  }),
);

// =====================================================================
// PUT /lotes/:id/detalle  -> reemplaza el desglose completo
//
//   Es reemplazo y no suma, igual que los minutos perdidos de la
//   captura: lo que la pantalla muestra es lo que queda guardado. Una
//   lista vacia es valida y borra el desglose: el negocio todavia no
//   decide si va a usarlo, y exigirlo bloquearia el registro del lote
//   por un dato que a veces no viene en la hoja del cliente.
// =====================================================================
lotesRouter.put(
  "/:id/detalle",
  requierePermiso("Lotes", "EDITAR"),
  asyncHandler(async (req, res) => {
    const lote = await queryOne(
      "SELECT id_lote, cantidad_programada FROM lotes WHERE id_lote = ?",
      [req.params.id],
    );
    if (!lote) throw ApiError.notFound("El lote no existe");

    const crudo = Array.isArray(req.body?.detalle) ? req.body.detalle : req.body;
    const lineas = (Array.isArray(crudo) ? crudo : [])
      .map((linea) => ({
        id_talla: linea?.id_talla ? Number(linea.id_talla) : null,
        id_color: linea?.id_color ? Number(linea.id_color) : null,
        cantidad:
          linea?.cantidad === "" || linea?.cantidad === null || linea?.cantidad === undefined
            ? null
            : Number(linea.cantidad),
      }))
      // Una fila sin talla, sin color y sin cantidad es una fila que la
      // digitadora agrego y dejo en blanco: se descarta sin avisar.
      .filter((linea) => linea.id_talla || linea.id_color || linea.cantidad);

    const negativa = lineas.find((linea) => linea.cantidad !== null && linea.cantidad < 0);
    if (negativa) throw ApiError.badRequest("Las cantidades del desglose no pueden ser negativas");

    // La misma pareja talla+color dos veces son dos numeros para el mismo
    // casillero: el segundo taparia al primero en cualquier reporte.
    const claves = lineas.map((linea) => `${linea.id_talla ?? ""}|${linea.id_color ?? ""}`);
    if (new Set(claves).size !== claves.length) {
      throw ApiError.badRequest("Hay talla y color repetidos en el desglose");
    }

    const suma = lineas.reduce((total, linea) => total + (linea.cantidad ?? 0), 0);
    if (Number(lote.cantidad_programada) > 0 && suma > Number(lote.cantidad_programada)) {
      throw ApiError.badRequest(
        `El desglose suma ${suma} unidades y el lote programa ${lote.cantidad_programada}`,
        { suma_detalle: suma, cantidad_programada: Number(lote.cantidad_programada) },
      );
    }

    await transaction(async (conexion) => {
      await conexion.execute("DELETE FROM lote_detalle_talla_color WHERE id_lote = ?", [
        lote.id_lote,
      ]);
      for (const linea of lineas) {
        await conexion.execute(
          `INSERT INTO lote_detalle_talla_color (id_lote, id_talla, id_color, cantidad)
           VALUES (?, ?, ?, ?)`,
          [lote.id_lote, linea.id_talla, linea.id_color, linea.cantidad],
        );
      }
    });

    const datos = await detalleDe(lote.id_lote);
    res.json({ datos, total: datos.length, suma_detalle: suma });
  }),
);
