import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas de la captura horaria -> tabla `registros_horarios`.
 *
 * Es el nucleo del sistema: la supervisora captura de pie, una celda por
 * hora. Por eso las reglas son pocas y condicionales, no un formulario largo:
 *
 *   - las unidades y las defectuosas son enteros que no bajan de cero,
 *   - las defectuosas no pueden superar lo producido,
 *   - si la hora quedo bajo el umbral hay que decir por que,
 *   - si esa causa lo exige, hay que escribir la nota.
 */
export const capturaLimites = {
  unidades: { min: 0, max: 99999 },
  personas: { min: 0, max: 200 },
  nota: { max: 255 },
};

export const capturaEsquema = {
  unidades_producidas: [
    reglas.entero({ etiqueta: "Las unidades producidas" }),
    reglas.numero({ ...capturaLimites.unidades, etiqueta: "Las unidades producidas" }),
  ],
  unidades_defectuosas: [
    reglas.entero({ etiqueta: "Las unidades defectuosas" }),
    reglas.numero({ ...capturaLimites.unidades, etiqueta: "Las unidades defectuosas" }),
    reglas.noMayorQue(
      "unidades_producidas",
      "Las unidades defectuosas",
      "las unidades producidas",
    ),
  ],
  personas: [
    reglas.entero({ etiqueta: "Las personas" }),
    reglas.numero({ ...capturaLimites.personas, etiqueta: "Las personas" }),
  ],
  nota: [reglas.longitud({ ...capturaLimites.nota, etiqueta: "La nota" })],
};

/**
 * Reglas que dependen del resultado de la hora y de la causa elegida.
 * `bajoUmbral` lo calcula la rejilla comparando lo producido con la meta.
 */
export function crearCapturaEsquema({ bajoUmbral = false, causaSeleccionada = null } = {}) {
  return {
    ...capturaEsquema,
    id_causa: [
      reglas.requeridoSi(
        () => bajoUmbral,
        "La hora quedo bajo la meta: selecciona la causa",
      ),
    ],
    nota: [
      ...capturaEsquema.nota,
      reglas.requeridoSi(
        () => Boolean(causaSeleccionada?.requiere_nota),
        "Esta causa necesita que escribas una nota",
      ),
    ],
  };
}

/**
 * Devuelve `{ errores, mensaje }`: los errores por campo y el aviso que la
 * rejilla muestra bajo el boton de guardar.
 *
 * `excedePerdidos` cubre la unica regla que no es de un solo campo: los
 * minutos perdidos se reparten entre varias causas y lo que no puede
 * pasar es que la suma se salga de la franja. El backend la valida
 * igual; esto es para que la supervisora lo vea antes de guardar.
 */
export function validarCaptura({
  valores,
  bajoUmbral,
  causaSeleccionada,
  excedePerdidos = false,
  minutosFranja = 60,
}) {
  const errores = validarFormulario(
    valores,
    crearCapturaEsquema({ bajoUmbral, causaSeleccionada }),
  );

  if (excedePerdidos) {
    errores.minutos_perdidos = `Los minutos perdidos no caben en una franja de ${minutosFranja} minutos`;
  }

  return {
    errores,
    mensaje:
      errores.minutos_perdidos ||
      errores.id_causa ||
      errores.nota ||
      errores.unidades_defectuosas ||
      "",
    valido: Object.keys(errores).length === 0,
  };
}
