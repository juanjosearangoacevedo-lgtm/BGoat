import { reglas, validarFormulario } from "@/shared/validations";
import { minutosDeParada } from "../utils/paradas";

/**
 * Reglas de la captura horaria -> tabla `registros_horarios`.
 *
 * Es el nucleo del sistema: la digitadora captura de pie, una celda por
 * hora. Por eso las reglas son pocas y condicionales, no un formulario largo:
 *
 *   - las unidades y las defectuosas son enteros que no bajan de cero,
 *   - las defectuosas no pueden superar lo producido,
 *   - si la hora quedo bajo el umbral hay que registrar al menos una parada,
 *   - cada parada (causa, desde, hasta) cae dentro de la hora y no se cruza,
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
 *   - si la hora quedo bajo el umbral, tiene que haber al menos una
 *     parada (ya no se pregunta la causa por separado),
 *   - las paradas tienen que estar completas, dentro de la franja y sin
 *     cruzarse (`problemaParadas`).
 * El backend valida las dos igual; esto es para que la digitadora lo
 * vea antes de guardar.
 */
export function validarCaptura({ valores, bajoUmbral, causaPrincipal, problemaParadas = "" }) {
  const errores = validarFormulario(valores, crearCapturaEsquema({ causaPrincipal }));

  const hayParadas = (valores.paradas ?? []).some((parada) => minutosDeParada(parada) > 0);

  if (problemaParadas) {
    errores.minutos_perdidos = problemaParadas;
  } else if (bajoUmbral && !hayParadas) {
    errores.minutos_perdidos =
      "La hora quedó bajo la meta: registra de qué hora a qué hora se paró el módulo y por qué";
  }

  return {
    errores,
    mensaje: errores.minutos_perdidos || errores.nota || errores.unidades_defectuosas || "",
    valido: Object.keys(errores).length === 0,
  };
}
