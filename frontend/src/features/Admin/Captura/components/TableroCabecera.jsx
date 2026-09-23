import { formatMoneda, formatNumero } from "@/shared/utils/formatters";

function Dato({ etiqueta, valor, nota, tono = "gris" }) {
  const tonos = {
    gris: "text-gray-900",
    marca: "text-[#0F4C3F]",
    verde: "text-green-600",
    ambar: "text-[#b46a12]",
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{etiqueta}</p>
      <p className={`mt-1 truncate text-lg font-bold tabular-nums ${tonos[tono]}`} title={String(valor)}>
        {valor}
      </p>
      {nota && <p className="mt-0.5 truncate text-[11px] text-gray-400">{nota}</p>}
    </div>
  );
}

/**
 * La cabecera del tablero: las celdas B7:C17 de la hoja de la empresa.
 *
 * En la hoja hay dos que estan mal y que aqui se calculan: la meta del
 * dia queda en blanco, y la "meta de facturacion / dia" trae en realidad
 * la de una sola hora (540.259 en vez de 4.682.251).
 */
export function TableroCabecera({ cabecera, jornada, modulo }) {
  if (!cabecera) return null;


  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Dato etiqueta="Modulo" valor={modulo?.codigo ?? "—"} nota={modulo?.nombre} />
      <Dato etiqueta="Personas" valor={cabecera.personas} tono="marca" />
      <Dato
        etiqueta="Lote"
        valor={cabecera.lote ?? "—"}
        nota={cabecera.codigo_referencia ? `Ref. ${cabecera.codigo_referencia}` : null}
      />
      <Dato etiqueta="Cliente" valor={cabecera.cliente ?? "—"} nota={cabecera.referencia} />
      <Dato
        etiqueta="Tiempo / unidad (SAM)"
        valor={`${cabecera.sam} min`}
        nota="Lo que el cliente paga por prenda"
        tono="marca"
      />

      <Dato
        etiqueta="Jornada"
        valor={`${cabecera.horas_jornada} h`}
        nota={`${jornada?.codigo ?? "—"} · ${cabecera.minutos_jornada} minutos`}
      />
      <Dato
        etiqueta="Meta / hora"
        valor={formatNumero(Math.round(cabecera.meta_hora))}
        nota="Franja plena de 60 min"
      />
      {/* Es la meta de la jornada COMPLETA, capturada o no: lo que el
          modulo puede dar hoy. Lo capturado hasta ahora va en el pie de
          la tabla. En la hoja de la empresa esta celda quedo vacia. */}
      <Dato
        etiqueta="Meta / dia"
        valor={formatNumero(Math.round(cabecera.meta_dia))}
        nota={`Jornada completa · ${jornada?.franjas?.length ?? 0} franjas`}
        tono="marca"
      />
      <Dato etiqueta="$ / unidad" valor={formatMoneda(cabecera.precio_unidad)} tono="verde" />
      <Dato
        etiqueta="Meta facturacion / dia"
        valor={formatMoneda(cabecera.facturacion_meta_dia)}
        nota={`${formatMoneda(cabecera.facturacion_meta_hora)} por hora plena`}
        tono="verde"
      />
    </div>
  );
}
