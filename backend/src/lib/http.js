/** Error con codigo HTTP para responder de forma controlada. */
export class ApiError extends Error {
  constructor(status, mensaje, detalle) {
    super(mensaje);
    this.status = status;
    this.detalle = detalle;
  }

  static badRequest(mensaje, detalle) {
    return new ApiError(400, mensaje, detalle);
  }

  static unauthorized(mensaje = "No autenticado") {
    return new ApiError(401, mensaje);
  }

  static forbidden(mensaje = "No tiene permisos para esta accion") {
    return new ApiError(403, mensaje);
  }

  static notFound(mensaje = "Registro no encontrado") {
    return new ApiError(404, mensaje);
  }

  static conflict(mensaje, detalle) {
    return new ApiError(409, mensaje, detalle);
  }
}

/** Envuelve un handler async para que los errores lleguen al middleware. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Traduce errores de MySQL a mensajes utiles para el usuario. */
export function traducirErrorMysql(error) {
  switch (error.code) {
    case "ER_DUP_ENTRY":
      return new ApiError(409, "Ya existe un registro con esos datos", error.sqlMessage);
    case "ER_ROW_IS_REFERENCED_2":
      return new ApiError(
        409,
        "No se puede eliminar: el registro esta siendo usado por otros datos",
        error.sqlMessage,
      );
    case "ER_NO_REFERENCED_ROW_2":
      return new ApiError(400, "Alguna referencia enviada no existe", error.sqlMessage);
    case "ER_CHECK_CONSTRAINT_VIOLATED":
      return new ApiError(400, "Los datos no cumplen una regla de la base de datos", error.sqlMessage);
    case "ER_BAD_NULL_ERROR":
      return new ApiError(400, "Falta un campo obligatorio", error.sqlMessage);
    case "ER_DATA_TOO_LONG":
      return new ApiError(400, "Un valor supera el largo permitido", error.sqlMessage);
    default:
      return null;
  }
}
