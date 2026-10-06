import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * "+ Nuevo responsable" debajo del select del formulario de la causa.
 *
 * El responsable dejo de ser texto libre (`responsables`), pero no tiene
 * pantalla propia: si falta uno se agrega aqui mismo, sin salir del
 * formulario, y queda escogido.
 */
export function NuevoResponsable({ onCreado }) {
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  const crear = async () => {
    const limpio = nombre.trim().replace(/\s+/g, " ");
    if (limpio.length < 3) {
      toast.error("El nombre del responsable debe tener al menos 3 caracteres");
      return;
    }
    setGuardando(true);
    try {
      const respuesta = await apiClient.post(endpoints.responsables, { nombre: limpio });
      const id = respuesta?.datos?.id_responsable ?? respuesta?.id_responsable ?? respuesta?.id;
      toast.success(`Responsable "${limpio}" agregado`);
      setNombre("");
      setAbierto(false);
      onCreado?.(id);
    } catch (error) {
      toast.error(error.message || "No se pudo agregar el responsable");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-1 flex items-center gap-1 text-xs font-medium text-marca hover:underline"
      >
        <Plus className="h-3.5 w-3.5" />
        Nuevo responsable
      </button>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        autoFocus
        value={nombre}
        maxLength={80}
        placeholder="Ej: Logistica"
        onChange={(evento) => setNombre(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter") {
            evento.preventDefault();
            crear();
          }
          if (evento.key === "Escape") setAbierto(false);
        }}
        className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-marca"
      />
      <button
        type="button"
        disabled={guardando}
        onClick={crear}
        className="h-9 rounded-lg bg-marca px-3 text-xs font-medium text-white disabled:opacity-60"
      >
        {guardando ? "Agregando..." : "Agregar"}
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="h-9 rounded-lg px-2 text-xs text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
    </div>
  );
}
