/**
 * La prioridad ya no es BAJA/MEDIA/ALTA/URGENTE: es la posicion de la
 * orden en la cola global, asignada sola al crearla. El numero mas bajo
 * es la orden mas vieja esperando turno.
 */
export function PrioridadBadge({ prioridad }) {
  if (!prioridad) return null;

  return (
    <span className="rounded-full bg-[#0F4C3F]/10 px-2 py-1 text-xs font-semibold text-[#0F4C3F]">
      #{prioridad}
    </span>
  );
}
