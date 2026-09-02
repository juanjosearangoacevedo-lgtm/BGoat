import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";

/**
 * Modo lista: una fila compacta por registro.
 *
 * Es la alternativa a las tarjetas en los modulos que ya las tenian
 * (clientes, marcas, modulos, fichas): la misma informacion, pero densa,
 * para cuando hay que revisar muchos registros seguidos.
 *
 *   primario(item)   -> titulo de la fila
 *   secundario(item) -> linea de apoyo
 *   meta(item)       -> [{ label, value }] que se muestran a la derecha
 *   avatar(item, i)  -> nodo opcional a la izquierda
 */
function Cargando() {
  return Array.from({ length: 4 }, (_, indice) => (
    <div key={indice} className="flex animate-pulse items-center gap-4 px-5 py-4">
      <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-gray-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded-full bg-gray-100" />
        <div className="h-2.5 w-1/2 rounded-full bg-gray-50" />
      </div>
    </div>
  ));
}

export function DataList({
  items = [],
  rowKey = "id",
  loading = false,
  empty,
  primario,
  secundario,
  meta,
  estado,
  avatar,
  acciones,
  onClick,
  footer = null,
}) {
  const vacia = !loading && items.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="divide-y divide-gray-50">
        {loading && <Cargando />}

        {!loading &&
          items.map((item, indice) => (
            <div
              key={item[rowKey] ?? indice}
              onClick={onClick ? () => onClick(item) : undefined}
              className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 ${
                onClick ? "cursor-pointer" : ""
              }`}
            >
              {avatar && <div className="flex-shrink-0">{avatar(item, indice)}</div>}

              <div className="min-w-32 flex-1">
                <p className="truncate font-medium text-gray-900">{primario?.(item)}</p>
                {secundario && <p className="truncate text-xs text-gray-400">{secundario(item)}</p>}
              </div>

              {/* Los datos de apoyo son lo primero que se oculta: el nombre, el
                  estado y las acciones deben caber siempre en la misma fila. */}
              {meta && (
                <div className="hidden min-w-0 shrink items-center gap-6 xl:flex">
                  {meta(item)
                    .filter(Boolean)
                    .map((entrada) => (
                      <div key={entrada.label} className="min-w-0 max-w-44">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          {entrada.label}
                        </p>
                        <p className="truncate text-sm text-gray-700">{entrada.value}</p>
                      </div>
                    ))}
                </div>
              )}

              <div className="ml-auto flex flex-shrink-0 items-center gap-3">
                {estado && <StatusBadge status={estado(item)} />}
                {acciones && acciones(item)}
              </div>
            </div>
          ))}
      </div>

      {vacia && (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title || "No hay registros"}
          description={empty?.description}
          action={empty?.action}
        />
      )}

      {footer}
    </div>
  );
}
