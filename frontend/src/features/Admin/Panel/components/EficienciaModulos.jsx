import { useState } from "react";
import { Factory } from "lucide-react";
import { Card } from "@/shared/components/card";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatMoneda, hoyLocal } from "@/shared/utils/formatters";

/**
 * Eficiencia en tiempo real por modulo, agrupada en tres filas segun
 * `eficiencia` o `cumplimiento_facturacion` (las dos ya vienen calculadas
 * en `vw_estado_modulo_dia`): verde primero (los que ya estan en meta),
 * luego naranja/dorado (los que van llegando) y al final los mas
 * atrasados. La paleta (propuesta 4) solo define dos colores para estos
 * indicadores -- dorado por debajo de la meta, verde en meta o por
 * encima -- asi que "Por llegar" y "Atrasados" comparten el dorado; la
 * fila en la que caen sigue diciendo que tan lejos estan.
 *
 * La pestana "$ Facturacion" no pide nada nuevo al servidor: el dinero
 * ya viaja en la misma fila que el %, porque al dueno le importa tanto
 * cuanto se produjo como cuanto genero eso en pesos.
 *
 * Cada tarjeta lleva al Tablero del Modulo (la hoja franja por franja):
 * es donde se ve por que el numero quedo asi.
 */
const BANDAS = [
  { clave: "verde", titulo: "En meta", color: "var(--exito)", fondo: "color-mix(in srgb, var(--exito) 10.196%, transparent)", texto: "var(--marca-texto)" },
  { clave: "naranja", titulo: "Por llegar", color: "var(--ambar)", fondo: "color-mix(in srgb, var(--ambar) 10.196%, transparent)", texto: "var(--ambar-texto)" },
  { clave: "rojo", titulo: "Atrasados", color: "var(--ambar)", fondo: "color-mix(in srgb, var(--ambar) 10.196%, transparent)", texto: "var(--ambar-texto)" },
];

const VISTAS = [
  { clave: "eficiencia", label: "% Eficiencia" },
  { clave: "facturacion", label: "$ Facturación" },
];

function banda(valor) {
  const numero = Number(valor || 0);
  if (numero >= 80) return "verde";
  if (numero >= 50) return "naranja";
  return "rojo";
}

export function EficienciaModulos({ modules = [], loading = false, onNavigate }) {
  const [vista, setVista] = useState("eficiencia");
  const enDinero = vista === "facturacion";

  const grupos = { verde: [], naranja: [], rojo: [] };
  modules.forEach((modulo) => {
    const referencia = enDinero ? modulo.cumplimiento_facturacion : modulo.eficiencia;
    grupos[banda(referencia)].push(modulo);
  });

  return (
    <Card className="bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-tinta">Eficiencia en Tiempo Real</h3>
          <p className="mt-1 text-sm text-texto-suave">
            {enDinero
              ? "Cuánto ha facturado cada módulo frente a su propia meta del día"
              : "Cada módulo frente a su propia meta del día"}
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-linea p-1">
          {VISTAS.map((opcion) => (
            <button
              key={opcion.clave}
              type="button"
              onClick={() => setVista(opcion.clave)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                vista === opcion.clave
                  ? "bg-ambar text-white"
                  : "text-texto-suave hover:bg-fondo"
              }`}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {!loading && modules.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Sin módulos con jornada abierta"
          description="El semáforo se llena en cuanto un módulo registre su primera hora del día."
        />
      ) : (
        <div className="space-y-4">
          {BANDAS.map((bandaInfo) => (
            <div key={bandaInfo.clave}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gris">
                {bandaInfo.titulo} ({grupos[bandaInfo.clave].length})
              </p>

              {grupos[bandaInfo.clave].length === 0 ? (
                <p className="text-sm text-linea-9">Ningún módulo en este rango</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {grupos[bandaInfo.clave].map((modulo) => (
                    <button
                      key={modulo.id_modulo}
                      type="button"
                      onClick={() =>
                        onNavigate?.("tablero-modulo", { modulo, fecha: hoyLocal() })
                      }
                      title={`Ver el tablero de ${modulo.codigo}`}
                      className="rounded-lg border px-2 py-2.5 text-center transition-transform hover:scale-[1.03] hover:shadow-sm"
                      style={{ backgroundColor: bandaInfo.fondo, borderColor: bandaInfo.color }}
                    >
                      <p className="truncate text-xs text-texto-suave">{modulo.codigo}</p>
                      {enDinero ? (
                        <>
                          <p
                            className="truncate text-sm font-bold"
                            style={{ color: bandaInfo.texto }}
                            title={formatMoneda(modulo.facturacion_real)}
                          >
                            {formatMoneda(modulo.facturacion_real)}
                          </p>
                          <p className="truncate text-[10px] text-texto-suave">
                            de {formatMoneda(modulo.facturacion_meta)}
                          </p>
                        </>
                      ) : (
                        <p className="text-base font-bold" style={{ color: bandaInfo.texto }}>
                          {Number(modulo.eficiencia || 0).toFixed(0)}%
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
