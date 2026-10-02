import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas de la captura horaria -> tabla `registros_horarios`.
 *
 * Es el nucleo del sistema: la digitadora captura de pie, una celda por
 * hora. Por eso las reglas son pocas y condicionales, no un formulario largo:
 *
 *   - las unidades y las defectuosas son enteros que no bajan de cero,
 *   - las defectuosas no pueden superar lo producido,
 *   - si la hora quedo bajo el umbral hay que registrar minutos perdidos,
 *   - si la causa con mas minutos lo exige, hay que escribir la nota.
 *
 * Ya no hay un selector de "causa principal" aparte: se preguntaba lo
 * mismo dos veces. La causa principal ahora es, igual que en el backend,
 * la de mas minutos dentro de lo que ya se cargo en minutos perdidos.
 */
export const capturaLimites = {
  unidades: { min: 0, max: 99999 },
  personas: { min: 0, max: 200 },
  nota: { max: 255 },
};

/** La suma del reparto por talla y color: ya no se digita un total suelto. */
function sumaDetalleTallaColor(form) {
  return (form?.detalle_talla_color ?? []).reduce((total, fila) => total + Number(fila.cantidad || 0), 0);
}

export const capturaEsquema = {
  unidades_defectuosas: [
    reglas.entero({ etiqueta: "Las unidades defectuosas" }),
    reglas.numero({ ...capturaLimites.unidades, etiqueta: "Las unidades defectuosas" }),
    (valor, form) =>
      Number(valor || 0) > sumaDetalleTallaColor(form)
        ? "Las unidades defectuosas no pueden superar las producidas"
        : "",
  ],
  personas: [
    reglas.entero({ etiqueta: "Las personas" }),
    reglas.numero({ ...capturaLimites.personas, etiqueta: "Las personas" }),
  ],
  nota: [reglas.longitud({ ...capturaLimites.nota, etiqueta: "La nota" })],
};

/**
 * Reglas que dependen de la causa que quedo con mas minutos cargados.
 * `causaPrincipal` es ese registro del catalogo (o null si todavia no se
 * cargo ninguna), calculado igual que lo hace el backend.
 */
export function crearCapturaEsquema({ causaPrincipal = null } = {}) {
  return {
    ...capturaEsquema,
    nota: [
      ...capturaEsquema.nota,
      reglas.requeridoSi(
        () => Boolean(causaPrincipal?.requiere_nota),
        "Esa causa necesita que escribas una nota",
      ),
    ],
  };
}

/**
 * Devuelve `{ errores, mensaje }`: los errores por campo y el aviso que la
 * rejilla muestra bajo el boton de guardar.
 *
 * Dos reglas no son de un solo campo, asi que se revisan aparte:
 *   - si la hora quedo bajo el umbral, tiene que haber algo cargado en
 *     minutos perdidos (ya no se pregunta la causa por separado),
 *   - los minutos perdidos, sumados, no pueden salirse de la franja.
 * El backend valida las dos igual; esto es para que la digitadora lo
 * vea antes de guardar.
 */
export function validarCaptura({
  valores,
  bajoUmbral,
  causaPrincipal,
  excedePerdidos = false,
  minutosFranja = 60,
}) {
  const errores = validarFormulario(valores, crearCapturaEsquema({ causaPrincipal }));

  const hayMinutosPerdidos = Object.values(valores.minutos_perdidos || {}).some(
    (minutos) => Number(minutos) > 0,
  );

  if (excedePerdidos) {
    errores.minutos_perdidos = `Los minutos perdidos no caben en una franja de ${minutosFranja} minutos`;
  } else if (bajoUmbral && !hayMinutosPerdidos) {
    errores.minutos_perdidos =
      "La hora quedo bajo la meta: registra cuanto tiempo se perdio y por que";
  }

  return {
    errores,
    mensaje: errores.minutos_perdidos || errores.nota || errores.unidades_defectuosas || "",
    valido: Object.keys(errores).length === 0,
  };
}
