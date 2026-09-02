import { Inbox } from "lucide-react";

/**
 * Estado vacio de listados y tablas.
 * `action` permite ofrecer la salida obvia (crear el primer registro o
 * limpiar los filtros que dejaron la lista sin resultados).
 */
export function EmptyState({ icon: Icon = Inbox, title, description, action = null, compacto = false }) {
  return (
    <div className={`text-center text-gray-400 ${compacto ? "px-6 py-10" : "px-6 py-16"}`}>
      <Icon className={`mx-auto mb-3 opacity-30 ${compacto ? "h-8 w-8" : "h-10 w-10"}`} />
      <p className="font-medium text-gray-500">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
