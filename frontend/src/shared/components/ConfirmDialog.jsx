import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, PauseCircle, Trash2 } from "lucide-react";
import { Button } from "./button";

/**
 * Confirmacion de una accion sensible.
 *
 * `tono` cambia el icono y el color del boton para que borrar no se vea igual
 * que activar: la digitadora distingue de un vistazo que va a pasar.
 */
const tonos = {
  peligro: {
    icono: Trash2,
    circulo: "bg-red-100",
    color: "text-red-500",
    boton: "bg-red-500 text-white hover:bg-red-600",
  },
  advertencia: {
    icono: PauseCircle,
    circulo: "bg-amber-100",
    color: "text-amber-500",
    boton: "bg-amber-500 text-white hover:bg-amber-600",
  },
  exito: {
    icono: CheckCircle2,
    circulo: "bg-green-100",
    color: "text-green-600",
    boton: "bg-green-600 text-white hover:bg-green-700",
  },
  info: {
    icono: AlertTriangle,
    circulo: "bg-marca/10",
    color: "text-marca-letra",
    boton: "bg-dorado text-white hover:bg-dorado-hover",
  },
};

/**
 * `children` va entre el texto y los botones (por ejemplo, la lista de lotes a
 * los que esta enlazado un cliente). Con `ocultarConfirmar` solo queda el boton
 * de cerrar: es el aviso de "esto no se puede hacer". `ancho="md"` ensancha la
 * caja para que quepa una lista.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  tono = "peligro",
  loading = false,
  ocultarConfirmar = false,
  confirmDisabled = false,
  ancho = "sm",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const alPresionar = (evento) => {
      if (evento.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [open, onCancel]);

  if (!open) return null;

  const estilo = tonos[tono] || tonos.peligro;
  const Icono = estilo.icono;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCancel?.();
      }}
    >
      <div
        className={`w-full rounded-2xl bg-white p-6 text-center shadow-2xl ${
          ancho === "md" ? "max-w-md" : "max-w-sm"
        }`}
      >
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${estilo.circulo}`}>
          <Icono className={`h-7 w-7 ${estilo.color}`} />
        </div>

        <h2 className="mb-2 text-lg font-bold text-gray-900">{title}</h2>
        {description && <p className={`${children ? "mb-4" : "mb-6"} text-sm text-gray-500`}>{description}</p>}
        {children}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          {!ocultarConfirmar && (
            <Button
              className={`flex-1 ${estilo.boton}`}
              onClick={onConfirm}
              disabled={loading || confirmDisabled}
            >
              {loading ? "Procesando..." : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
