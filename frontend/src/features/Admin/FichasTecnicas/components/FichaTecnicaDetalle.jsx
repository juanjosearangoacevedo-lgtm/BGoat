import { ArrowLeft, List, Package2, Ruler, Shirt } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { formatFecha, GUION } from "@/shared/utils/formatters";

/**
 * Detalle de una ficha tecnica con sus tres tablas hijas:
 * operaciones, materiales y tabla de medidas.
 */
export function FichaTecnicaDetalle({
  ficha,
  referencia,
  operaciones = [],
  materiales = [],
  medidas = [],
  onBack,
}) {
  const ref = ficha.referencia || referencia;

  const datos = [
    { label: "Codigo de ficha", value: ficha.codigo_ficha },
    { label: "Version", value: ficha.version },
    { label: "Referencia", value: ref?.codigo || ficha.id_referencia },
    { label: "Marca", value: ref?.marca?.nombre },
    { label: "Material principal", value: ficha.material_principal },
    { label: "SAM pactado (min/unidad)", value: ficha.sam_pactado },
    { label: "Personal requerido", value: ficha.personal_requerido },
    { label: "Fecha de vigencia", value: formatFecha(ficha.fecha_vigencia) },
  ];

  return (
    <div className="p-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-500 transition-colors hover:text-[#433A9B]"
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al catalogo
      </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#433A9B]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            {ficha.ruta_imagen ? (
              <img src={ficha.ruta_imagen} alt={ficha.codigo_ficha} className="h-full w-full object-cover" />
            ) : (
              <Shirt className="h-32 w-32 text-white/80" />
            )}
            <div className="absolute bottom-4 left-4 right-4">
              <p className="rounded-lg bg-black/20 px-3 py-2 text-center text-xs font-medium text-white/90 backdrop-blur-sm">
                {ficha.codigo_ficha} · v{ficha.version}
              </p>
            </div>
          </div>

          {ficha.ruta_documento_pdf && (
            <a
              href={ficha.ruta_documento_pdf}
              target="_blank"
              rel="noreferrer"
              className="mt-4 block rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-medium text-[#433A9B] hover:bg-[#433A9B]/5"
            >
              Abrir ficha en PDF
            </a>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div>
            <StatusBadge status={ficha.estado} />
            <h1 className="mt-2 text-3xl font-bold text-gray-900">{ref?.nombre || ficha.codigo_ficha}</h1>
            <p className="mt-2 text-gray-600">{ficha.descripcion || "Sin descripcion"}</p>
          </div>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-[#433A9B]" />
              <h3 className="font-semibold text-gray-900">Datos de la ficha</h3>
            </div>
            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
              {datos.map((dato) => (
                <div key={dato.label}>
                  <span className="font-medium text-gray-500">{dato.label}:</span> {dato.value || GUION}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <List className="h-4 w-4 text-[#433A9B]" />
              <h3 className="font-semibold text-gray-900">Operaciones de confeccion ({operaciones.length})</h3>
            </div>
            {operaciones.length === 0 ? (
              <p className="text-sm text-gray-400">Sin operaciones registradas para esta ficha.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2 pr-3">#</th>
                      <th className="py-2 pr-3">Operacion</th>
                      <th className="py-2 pr-3">Maquina</th>
                      <th className="py-2">Minutos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {operaciones.map((operacion) => (
                      <tr key={operacion.id_operacion}>
                        <td className="py-2 pr-3 text-gray-500">{operacion.numero_operacion}</td>
                        <td className="py-2 pr-3 text-gray-800">{operacion.nombre_operacion}</td>
                        <td className="py-2 pr-3 text-gray-600">{operacion.maquina_requerida || GUION}</td>
                        <td className="py-2 text-gray-800">{operacion.tiempo_estandar_minutos ?? GUION}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Package2 className="h-4 w-4 text-[#F39A3D]" />
              <h3 className="font-semibold text-gray-900">Materiales e insumos ({materiales.length})</h3>
            </div>
            {materiales.length === 0 ? (
              <p className="text-sm text-gray-400">Sin materiales registrados para esta ficha.</p>
            ) : (
              <ul className="space-y-2">
                {materiales.map((material) => (
                  <li key={material.id_material} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-800">
                      {material.nombre}
                      <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {material.tipo}
                      </span>
                    </span>
                    <span className="flex-shrink-0 text-gray-600">
                      {material.cantidad_por_prenda} {material.unidad_medida}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4 text-[#433A9B]" />
              <h3 className="font-semibold text-gray-900">Tabla de medidas ({medidas.length})</h3>
            </div>
            {medidas.length === 0 ? (
              <p className="text-sm text-gray-400">Sin tabla de medidas registrada para esta ficha.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="py-2 pr-3">Punto de medida</th>
                      <th className="py-2 pr-3">Talla</th>
                      <th className="py-2 pr-3">Valor (cm)</th>
                      <th className="py-2">Tolerancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {medidas.map((medida) => (
                      <tr key={medida.id_medida}>
                        <td className="py-2 pr-3 text-gray-800">{medida.punto_medida}</td>
                        <td className="py-2 pr-3 text-gray-600">{medida.talla?.nombre || medida.id_talla}</td>
                        <td className="py-2 pr-3 text-gray-800">{medida.valor_cm}</td>
                        <td className="py-2 text-gray-600">± {medida.tolerancia_cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
