import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { GUION } from "../utils/formatters";

/**
 * Detalle de un registro, con la misma presentacion en todos los modulos.
 *
 *   secciones: [{ titulo, filas: [{ label, value, ancho: "completo" }] }]
 *
 * Los valores vacios se muestran como raya para que la ficha conserve su
 * estructura y no parezca que falto informacion por un error.
 */
function Fila({ fila }) {
  return (
    <div className={fila.ancho === "completo" ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{fila.label}</dt>
      <dd className="mt-0.5 break-words text-sm text-gray-900">
        {fila.value === null || fila.value === undefined || fila.value === "" ? (
          <span className="text-gray-300">{GUION}</span>
        ) : (
          fila.value
        )}
      </dd>
    </div>
  );
}

export function DetailModal({
  open,
  title,
  subtitle,
  estado,
  secciones = [],
  onClose,
  footer = null,
  icon,
  maxWidth = "max-w-2xl",
}) {
  return (
    <Modal
      open={open}
      title={title}
      description={subtitle}
      onClose={onClose}
      footer={footer}
      maxWidth={maxWidth}
      icon={icon}
    >
      {estado && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Estado</span>
          <StatusBadge status={estado} />
        </div>
      )}

      <div className="space-y-6">
        {secciones
          .filter((seccion) => seccion?.filas?.length > 0)
          .map((seccion) => (
            <section key={seccion.titulo || "general"}>
              {seccion.titulo && (
                <h3 className="mb-3 border-b border-gray-100 pb-2 text-xs font-semibold uppercase tracking-wider text-[#0F4C3F]">
                  {seccion.titulo}
                </h3>
              )}
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                {seccion.filas.map((fila, indice) => (
                  <Fila key={`${fila.label}-${indice}`} fila={fila} />
                ))}
              </dl>
            </section>
          ))}
      </div>
    </Modal>
  );
}
