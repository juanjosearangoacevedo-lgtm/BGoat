import { FileText, Image } from "lucide-react";
import { archivoUrl } from "@/shared/services/apiClient";
import {
  formatFecha,
  formatFechaHora,
  formatMoneda,
  formatNumero,
  formatPorcentaje,
  GUION,
} from "@/shared/utils/formatters";

const minutos = (valor) => (valor !== null && valor !== undefined ? `${valor} min` : GUION);
const pct = (valor) => (valor !== null && valor !== undefined ? formatPorcentaje(valor, 1) : GUION);

const hay = (valor) => valor !== null && valor !== undefined && valor !== "";

/**
 * Lo esperado/pactado contra lo real. El real se pinta en rojo si quedo
 * peor (eficiencia por debajo, SAM por encima) y en verde si no.
 */
function Comparacion({ esperado, real, formato, peorSiRealEsMayor = false }) {
  const hayAmbos = hay(esperado) && hay(real);
  const peor =
    hayAmbos && (peorSiRealEsMayor ? Number(real) > Number(esperado) : Number(real) < Number(esperado));
  return (
    <span className="text-right">
      <span className="text-gray-500">{hay(esperado) ? formato(esperado) : GUION}</span>
      <span className="mx-1 text-gray-300">→</span>
      <span className={hayAmbos ? (peor ? "text-red-600" : "text-green-700") : "text-gray-800"}>
        {hay(real) ? formato(real) : GUION}
      </span>
    </span>
  );
}

/**
 * La entrega comprometida, o por que todavia no la hay. Va resaltada: es
 * la fecha que German le promete al cliente.
 */
function Entrega({ orden }) {
  if (orden?.fecha_fin_programada) {
    const atraso = Number(orden.dias_atraso || 0);
    return (
      <span className="text-right">
        <span className="font-bold text-marca">{formatFecha(orden.fecha_fin_programada)}</span>
        {atraso > 0 && (
          <span className="ml-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            +{atraso} {atraso === 1 ? "dia" : "dias"}
          </span>
        )}
      </span>
    );
  }
  if (orden?.fecha_inicio_real) {
    return <span className="text-dorado-texto">Falta la eficiencia esperada</span>;
  }
  return <span className="text-gray-500">Se calcula al iniciar jornada</span>;
}

/**
 * Lo que no se ve en otra parte del detalle de la orden.
 *
 * El encabezado ya trae numero, estado, prioridad y cliente; la franja de
 * progreso trae unidades, avance, defectuosas, inicio, entrega, ultimo
 * dia trabajado y atraso; "Horas registradas" y "Jornadas trabajadas"
 * traen las horas y las personas. Aqui solo queda lo que falta, para no
 * leer el mismo numero tres veces.
 */
export function OrdenInfoPanel({ orden, lote }) {
  const imagen = archivoUrl(lote?.ruta_imagen);
  const pdf = archivoUrl(lote?.ruta_documento_pdf);

  const grupos = [
    {
      titulo: "La orden",
      filas: [
        { label: "Lote", value: orden?.codigo_lote },
        { label: "Pedido", value: orden?.numero_pedido },
        {
          label: "Referencia",
          value: [orden?.codigo_referencia, orden?.nombre_referencia].filter(Boolean).join(" · "),
        },
        {
          // La orden no se asigna a un modulo: nace libre y la toma el que
          // abre su jornada con ella. Mientras nadie la tome, esto dice
          // "Libre" y no un guion, que se leeria como un dato faltante.
          label: "Modulo",
          value: orden?.codigo_modulo
            ? `${orden.codigo_modulo} · ${orden.nombre_modulo}`
            : "Libre - la toma el modulo que abra jornada con ella",
        },
      ],
    },
    {
      titulo: "Rendimiento",
      filas: [
        { label: "Restantes", value: formatNumero(orden?.unidades_restantes) },
        {
          label: "Eficiencia esperada → real",
          value: (
            <Comparacion
              esperado={orden?.eficiencia_esperada}
              real={Number(orden?.horas_registradas) > 0 ? orden?.eficiencia : null}
              formato={pct}
            />
          ),
        },
        {
          label: "SAM pactado → real",
          value: (
            <Comparacion
              esperado={orden?.sam_pactado}
              real={orden?.sam_observado}
              formato={minutos}
              peorSiRealEsMayor
            />
          ),
        },
        {
          label: "Valor de maquila",
          value: orden?.valor_maquila_unidad ? formatMoneda(orden.valor_maquila_unidad) : null,
        },
      ],
    },
    {
      titulo: "Entrega",
      filas: [
        { label: "Recepcion del lote", value: orden?.fecha_recepcion ? formatFecha(orden.fecha_recepcion) : null },
        {
          // El dia en que un modulo abrio jornada con la orden por primera vez.
          label: "Inicio",
          value: orden?.fecha_inicio_real ? formatFecha(orden.fecha_inicio_real) : "Al iniciar jornada",
        },
        {
          // La fecha que se le promete al cliente: formula de German desde el
          // inicio, con las personas de esa jornada. Queda fija.
          label: "Entrega",
          value: <Entrega orden={orden} />,
        },
        {
          // Con cuantas personas salio la entrega (formula de German).
          label: "Personas del calculo",
          value: orden?.personas_entrega ? formatNumero(orden.personas_entrega) : null,
          soloSiHay: true,
        },
        {
          label: "Termino",
          value: orden?.fecha_fin_real ? formatFecha(orden.fecha_fin_real) : null,
          soloSiHay: true,
        },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-bold text-gray-900">Informacion de la orden</h3>

      <div className="space-y-5">
        {grupos.map((grupo) => (
          <div key={grupo.titulo}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-marca">
              {grupo.titulo}
            </p>
            <div className="space-y-2.5">
              {grupo.filas
                .filter((fila) => !fila.soloSiHay || fila.value)
                .map((fila) => (
                  <div key={fila.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex-shrink-0 text-gray-400">{fila.label}</span>
                    <span className="truncate text-right font-medium text-gray-800">
                      {fila.value || GUION}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* La ficha tecnica vive en el lote: se abre el archivo directo. */}
        {(imagen || pdf) && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-marca">
              Ficha tecnica
            </p>
            <div className="flex flex-wrap gap-2">
              {imagen && (
                <a
                  href={imagen}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-marca hover:bg-gray-50"
                >
                  <Image className="h-3.5 w-3.5" />
                  Ver foto
                </a>
              )}
              {pdf && (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-marca hover:bg-gray-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Ver PDF
                </a>
              )}
            </div>
          </div>
        )}

        {orden?.observaciones && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-marca">
              Observaciones
            </p>
            <p className="whitespace-pre-line text-sm text-gray-800">{orden.observaciones}</p>
          </div>
        )}

        {orden?.nombre_creador && (
          <p className="border-t border-gray-100 pt-3 text-xs text-gray-400">
            Creada por {orden.nombre_creador} · {formatFechaHora(orden.fecha_emision)}
          </p>
        )}
      </div>
    </div>
  );
}
