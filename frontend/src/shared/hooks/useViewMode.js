import { useCallback, useState } from "react";

/**
 * Modo de visualizacion de un listado (tarjetas / lista / tabla).
 *
 * Se recuerda por modulo en localStorage: si la digitadora prefiere la tabla
 * en Clientes, la encuentra asi la proxima vez que entre.
 */
export const MODOS = { TARJETAS: "tarjetas", LISTA: "lista", TABLA: "tabla" };

const PREFIJO = "bgoat-vista-";

export function useViewMode(modulo, inicial = MODOS.TARJETAS, permitidos = null) {
  const opciones = permitidos || [MODOS.TARJETAS, MODOS.LISTA, MODOS.TABLA];

  const [modo, setModo] = useState(() => {
    try {
      const guardado = window.localStorage.getItem(PREFIJO + modulo);
      return guardado && opciones.includes(guardado) ? guardado : inicial;
    } catch {
      return inicial;
    }
  });

  const cambiar = useCallback(
    (siguiente) => {
      if (!opciones.includes(siguiente)) return;
      setModo(siguiente);
      try {
        window.localStorage.setItem(PREFIJO + modulo, siguiente);
      } catch {
        // Navegar en modo privado no debe romper la vista.
      }
    },
    [modulo, opciones],
  );

  return { modo, setModo: cambiar, opciones };
}
