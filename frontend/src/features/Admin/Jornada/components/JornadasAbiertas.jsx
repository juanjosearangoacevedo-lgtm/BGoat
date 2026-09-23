import { ClipboardCheck, Lock, RotateCcw, Users } from "lucide-react";
import { Button } from "@/shared/components/button";

/**
 * Las jornadas que ya estan andando hoy.
 *
 * Va arriba del asistente a proposito: cuando la digitadora vuelve a
 * entrar --y va a volver muchas veces al dia-- lo que necesita no es
 * configurar otra vez, es saltar a registrar la hora del modulo que ya
 * configuro. El asistente queda debajo, para el siguiente modulo.
 */
export function JornadasAbiertas({ jornadas = [], onCapturar, onCerrar, onReabrir }) {
  if (jornadas.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Jornadas de hoy ({jornadas.length})
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {jornadas.map((modulo) => {
          const cerrada = modulo.estado_jornada === "CERRADA";

          return (
            <article
              key={modulo.id_jornada_modulo}
              className={`rounded-2xl border p-4 ${
                cerrada ? "border-gray-200 bg-gray-50" : "border-emerald-200 bg-white shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{modulo.codigo}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        cerrada
                          ? "bg-gray-200 text-gray-600"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {cerrada ? "Cerrada" : "Abierta"}
                    </span>
                  </div>
                  <p className="truncate text-sm text-gray-600">{modulo.nombre_cliente}</p>
                  <p className="truncate text-xs text-gray-400">{modulo.codigo_lote}</p>
                </div>

                <div className="flex shrink-0 items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  <Users className="h-3.5 w-3.5" />
                  {modulo.cantidad_operarias}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onCapturar(modulo)}
                  className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
                >
                  <ClipboardCheck className="mr-1.5 h-4 w-4" />
                  Registrar hora
                </Button>

                {cerrada ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReabrir(modulo.id_jornada_modulo)}
                    title="Reabrir la jornada"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCerrar(modulo.id_jornada_modulo)}
                    title="Cerrar la jornada del modulo"
                  >
                    <Lock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
