import { useEffect, useState } from "react";
import { Calculator } from "lucide-react";
import { Button } from "@/shared/components/button";
import { Modal } from "@/shared/components/Modal";
import { formatMoneda } from "@/shared/utils/formatters";

/**
 * Como Gods Eyes SAS determina el SAM a partir del precio pactado con el
 * cliente (documento "Proyecto SENA-GODS EYES Septiembre 2026.xlsx"): se
 * descuenta la retefuente, el precio neto se convierte a minutos con el
 * valor del minuto de la empresa, y se le resta lo que ya toma terminacion
 * y empaque -- lo que queda es el SAM del modulo de confeccion.
 *
 * Las dos constantes de la empresa quedan fijas aqui por ahora; si German
 * necesita ajustarlas seguido, se vuelven un parametro editable aparte.
 *
 * El precio que se escribe aqui ES "Valor de maquila por unidad": por eso
 * arranca precargado con ese campo. Si alguien lo cambia para probar un
 * escenario distinto, `onUsar` manda tambien ese precio para que el
 * formulario actualice "Valor de maquila" -el SAM y el precio con el que
 * se calculo no pueden quedar desincronizados.
 */
const RETEFUENTE_PCT = 0.07;
const VALOR_MINUTO_EMPRESA = 660;
const MINUTOS_TERMINACION_EMPAQUE = 1.23;

export function CalculadoraSamModal({ open, precioInicial, onClose, onUsar }) {
  const [precio, setPrecio] = useState(precioInicial ?? "");

  // El formulario del lote puede llenar "Valor de maquila" despues de que
  // este componente ya se monto, asi que el estado inicial de useState no
  // lo alcanza a ver: se sincroniza de nuevo cada vez que la ventana abre.
  useEffect(() => {
    if (open) setPrecio(precioInicial ?? "");
  }, [open, precioInicial]);

  const precioNum = Number(precio) || 0;
  const retefuente = precioNum * RETEFUENTE_PCT;
  const precioReal = precioNum - retefuente;
  const minutosReales = precioReal / VALOR_MINUTO_EMPRESA;
  const samSugerido = Math.max(0, minutosReales - MINUTOS_TERMINACION_EMPAQUE);

  return (
    <Modal
      open={open}
      icon={Calculator}
      title="SAM: acuerdo con el cliente"
      description="El SAM sale del precio pactado, no se inventa aparte."
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={precioNum <= 0}
            onClick={() => onUsar(Number(samSugerido.toFixed(2)), precioNum)}
            className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
          >
            Usar este SAM
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Precio pactado con el cliente</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">$</span>
            <input
              type="number"
              min={0}
              step="0.01"
              autoFocus
              value={precio}
              onChange={(event) => setPrecio(event.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 px-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#0F4C3F]/30"
            />
            <span className="whitespace-nowrap text-xs text-gray-500">/ unidad</span>
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Retefuente ({(RETEFUENTE_PCT * 100).toFixed(0)}%)</span>
            <span>− {formatMoneda(retefuente)}</span>
          </div>
          <div className="flex justify-between">
            <span>Precio real</span>
            <span>{formatMoneda(precioReal)}</span>
          </div>
          <div className="flex justify-between">
            <span>÷ Valor minuto God&apos;s Eyes ({formatMoneda(VALOR_MINUTO_EMPRESA)})</span>
            <span>{minutosReales.toFixed(2)} min</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span>− Terminacion y empaque</span>
            <span>{MINUTOS_TERMINACION_EMPAQUE.toFixed(2)} min</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-4">
          <div>
            <p className="text-xs font-medium text-emerald-800">SAM sugerido</p>
            <p className="text-xs text-emerald-700">calculado del precio pactado</p>
          </div>
          <p className="text-2xl font-bold text-emerald-900">{samSugerido.toFixed(2)} min</p>
        </div>
      </div>
    </Modal>
  );
}
