import { useEffect, useState } from "react";
import { AlertTriangle, Check, Timer, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { formatMoneda } from "@/shared/utils/formatters";
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
    marca: "text-[#0F4C3F]",
    naranja: "text-[#D08E10]",
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
          className={`w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-center text-3xl font-bold outline-none focus:border-[#0F4C3F] ${colores[tono]}`}
        />
      ) : (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onCambiar(Math.max(numero - paso, min))}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-[#0F4C3F] hover:text-[#0F4C3F] active:scale-95"
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
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-[#0F4C3F] hover:text-[#0F4C3F] active:scale-95"
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
        <p className="text-center text-3xl font-bold text-[#D08E10]">{Number(sugeridas || 0)}</p>
      )}

      <button
        type="button"
        onClick={() => onCambio(!cambio)}
        className="mt-2 w-full text-center text-xs font-medium text-[#0F4C3F] underline underline-offset-2"
      >
        {cambio ? "No, dejar la de la jornada" : "¿Cambio la cantidad esta hora?"}
      </button>
    </div>
  );
}

/**
 * Minutos que el modulo estuvo parado, abiertos por causa.
 *
 * El tablero de pared trae tres columnas fijas (maquina, calidad,
 * montaje); aqui son las causas del catalogo. Es un numero que se escribe,
 * no que se cuenta a clics: 45 minutos son 9 toques al +.
 */
function MinutosPerdidos({ causas, valores, minutosFranja, total, excede, onCambiar }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          <Timer className="h-3.5 w-3.5" />
          Minutos perdidos
        </p>
        <span className={`text-xs font-semibold ${excede ? "text-red-600" : "text-gray-500"}`}>
          {total} / {minutosFranja} min de la franja
        </span>
      </div>

      <div className="space-y-2">
        {causas.map((causa) => {
          const minutos = Number(valores[causa.id_causa] || 0);
          return (
            <div key={causa.id_causa} className="flex items-center gap-2">
              <span
                className={`flex-1 truncate text-sm ${
                  minutos > 0 ? "font-medium text-gray-800" : "text-gray-500"
                }`}
                title={causa.nombre}
              >
                {causa.nombre}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={minutos}
                min={0}
                max={minutosFranja}
                placeholder="0"
                onFocus={(evento) => evento.target.select()}
                onChange={(evento) => onCambiar(causa.id_causa, evento.target.value)}
                className={`h-9 w-16 rounded-lg border text-center text-sm font-semibold outline-none focus:border-[#0F4C3F] ${
                  minutos > 0
                    ? "border-[#D08E10]/50 bg-[#D08E10]/10 text-[#b46a12]"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              />
              <span className="w-6 flex-shrink-0 text-xs text-gray-400">min</span>
            </div>
          );
        })}
      </div>
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
  onCambiarMinutosPerdidos,
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

  // La causa que cuenta es la de mas minutos ya cargados, igual que en el
  // backend: no se le pregunta a la digitadora si ya lo dijo con numeros.
  const entradasPerdidos = Object.entries(valores.minutos_perdidos || {}).filter(
    ([, minutos]) => Number(minutos) > 0,
  );
  const idCausaPrincipal = entradasPerdidos.length
    ? entradasPerdidos.reduce((mayor, actual) => (actual[1] > mayor[1] ? actual : mayor))[0]
    : null;
  const causaPrincipal =
    causas.find((causa) => String(causa.id_causa) === String(idCausaPrincipal)) || null;

  const validacion = validarCaptura({
    valores,
    bajoUmbral: calculo?.bajoUmbral,
    causaPrincipal,
    excedePerdidos: calculo?.excedePerdidos,
    minutosFranja: calculo?.minutosFranja,
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
            <p className="mt-0.5 text-xs font-medium text-[#0F4C3F]">
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
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#0F4C3F]/5 p-4 text-center">
            <div>
              <p className="text-xs text-[#0F4C3F]/70">Meta</p>
              <p className="text-2xl font-bold text-[#0F4C3F]">
                {Math.round(calculo?.meta ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#0F4C3F]/70">Eficiencia</p>
              <p
                className={`text-2xl font-bold ${
                  calculo?.bajoUmbral ? "text-[#b46a12]" : "text-green-600"
                }`}
              >
                {calculo?.cumplimiento ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[#0F4C3F]/70">SAM real</p>
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
            <p className="flex items-start gap-2 rounded-xl border border-[#D08E10]/30 bg-[#D08E10]/5 px-3 py-2.5 text-xs text-[#b46a12]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              La hora quedo por debajo del umbral ({calculo.umbral}%): registra abajo cuanto tiempo
              se perdio y por que.
            </p>
          )}

          <MinutosPerdidos
            causas={causas}
            valores={valores.minutos_perdidos}
            minutosFranja={calculo?.minutosFranja ?? franja.minutos}
            total={calculo?.minutosPerdidos ?? 0}
            excede={calculo?.excedePerdidos}
            onCambiar={onCambiarMinutosPerdidos}
          />

          {calculo?.minutosPerdidos > 0 && (
            <p className="text-center text-xs text-gray-500">
              {calculo.minutosPerdidos} min de modulo x {valores.personas_presentes} personas ={" "}
              <strong className="text-[#b46a12]">
                {calculo.minutosPerdidosPersona} minutos-persona
              </strong>{" "}
              perdidos
            </p>
          )}

          {/* La nota solo aparece si la causa con mas minutos la exige. */}
          {(causaPrincipal?.requiere_nota || valores.nota) && (
            <div className="rounded-2xl border border-[#D08E10]/30 bg-[#D08E10]/5 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-[#b46a12]">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {causaPrincipal ? `${causaPrincipal.nombre}: explica que paso` : "Explica que paso"}
              </p>
              <input
                value={valores.nota || ""}
                onChange={(evento) => onCambiar("nota", evento.target.value)}
                placeholder="Explica brevemente que paso"
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0F4C3F]"
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
            className="h-12 flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
            disabled={guardando || !validacion.valido}
            onClick={onGuardar}
          >
            <Check className="mr-2 h-5 w-5" />
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>

        {validacion.mensaje && (
          <p className="px-5 pb-4 text-center text-xs text-[#b46a12]">{validacion.mensaje}</p>
        )}
      </div>
    </div>
  );
}
