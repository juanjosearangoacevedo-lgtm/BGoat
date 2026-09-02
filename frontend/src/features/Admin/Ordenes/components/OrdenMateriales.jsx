import { Package } from "lucide-react";

/**
 * Materiales e insumos de la ficha tecnica (tabla `ficha_tecnica_materiales`):
 * telas, cremalleras, botones, etiquetas, etc.
 */
export function OrdenMateriales({ materiales = [] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-5 flex items-center gap-2 font-bold text-gray-900">
        <Package className="h-4 w-4 text-[#F39A3D]" />
        Materiales e Insumos
      </h3>

      {materiales.length === 0 ? (
        <p className="text-sm text-gray-400">Los materiales se cargan de la ficha tecnica de la referencia.</p>
      ) : (
        <div className="space-y-3">
          {materiales.map((material) => (
            <div
              key={material.id_material}
              className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{material.nombre}</p>
                <p className="text-xs text-gray-400">
                  {material.cantidad_por_prenda} {material.unidad_medida} por prenda
                  {material.descripcion ? ` · ${material.descripcion}` : ""}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                <span className="rounded-full bg-[#433A9B]/10 px-2.5 py-1 text-xs font-medium text-[#433A9B]">
                  {material.tipo}
                </span>
                {!material.obligatorio && (
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Opcional</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
