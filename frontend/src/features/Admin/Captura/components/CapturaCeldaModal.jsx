import { AlertTriangle, Check, Minus, Plus, Timer, X } from "lucide-react";
import { Button } from "@/shared/components/button";
import { formatMoneda } from "@/shared/utils/formatters";
import { validarCaptura } from "../validations/capturaValidation";

/** Contador grande: la supervisora captura de pie, sin teclado. */
function Contador({ etiqueta, valor, onCambiar, min = 0, paso = 1, tono = "morado" }) {
  const numero = Number(valor || 0);
  const colores = {
    morado: "text-[#433A9B]",
    naranja: "text-[#F39A3D]",
    rojo: "text-red-500",
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        {etiqueta}
      </p>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onCambiar(Math.max(numero - paso, min))}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-[#433A9B] hover:text-[#433A9B] active:scale-95"
          aria-label={`Restar ${etiqueta}`}
        >
          <Minus className="h-5 w-5" />
        </button>

        <input
          type="number"
          inputMode="numeric"
          value={numero}
          min={min}
          onChange={(evento) => onCambiar(Math.max(Number(evento.target.value || 0), min))}
          className={`w-full min-w-0 rounded-xl border border-transparent bg-transparent text-center text-3xl font-bold outline-none focus:border-gray-200 focus:bg-white ${colores[tono]}`}
        />

        <button
          type="button"
          onClick={() => onCambiar(numero + paso)}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-[#433A9B] hover:text-[#433A9B] active:scale-95"
          aria-label={`Sumar ${etiqueta}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Minutos que el modulo estuvo parado, abiertos por causa.
 *
 * El tablero de pared trae tres columnas fijas (maquina, calidad,
 * montaje); aqui son las causas del catalogo, en pasos de 5 minutos
 * porque nadie cronometra una parada al segundo.
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
              <button
                type="button"
                onClick={() => onCambiar(causa.id_causa, minutos - 5)}
                disabled={minutos === 0}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 hover:border-[#433A9B] hover:text-[#433A9B]"
                aria-label={`Restar minutos de ${causa.nombre}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={minutos}
                min={0}
                max={minutosFranja}
                onChange={(evento) => onCambiar(causa.id_causa, evento.target.value)}
                className={`h-8 w-14 rounded-lg border text-center text-sm outline-none ${
                  minutos > 0
                    ? "border-[#F39A3D]/50 bg-[#F39A3D]/10 font-semibold text-[#b46a12]"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              />
              <button
                type="button"
                onClick={() => onCambiar(causa.id_causa, minutos + 5)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-[#433A9B] hover:text-[#433A9B]"
                aria-label={`Sumar minutos de ${causa.nombre}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
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
 * La supervisora toca unidades, personas, defectuosas y —si la franja
 * quedo bajo el umbral— la causa. La meta, los pesos y el SAM real los
 * calcula el sistema con los minutos REALES de la franja, que no siempre
 * son 60.
 */
export function CapturaCeldaModal({
  celda,
  calculo,
  causas = [],
  guardando,
  onCambiar,
  onCambiarMinutosPerdidos,
  onCerrar,
  onGuardar,
}) {
  if (!celda) return null;

  const { modulo, franja, valores, existente } = celda;
  const causaSeleccionada = causas.find(
    (causa) => String(causa.id_causa) === String(valores.id_causa),
  );
  // Reglas en `validations/capturaValidation.js`: la celda no se guarda si la
  // franja quedo bajo la meta sin causa, si esa causa exige nota, si las
  // defectuosas superan lo producido, o si los minutos perdidos no caben
  // en la franja.
  const validacion = validarCaptura({
    valores,
    bajoUmbral: calculo?.bajoUmbral,
    causaSeleccionada,
    excedePerdidos: calculo?.excedePerdidos,
    minutosFranja: calculo?.minutosFranja,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {modulo.codigo} · {franja.etiqueta}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {modulo.orden
                ? `${modulo.orden.numero_orden} · Ref. ${modulo.orden.codigo_referencia} · ` +
                  `SAM ${calculo?.sam ?? "—"} min · ${formatMoneda(calculo?.precio ?? 0)}/und`
                : "Sin orden asignada a este modulo"}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[#433A9B]">
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
          <div className="grid grid-cols-3 gap-3 rounded-2xl bg-[#433A9B]/5 p-4 text-center">
            <div>
              <p className="text-xs text-[#433A9B]/70">Meta</p>
              <p className="text-2xl font-bold text-[#433A9B]">
                {Math.round(calculo?.meta ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#433A9B]/70">Eficiencia</p>
              <p
                className={`text-2xl font-bold ${
                  calculo?.bajoUmbral ? "text-[#b46a12]" : "text-green-600"
                }`}
              >
                {calculo?.cumplimiento ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[#433A9B]/70">SAM real</p>
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

          <Contador
            etiqueta="Unidades producidas"
            valor={valores.unidades_producidas}
            onCambiar={(valor) => onCambiar("unidades_producidas", valor)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Contador
              etiqueta="Personas"
              valor={valores.personas_presentes}
              onCambiar={(valor) => onCambiar("personas_presentes", valor)}
              tono="naranja"
            />
            <Contador
              etiqueta="Defectuosas"
              valor={valores.unidades_defectuosas}
              onCambiar={(valor) => onCambiar("unidades_defectuosas", valor)}
              tono="rojo"
            />
          </div>

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

          {/* La causa principal se pide solo cuando la eficiencia cae */}
          {(calculo?.bajoUmbral || valores.id_causa) && (
            <div className="rounded-2xl border border-[#F39A3D]/30 bg-[#F39A3D]/5 p-4">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#F39A3D]" />
                <p className="text-sm font-medium text-[#b46a12]">
                  {calculo?.bajoUmbral
                    ? `Por debajo del umbral (${calculo.umbral}%): indica que paso`
                    : "Causa registrada"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {causas.map((causa) => {
                  const activa = String(valores.id_causa) === String(causa.id_causa);
                  return (
                    <button
                      key={causa.id_causa}
                      type="button"
                      onClick={() => onCambiar("id_causa", activa ? "" : causa.id_causa)}
                      className={`rounded-xl border px-3 py-2 text-sm transition-all ${
                        activa
                          ? "border-[#433A9B] bg-[#433A9B] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#433A9B]/50"
                      }`}
                    >
                      {causa.nombre}
                    </button>
                  );
                })}
              </div>

              {causaSeleccionada?.requiere_nota && (
                <input
                  value={valores.nota || ""}
                  onChange={(evento) => onCambiar("nota", evento.target.value)}
                  placeholder="Explica brevemente que paso"
                  className="mt-3 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#433A9B]"
                />
              )}
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
            className="h-12 flex-1 bg-[#433A9B] text-white hover:bg-[#433A9B]/90"
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
