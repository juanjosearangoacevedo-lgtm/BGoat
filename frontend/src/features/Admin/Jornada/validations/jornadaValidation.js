import { reglas, validarFormulario } from "@/shared/validations";

/**
 * Reglas del inicio de jornada -> tablas `jornada_modulo` y `jornada_operaria`.
 *
 * El asistente valida PASO A PASO y no al final: la digitadora configura
 * de pie, y descubrir en el ultimo boton que el primer dato estaba mal es
 * volver a empezar. Cada paso solo deja avanzar cuando su propia
 * pregunta esta respondida.
 */
export const jornadaLimites = {
  operarias: { min: 1, max: 99 },
  observaciones: { max: 255 },
};

/** Pasos del asistente, en el orden del flujo real de la planta. */
export const PASOS = [
  { clave: "modulo", titulo: "Modulo", pregunta: "En que modulo vas a trabajar?" },
  { clave: "operarias", titulo: "Operarias", pregunta: "Cuantas operarias hay en el modulo?" },
  { clave: "asignacion", titulo: "Quienes", pregunta: "Quieres decir quienes estan?" },
  { clave: "trabajo", titulo: "Cliente y lote", pregunta: "Que se va a producir?" },
];

export function crearJornadaEsquema({ moduloOptions = [], loteOptions = [] } = {}) {
  return {
    id_modulo: [
      reglas.seleccionRequerida("El modulo"),
      reglas.opcionValida(moduloOptions, "El modulo seleccionado"),
    ],
    cantidad_operarias: [
      reglas.requerido("La cantidad de operarias"),
      reglas.entero({ etiqueta: "La cantidad de operarias" }),
      reglas.numero({ ...jornadaLimites.operarias, etiqueta: "La cantidad de operarias" }),
    ],
    id_cliente: [reglas.seleccionRequerida("El cliente")],
    id_lote: [
      reglas.seleccionRequerida("El lote"),
      reglas.opcionValida(loteOptions, "El lote seleccionado"),
    ],
    observaciones: [
      reglas.longitud({ ...jornadaLimites.observaciones, etiqueta: "Las observaciones" }),
    ],
  };
}

/** Campos que cada paso tiene que dejar resueltos para poder avanzar. */
const CAMPOS_POR_PASO = {
  modulo: ["id_modulo"],
  operarias: ["cantidad_operarias"],
  // La asignacion nunca bloquea: una operaria anonima es una respuesta
  // valida, y la mas comun a primera hora.
  asignacion: [],
  trabajo: ["id_cliente", "id_lote"],
};

/** Valida un solo paso. Devuelve el objeto de errores de ese paso. */
export function validarPaso(paso, form, contexto = {}) {
  const campos = CAMPOS_POR_PASO[paso] ?? [];
  if (campos.length === 0) return {};

  const esquema = crearJornadaEsquema(contexto);
  const soloDelPaso = Object.fromEntries(
    campos.filter((campo) => esquema[campo]).map((campo) => [campo, esquema[campo]]),
  );

  return validarFormulario(form, soloDelPaso);
}

/**
 * Aviso --no error-- de que la nomina quedo incompleta.
 *
 * No bloquea porque el sistema esta hecho para trabajar con operarias
 * anonimas: el modulo tiene esa persona sentada aunque no sepamos quien
 * es, y los minutos disponibles la cuentan igual.
 */
export function avisoNomina(operarias = [], cantidad = 0) {
  const anonimas = operarias.filter((entrada) => !entrada).length + Math.max(cantidad - operarias.length, 0);
  if (anonimas === 0) return null;
  if (anonimas === cantidad) return "Ninguna operaria quedo identificada: la jornada se registra como anonima.";
  return `${anonimas} de ${cantidad} operarias quedan anonimas.`;
}
