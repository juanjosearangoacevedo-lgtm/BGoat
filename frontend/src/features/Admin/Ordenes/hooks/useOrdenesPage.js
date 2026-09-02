import { useMemo } from "react";
import { statusLabel } from "@/shared/components/StatusBadge";
import { useCatalogo } from "@/shared/hooks/useCatalogo";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Listado de ordenes -> vista `vw_avance_orden` (tabla `ordenes_produccion`
 * mas lote, modulo, ficha, cliente, marca y el avance real calculado).
 */
export const ordenStatuses = ["PENDIENTE", "EN_PROCESO", "PAUSADA", "FINALIZADA", "CANCELADA"];
export const ordenPrioridades = ["BAJA", "MEDIA", "ALTA", "URGENTE"];

/** Los ENUM viajan en mayusculas a la base; en pantalla se ven legibles. */
export const ordenStatusOptions = ordenStatuses.map((estado) => ({
  value: estado,
  label: statusLabel(estado),
}));

export const ordenPrioridadOptions = ordenPrioridades.map((prioridad) => ({
  value: prioridad,
  label: statusLabel(prioridad),
}));

export function useOrdenesPage() {
  const crud = useCrudResource({
    recurso: endpoints.ordenes,
    idField: "id_orden_produccion",
    nombreRegistro: (orden) => (orden?.numero_orden ? `la orden ${orden.numero_orden}` : "la orden"),
  });

  const modulos = useCatalogo(endpoints.modulos, {
    valor: "id_modulo",
    etiqueta: (fila) => `${fila.codigo} - ${fila.nombre}`,
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: ordenStatusOptions,
      },
      {
        clave: "prioridad",
        label: "Prioridad",
        etiquetaTodos: "Todas las prioridades",
        opciones: ordenPrioridadOptions,
      },
      {
        clave: "id_modulo",
        label: "Modulo",
        etiquetaTodos: "Todos los modulos",
        opciones: modulos.options,
      },
      {
        clave: "avance",
        label: "Avance",
        etiquetaTodos: "Cualquier avance",
        opciones: [
          { value: "sin-iniciar", label: "Sin iniciar" },
          { value: "en-curso", label: "En curso" },
          { value: "completas", label: "Completas" },
        ],
        comparar: (fila, valor) => {
          const avance = Number(fila.porcentaje_avance || 0);
          if (valor === "sin-iniciar") return avance === 0;
          if (valor === "completas") return avance >= 100;
          return avance > 0 && avance < 100;
        },
      },
    ],
    [modulos.options],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "fecha_emision", direccion: "desc" },
    pageSize: 10,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const contar = (estado) =>
      crud.items.filter((orden) => String(orden.estado || "").toUpperCase() === estado).length;

    return {
      total: crud.items.length,
      enProceso: contar("EN_PROCESO"),
      pendientes: contar("PENDIENTE"),
      finalizadas: contar("FINALIZADA"),
    };
  }, [crud.items]);

  return { ...crud, lista, resumen, orders: crud.items };
}
