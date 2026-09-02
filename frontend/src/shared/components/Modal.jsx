import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Ventana modal del panel.
 * Cierra con Escape o clic fuera y bloquea el scroll del fondo mientras esta
 * abierta, que era lo que hacia que el formulario "saltara" al abrirse.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = "max-w-md",
  icon: Icono = null,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const alPresionar = (evento) => {
      if (evento.key === "Escape") onClose?.();
    };
    const overflowPrevio = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", alPresionar);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener("keydown", alPresionar);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose?.();
      }}
    >
      <div className={`flex max-h-[92vh] w-full ${maxWidth} flex-col rounded-2xl bg-white shadow-2xl`}>
        <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-gray-100 p-6">
          <div className="flex items-start gap-3">
            {Icono && (
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#433A9B]/10 text-[#433A9B]">
                <Icono className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-2 hover:bg-gray-100"
            type="button"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="scroll-suave flex-1 overflow-y-auto p-6">{children}</div>

        {footer && <div className="flex flex-shrink-0 gap-3 border-t border-gray-100 p-6">{footer}</div>}
      </div>
    </div>
  );
}
