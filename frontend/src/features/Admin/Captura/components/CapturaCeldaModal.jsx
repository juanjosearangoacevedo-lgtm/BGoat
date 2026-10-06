import { useEffect, useState } from "react";
import { AlertTriangle, Check, Plus, Timer, Trash2, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { formatMoneda } from "@/shared/utils/formatters";
import { horaCorta, minutosDeParada } from "../utils/paradas";
import { validarCaptura } from "../validations/capturaValidation";
import { CapturaDesgloseTallaColor } from "./CapturaDesgloseTallaColor";

/**
 * Contador grande. Por defecto tiene +/- para ajustes chicos (personas,
 * defectuosas), pero para numeros que pueden ser grandes (unidades
 * producidas puede pasar de 80 en una hora) se puede pedir `soloTeclado`:
 * ahi se quitan los botones y el numero se ve como un campo de verdad, no
 * como texto plano, para que sea obvio que se puede escribir directo.
 */
function Contador({ etiqueta, valor, onCambiar, min = 0, paso = 1, tono = "marca", soloTeclado = false, autoFocus = false }) {
  const numero = Number(valor || 0);
  const colores = {
    marca: "text-marca",
    naranja: "text-dorado",
    rojo: "text-red-500",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      {etiqueta && (
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
          {etiqueta}
        </p>
      )}
      {soloTeclado ? (
        <input
          type="number"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={numero}
          min={min}
          onChange={(evento) => onCambiar(Math.max(Number(evento.target.value || 0), min))}
          onFocus={(evento) => evento.target.select()}
          className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-3xl font-bold outline-none focus:border-marca ${colores[tono]}`}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onCambiar(Math.max(numero - paso, min))}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-marca hover:text-marca active:scale-95"
            aria-label={`Restar ${etiqueta || "cantidad"}`}
          >
            <span className="text-xl leading-none">−</span>
          </button>

          <input
            type="number"
            inputMode="numeric"
            value={numero}
            min={min}
            onChange={(evento) => onCambiar(Math.max(Number(evento.target.value || 0), min))}
            onFocus={(evento) => evento.target.select()}
            className={`w-full min-w-0 rounded-xl border border-transparent bg-transparent text-center text-3xl font-bold outline-none focus:border-gray-200 focus:bg-white ${colores[tono]}`}
          />

          <button
            type="button"
            onClick={() => onCambiar(numero + paso)}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-marca hover:text-marca active:scale-95"
            aria-label={`Sumar ${etiqueta || "cantidad"}`}
          >
            <span className="text-xl leading-none">+</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Cuantas personas hay en la franja.
 *
 * El numero ya llega precargado con lo que se declaro al iniciar la
 * jornada: la mayoria de las horas no cambia. Por eso se muestra fijo, y
 * solo se vuelve editable si la digitadora dice que esta hora sí cambio
 * -alguien se ausento, entro un refuerzo, etc.
 */
function PersonasFranja({ sugeridas, valor, cambio, onCambio, onCambiar }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        Personas
      </p>

      {cambio ? (
        <Contador valor={valor} onCambiar={onCambiar} tono="naranja" min={0} autoFocus />
      ) : (
        <p className="text-center text-3xl font-bold text-dorado">{Number(sugeridas || 0)}</p>
      )}

      <button
        type="button"
        onClick={() => onCambio(!cambio)}
        className="mt-2 w-full text-center text-xs font-medium text-marca underline underline-offset-2"
      >
        {cambio ? "No, dejar la de la jornada" : "¿Cambio la cantidad esta hora?"}
      </button>
    </div>
  );
}

/**
 * Las paradas del modulo en esta hora: de que hora a que hora y por que.
 *
 * Antes se escribia el total de minutos por causa; ahora cada parada es
 * una fila con su causa, "desde" y "hasta", y los minutos se calculan.
 * Una causa puede repetirse: la maquina se puede trabar dos veces.
 */
function Paradas({ causas, paradas = [], franja, total, problema, onCambiar }) {
  const agregar = () =>
    onCambiar([...paradas, { id_causa: "", hora_desde: "", hora_hasta: "", minutos_anteriores: null }]);
  const cambiar = (indice, campo, valor) =>
    onCambiar(paradas.map((parada, i) => (i === indice ? { ...parada, [campo]: valor } : parada)));
  const quitar = (indice) => onCambiar(paradas.filter((_, i) => i !== indice));

  const minimo = horaCorta(franja.hora_inicio);
  const maximo = horaCorta(franja.hora_fin);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <Timer className="h-3.5 w-3.5" />
          Paradas del modulo
        </p>
        <span className={`text-xs font-semibold ${problema ? "text-red-600" : "text-gray-500"}`}>
          {total} / {franja.minutos} min de la franja
        </span>
      </div>

      {paradas.length === 0 ? (
        <p className="mb-3 text-xs text-gray-400">
          Si el modulo se paro en esta hora ({minimo} a {maximo}), agrega cada parada con la hora
          en que empezo y la hora en que termino.
        </p>
      ) : (
        <div className="mb-3 space-y-2">
          {paradas.map((parada, indice) => {
            const minutos = minutosDeParada(parada);
            return (
              <div key={indice} className="rounded-xl border border-gray-200 bg-white p-2.5">
                <div className="flex items-center gap-2">
                  <select
                    value={parada.id_causa}
                    onChange={(evento) => cambiar(indice, "id_causa", evento.target.value)}
                    aria-label={`Causa de la parada ${indice + 1}`}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 text-sm outline-none focus:border-marca"
                  >
                    <option value="" disabled>
                      Elige la causa
                    </option>
                    {causas.map((causa) => (
                      <option key={causa.id_causa} value={String(causa.id_causa)}>
                        {causa.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => quitar(indice)}
                    aria-label={`Quitar la parada ${indice + 1}`}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-xs text-gray-500">De</span>
                  <input
                    type="time"
                    value={parada.hora_desde}
                    min={minimo}
                    max={maximo}
                    aria-label={`Hora en que empezo la parada ${indice + 1}`}
                    onChange={(evento) => cambiar(indice, "hora_desde", evento.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-sm outline-none focus:border-marca"
                  />
                  <span className="text-xs text-gray-500">a</span>
                  <input
                    type="time"
                    value={parada.hora_hasta}
                    min={minimo}
                    max={maximo}
                    aria-label={`Hora en que termino la parada ${indice + 1}`}
                    onChange={(evento) => cambiar(indice, "hora_hasta", evento.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-sm outline-none focus:border-marca"
                  />
                  <span
                    className={`w-14 flex-shrink-0 text-right text-sm font-semibold ${
                      minutos > 0 ? "text-dorado-texto" : "text-gray-300"
                    }`}
                  >
                    {minutos} min
                  </span>
                </div>
                {parada.minutos_anteriores ? (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Registrada antes del cambio como {parada.minutos_anteriores} min: indica de que
                    hora a que hora fue.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={agregar}
        className="flex items-center gap-1.5 text-xs font-medium text-marca hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar parada
      </button>
    </div>
  );
}

/**
 * Formulario de una celda de la rejilla.
 *
 * La digitadora toca unidades, personas, defectuosas y —si la franja
 * quedo bajo el umbral— cuanto tiempo se perdio y por que. La meta, los
 * pesos y el SAM real los calcula el sistema con los minutos REALES de la
 * franja, que no siempre son 60.
 *
 * Ya no hay un selector de "causa principal" separado: la causa que
 * cuenta es la de mas minutos dentro de lo que se cargo abajo, igual que
 * lo calcula el backend. Preguntarla aparte era responder lo mismo dos
 * veces.
 */
export function CapturaCeldaModal({
  celda,
  calculo,
  causas = [],
  combosTallaColor = [],
  guardando,
  onCambiar,
  onCambiarDetalleTallaColor,
  onCambiarParadas,
  onCerrar,
  onGuardar,
}) {
  const [personasCambio, setPersonasCambio] = useState(false);

  // Se reinicia solo cuando se abre una celda distinta, no en cada
  // digitado: si no, cada tecla borraria la eleccion de "si cambio".
  const claveCelda = celda ? `${celda.modulo.id_modulo}-${celda.franja.orden_franja}` : null;
  useEffect(() => {
    if (!celda) return;
    const sugeridas = Number(celda.modulo.personas_sugeridas || 0);
    const actual = Number(celda.valores.personas_presentes || 0);
    setPersonasCambio(Boolean(celda.existente) && actual !== sugeridas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveCelda]);

  if (!celda) return null;

  const { modulo, franja, valores, existente } = celda;

  // La causa que cuenta es la que mas minutos suma entre sus paradas,
  // igual que en el backend: no se le pregunta a la digitadora si ya lo
  // dijo con las horas. Se suma por causa porque una causa puede tener
  // varias paradas en la misma hora.
  const minutosPorCausa = new Map();
  (valores.paradas ?? []).forEach((parada) => {
    const minutos = minutosDeParada(parada);
    if (!parada.id_causa || minutos <= 0) return;
    minutosPorCausa.set(parada.id_causa, (minutosPorCausa.get(parada.id_causa) ?? 0) + minutos);
  });
  const entradasPerdidos = [...minutosPorCausa];
  const idCausaPrincipal = entradasPerdidos.length
    ? entradasPerdidos.reduce((mayor, actual) => (actual[1] > mayor[1] ? actual : mayor))[0]
    : null;
  const causaPrincipal =
    causas.find((causa) => String(causa.id_causa) === String(idCausaPrincipal)) || null;

  const validacion = validarCaptura({
    valores,
    bajoUmbral: calculo?.bajoUmbral,
    causaPrincipal,
    problemaParadas: calculo?.problemaParadas,
  });

  const handleCambioPersonas = (cambia) => {
    setPersonasCambio(cambia);
    if (!cambia) onCambiar("personas_presentes", Number(modulo.personas_sugeridas || 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {modulo.codigo} · {franja.etiqueta}
            </h2>
            {/* Lo que la digitadora declaro al abrir la jornada. El precio
                sale de la orden, que puede no existir todavia: sin ella hay
                meta (el SAM viene del lote) pero no facturacion. */}
            <p className="mt-0.5 text-xs text-gray-500">
              {modulo.jornada
                ? `${modulo.jornada.nombre_cliente} · ${modulo.jornada.codigo_lote} · ` +
                  `SAM ${calculo?.sam ?? "—"} min` +
                  (calculo?.precio
                    ? ` · ${formatMoneda(calculo.precio)}/und`
                    : " · sin orden, no se factura")
                : "Este modulo no tiene jornada configurada"}
            </p>
            <p className="mt-0.5 text-xs font-medium text-marca">
              Franja de {franja.minutos} minutos
              {franja.minutos !== 60 && (
                <span className="ml-1 font-normal text-gray-400">
                  — la meta baja en proporcion
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-2 hover:bg-gray-100"
            type="button"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {/* Meta calculada por el sistema */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-marca/5 p-4 text-center">
            <div>
              <p className="text-xs text-marca/70">Meta</p>
              <p className="text-2xl font-bold text-marca">
                {Math.round(calculo?.meta ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-marca/70">Eficiencia</p>
              <p
                className={`text-2xl font-bold ${
                  calculo?.bajoUmbral ? "text-dorado-texto" : "text-green-600"
                }`}
              >
                {calculo?.cumplimiento ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-marca/70">SAM real</p>
              <p className="text-2xl font-bold text-gray-700">{calculo?.samObservado ?? "—"}</p>
            </div>
          </div>

          {/* Lo que esa franja factura */}
          {calculo?.precio > 0 && (
            <div className="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50/60 px-4 py-3 text-sm">
              <span className="text-gray-600">Facturacion de la franja</span>
              <span className="font-semibold text-green-700">
                {formatMoneda(calculo.facturacionReal)}
                <span className="ml-1 font-normal text-gray-400">
                  de {formatMoneda(calculo.facturacionMeta)}
                </span>
              </span>
            </div>
          )}

          <CapturaDesgloseTallaColor
            combos={combosTallaColor}
            valores={valores.detalle_talla_color ?? []}
            onChange={onCambiarDetalleTallaColor}
          />

          <div className="grid grid-cols-2 gap-3">
            <PersonasFranja
              sugeridas={modulo.personas_sugeridas}
              valor={valores.personas_presentes}
              cambio={personasCambio}
              onCambio={handleCambioPersonas}
              onCambiar={(valor) => onCambiar("personas_presentes", valor)}
            />
            <Contador
              etiqueta="Defectuosas"
              valor={valores.unidades_defectuosas}
              onCambiar={(valor) => onCambiar("unidades_defectuosas", valor)}
              tono="rojo"
            />
          </div>

          {/* El aviso solo apunta a lo de abajo: ya no hay un selector de
              causa aparte que responda la misma pregunta dos veces. */}
          {calculo?.bajoUmbral && entradasPerdidos.length === 0 && (
            <p className="flex items-start gap-2 rounded-xl border border-dorado/30 bg-dorado/5 px-3 py-2.5 text-xs text-dorado-texto">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              La hora quedo por debajo del umbral ({calculo.umbral}%): registra abajo de que hora a
              que hora se paro el modulo y por que.
            </p>
          )}

          <Paradas
            causas={causas}
            paradas={valores.paradas}
            franja={franja}
            total={calculo?.minutosPerdidos ?? 0}
            problema={calculo?.problemaParadas}
            onCambiar={onCambiarParadas}
          />

          {calculo?.minutosPerdidos > 0 && (
            <p className="text-center text-xs text-gray-500">
              {calculo.minutosPerdidos} min de modulo x {valores.personas_presentes} personas ={" "}
              <strong className="text-dorado-texto">
                {calculo.minutosPerdidosPersona} minutos-persona
              </strong>{" "}
              perdidos
            </p>
          )}

          {/* La nota solo aparece si la causa con mas minutos la exige. */}
          {(causaPrincipal?.requiere_nota || valores.nota) && (
            <div className="rounded-2xl border border-dorado/30 bg-dorado/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-dorado-texto">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {causaPrincipal ? `${causaPrincipal.nombre}: explica que paso` : "Explica que paso"}
              </p>
              <input
                value={valores.nota || ""}
                onChange={(evento) => onCambiar("nota", evento.target.value)}
                placeholder="Explica brevemente que paso"
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-marca"
              />
            </div>
          )}

          {existente && (
            <p className="text-center text-xs text-gray-400">
              Registrado por {existente.nombre_registrador} · {existente.fecha_registro}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 border-t border-gray-100 p-5">
          <Button variant="outline" className="h-12 flex-1" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            className="h-12 flex-1 bg-dorado text-white hover:bg-dorado-hover"
            disabled={guardando || !validacion.valido}
            onClick={onGuardar}
          >
            <Check className="mr-2 h-5 w-5" />
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {validacion.mensaje && (
          <p className="px-5 pb-4 text-center text-xs text-dorado-texto">{validacion.mensaje}</p>
        )}
      </div>
    </div>
  );
}
