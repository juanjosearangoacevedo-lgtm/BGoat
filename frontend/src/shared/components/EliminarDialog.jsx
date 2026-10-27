import { useEnlaces } from "../hooks/useEnlaces";
import { ConfirmDialog } from "./ConfirmDialog";

const CON_ARTICULO = /^(el|la|los|las|este|esta|ese|esa)\s/i;

/**
 * "Eliminar" de cualquier modulo.
 *
 * En este sistema eliminar es dejar el registro fuera de servicio (solo se
 * borra de verdad lo que nunca se uso), y un registro que algo mantiene en uso
 * no puede salir: un cliente con lotes en proceso, una talla del desglose de
 * un lote activo, un modulo con la jornada abierta. Por eso, antes de pedir la
 * confirmacion, pregunta al backend a que esta enlazado (`GET <recurso>/<id>/enlaces`):
 *
 *   - si algo lo mantiene en uso, dice a que (cada lote, jornada...) y no
 *     deja confirmar;
 *   - si esta libre, pide la confirmacion de siempre.
 *
 * La consulta es solo informativa: el DELETE vuelve a revisarlo en el backend.
 *
 *   recurso  -> ruta de `endpoints` ("/clientes")
 *   objetivo -> el registro a eliminar, o null si el dialogo esta cerrado
 *   entidad  -> como se llama en singular ("cliente"), para el titulo
 *   nombre   -> como se muestra ese registro ("GEF")
 */
export function EliminarDialog({
  recurso,
  objetivo,
  idField,
  entidad = "registro",
  nombre,
  loading = false,
  onCancel,
  onConfirm,
}) {
  const abierto = Boolean(objetivo);
  const { cargando, info } = useEnlaces(abierto ? recurso : null, objetivo?.[idField]);

  if (!abierto) return null;

  // Algunos modulos nombran al registro con su articulo ("la talla XL"): ese va tal cual.
  const quien = !nombre ? `este ${entidad}` : CON_ARTICULO.test(nombre) ? nombre : `«${nombre}»`;

  if (info?.bloqueado) {
    const faltan = info.total - info.enlaces.length;
    return (
      <ConfirmDialog
        open
        ancho="md"
        tono="advertencia"
        title={`No se puede eliminar ${quien}`}
        description={info.motivo ?? info.mensaje}
        cancelLabel="Entendido"
        ocultarConfirmar
        onCancel={onCancel}
      >
        {info.enlaces.length > 0 && (
          <ul className="mb-4 max-h-52 space-y-1.5 overflow-y-auto rounded-xl bg-gray-50 p-3 text-left">
            {info.enlaces.map((enlace, indice) => (
              <li key={`${enlace.tipo}-${enlace.titulo}-${indice}`} className="text-sm">
                <span className="font-semibold text-gray-800">{enlace.titulo}</span>
                {enlace.detalle && <span className="text-gray-500"> · {enlace.detalle}</span>}
              </li>
            ))}
            {faltan > 0 && <li className="text-xs text-gray-400">y {faltan} más…</li>}
          </ul>
        )}
        {info.ayuda && <p className="mb-6 text-sm text-gray-500">{info.ayuda}</p>}
      </ConfirmDialog>
    );
  }

  const descripcion = cargando
    ? "Revisando si está en uso…"
    : info?.borra
      ? `Se eliminará ${quien} de forma definitiva.`
      : `${quien} dejará de aparecer en las listas y en los formularios. Su historia se conserva y podrás volver a activarlo.`;

  return (
    <ConfirmDialog
      open
      title={`¿Eliminar ${entidad}?`}
      description={descripcion}
      loading={loading}
      confirmDisabled={cargando}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
