import { useEffect, useMemo, useState } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { buildPath, endpoints } from "@/shared/services/endpoints";
import { porcentaje } from "@/shared/utils/formatters";
import { crearModuloEsquema, moduloEstados } from "../validations/moduloValidation";

/**
 * Modulo "Modulos y Empleados" -> tabla `modulos`.
 *
 * El tablero se alimenta de /indicadores/estado-modulos, que combina la
 * configuracion del modulo con la produccion del dia (vw_estado_modulo_dia)
 * y la orden que esta trabajando (vw_avance_orden).
 */
export const moduloStatusOptions = moduloEstados.map((estado) => ({
  value: estado,
  label: estado.charAt(0) + estado.slice(1).toLowerCase(),
}));

export const emptyModuloForm = {
  codigo: "",
  nombre: "",
  ubicacion: "",
  capacidad_operarios: "",
  umbral_cumplimiento: "85",
  orden_visual: "1",
  estado: "ACTIVO",
  observaciones: "",
};

export function useModulosPage() {
  const crud = useCrudResource({
    recurso: endpoints.modulos,
    idField: "id_modulo",
    emptyForm: emptyModuloForm,
    nombreRegistro: (modulo) => (modulo?.codigo ? `el modulo ${modulo.codigo}` : "el modulo"),
    esquema: ({ items, editing }) => crearModuloEsquema({ lista: items, editing }),
    transformarPayload: (datos) => ({
      ...datos,
      capacidad_operarios: Number(datos.capacidad_operarios || 0),
      umbral_cumplimiento: Number(datos.umbral_cumplimiento || 85),
      orden_visual: Number(datos.orden_visual || 1),
    }),
  });

  const [estado, setEstado] = useState([]);
  const [selected, setSelected] = useState(null);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);

  // Estado del dia de cada modulo (produccion, eficiencia, orden activa).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const respuesta = await apiClient.get(withQuery(endpoints.estadoModulos, {}));
        if (activo) setEstado(respuesta?.datos ?? []);
      } catch {
        if (activo) setEstado([]);
      }
    })();
    return () => {
      activo = false;
    };
  }, [crud.allItems]);

  /**
   * La jornada de hoy del modulo abierto: que lote corre y quien esta.
   *
   * Antes este panel mostraba "personal asignado" desde
   * `asignaciones_modulo`, que eran rangos de fechas abiertos y nunca se
   * poblaba. Ahora sale de la nomina de la jornada, que es una lista
   * cerrada del dia y si dice quien esta hoy en el modulo.
   */
  useEffect(() => {
    if (!selected?.id_modulo) {
      setJornadaSeleccionada(null);
      return undefined;
    }

    let activo = true;
    (async () => {
      try {
        const ruta = buildPath(endpoints.jornadaModulo, { id: selected.id_modulo });
        const respuesta = await apiClient.get(ruta);
        if (activo) setJornadaSeleccionada(respuesta);
      } catch {
        if (activo) setJornadaSeleccionada(null);
      }
    })();

    return () => {
      activo = false;
    };
  }, [selected]);

  /** Cruza la configuracion del modulo con su estado del dia. */
  const modulos = useMemo(() => {
    const porId = new Map(estado.map((fila) => [fila.id_modulo, fila]));
    return crud.items.map((modulo) => ({ ...modulo, ...(porId.get(modulo.id_modulo) || {}) }));
  }, [crud.items, estado]);

  const ubicaciones = useMemo(
    () => Array.from(new Set(modulos.map((modulo) => modulo.ubicacion).filter(Boolean))).sort(),
    [modulos],
  );

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: moduloStatusOptions,
      },
      {
        clave: "ubicacion",
        label: "Ubicacion",
        etiquetaTodos: "Todas las ubicaciones",
        opciones: ubicaciones.map((ubicacion) => ({ value: ubicacion, label: ubicacion })),
      },
      {
        clave: "ocupacion",
        label: "Ocupacion",
        etiquetaTodos: "Con y sin personal",
        opciones: [
          { value: "con", label: "Con personal asignado" },
          { value: "sin", label: "Sin personal hoy" },
        ],
        comparar: (fila, valor) =>
          valor === "con"
            ? Number(fila.promedio_personas || 0) > 0
            : Number(fila.promedio_personas || 0) === 0,
      },
    ],
    [ubicaciones],
  );

  const lista = useListaAdmin(modulos, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "orden_visual", direccion: "asc" },
    pageSize: 12,
    extraReset: [crud.search],
  });

  /**
   * El cierre del dia de toda la planta: la fila de totales del tablero.
   *
   * Todo sale sumado de `vw_estado_modulo_dia`, no recalculado aqui.
   */
  const totals = useMemo(() => {
    const suma = (campo) => modulos.reduce((total, modulo) => total + Number(modulo[campo] || 0), 0);

    const producido = suma("unidades_producidas");
    const metaDia = suma("meta_dia");
    const minutosDisponibles = suma("minutos_disponibles");
    const minutosGanados = suma("minutos_ganados");
    const facturacionMeta = suma("facturacion_meta");
    const facturacionReal = suma("facturacion_real");

    // El horario es de la planta, no del modulo: todas las filas traen el
    // mismo valor y basta con leerlo de la primera.
    const horario = modulos.find((modulo) => Number(modulo.minutos_horario) > 0);

    return {
      modulos: modulos.length,
      capacidad: suma("capacidad_operarios"),
      operariosAsignados: Math.round(suma("promedio_personas")),
      producido,
      metaDia: Math.round(metaDia),

      // Minutos ganados sobre minutos puestos, igual que las vistas.
      // Promediar el porcentaje de cada modulo le daba el mismo peso a
      // uno de 3 personas que a uno de 12.
      eficiencia:
        minutosDisponibles > 0
          ? Number(((minutosGanados * 100) / minutosDisponibles).toFixed(1))
          : 0,

      minutosDisponibles,
      minutosGanados,
      minutosPerdidos: suma("minutos_perdidos_persona"),
      facturacionMeta,
      facturacionReal,
      cumplimientoFacturacion:
        facturacionMeta > 0 ? Number(((facturacionReal * 100) / facturacionMeta).toFixed(1)) : 0,
      cumplimiento: porcentaje(producido, metaDia || producido),
      minutosHorario: Number(horario?.minutos_horario || 0),
      horasHorario: Number(horario?.horas_horario || 0),
    };
  }, [modulos]);

  return {
    ...crud,
    modulos,
    lista,
    ubicaciones,
    selected,
    setSelected,
    jornadaSeleccionada,
    totals,
  };
}
