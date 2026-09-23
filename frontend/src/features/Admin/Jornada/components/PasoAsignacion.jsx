import { useState } from "react";
import { Check, UserCircle2, UserPlus, Users } from "lucide-react";
import { avisoNomina } from "../validations/jornadaValidation";

/**
 * Paso 3: quienes son. Es opcional, y la pantalla lo dice.
 *
 * La pregunta se hace de frente --identificar o no-- en vez de dejar una
 * lista de puestos en "Anonima" que parece un formulario a medio llenar.
 * A primera hora la digitadora sabe que hay cinco maquinas andando mucho
 * antes de saber el nombre de las cinco, y exigirle la identificacion la
 * obligaria a inventar operarias en el catalogo para poder arrancar.
 *
 * Identificar no cambia ningun calculo: la meta sale de cuantas personas
 * hay, no de quienes son. Sirve para repartir la produccion del modulo
 * entre ellas (`vw_productividad_operario`), y se puede completar despues
 * sin detener la captura.
 */
export function PasoAsignacion({ cantidad = 0, asignacion = [], operarias = [], onAsignar }) {
  const puestos = Array.from({ length: cantidad }, (_, indice) => indice);
  const identificadas = asignacion.filter(Boolean).length;

  // Si ya hay alguien asignada se entra directo a la lista: se esta
  // volviendo sobre el paso, no empezandolo.
  const [asignando, setAsignando] = useState(identificadas > 0);

  if (operarias.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
        <UserCircle2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="font-medium text-gray-600">No hay operarias en el catalogo</p>
        <p className="mt-1 text-sm text-gray-400">
          Las {cantidad} operarias quedan anonimas. La jornada arranca igual y el catalogo se puede
          llenar despues en Planta &gt; Operarias.
        </p>
      </div>
    );
  }

  if (!asignando) {
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAsignando(true)}
          className="flex w-full items-start gap-4 rounded-2xl border-2 border-gray-200 p-5 text-left transition hover:border-[#0F4C3F] hover:bg-[#0F4C3F]/5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F4C3F]/10 text-[#0F4C3F]">
            <UserPlus className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">Si, decir quienes estan</span>
            <span className="block text-sm text-gray-500">
              Escoge las {cantidad} de la lista. Sirve para repartirles la produccion del modulo.
            </span>
          </span>
        </button>

        <div className="flex w-full items-start gap-4 rounded-2xl border-2 border-[#0F4C3F] bg-[#0F4C3F]/5 p-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0F4C3F] text-white">
            <Check className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">
              No, dejarlas anonimas
            </span>
            <span className="block text-sm text-gray-500">
              Es lo que esta puesto. Las {cantidad} cuentan para la meta igual; solo no hay a quien
              atribuirle la produccion.
            </span>
          </span>
        </div>

        <p className="pt-1 text-center text-sm text-gray-400">
          Se puede completar mas tarde sin detener la captura.
        </p>
      </div>
    );
  }

  const aviso = avisoNomina(asignacion, cantidad);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4 text-gray-400" />
          {identificadas} de {cantidad} identificadas
        </span>
        <button
          type="button"
          onClick={() => {
            puestos.forEach((indice) => onAsignar(indice, ""));
            setAsignando(false);
          }}
          className="text-sm font-medium text-[#0F4C3F] hover:underline"
        >
          Dejarlas anonimas
        </button>
      </div>

      {puestos.map((indice) => {
        const asignada = asignacion[indice] ?? null;

        return (
          <div
            key={indice}
            className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
              asignada ? "border-[#D08E10]/30 bg-[#D08E10]/5" : "border-gray-200 bg-white"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                asignada ? "bg-[#0F4C3F] text-white" : "bg-gray-100 text-gray-400"
              }`}
            >
              {indice + 1}
            </span>

            <select
              value={asignada ?? ""}
              onChange={(evento) => onAsignar(indice, evento.target.value)}
              aria-label={`Operaria del puesto ${indice + 1}`}
              className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#0F4C3F]"
            >
              <option value="">Sin identificar</option>
              {operarias.map((operaria) => (
                <option key={operaria.id_operario} value={operaria.id_operario}>
                  {operaria.nombres} {operaria.apellidos}
                  {operaria.especialidad ? ` - ${operaria.especialidad}` : ""}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <p className="flex items-start gap-2 pt-1 text-sm text-gray-500">
        <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        {aviso
          ? `${aviso} Se pueden completar mas tarde sin detener la captura.`
          : "Todas las operarias quedaron identificadas."}
      </p>
    </div>
  );
}
