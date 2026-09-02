import { useEffect, useMemo, useState } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
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
  horas_jornada: "9",
  horas_semanales: "44",
  eficiencia_esperada: "80",
  umbral_cumplimiento: "85",
  orden_visual: "1",
  estado: "ACTIVO",
  observaciones: "",
};

/** Minutos-hombre disponibles por semana segun la capacidad configurada. */
export function capacidadSemanalMinutos(modulo) {
  const operarios = Number(modulo?.capacidad_operarios || 0);
  const horas = Number(modulo?.horas_semanales || 0);
  const eficiencia = Number(modulo?.eficiencia_esperada || 0);
  return Math.round(operarios * horas * 60 * (eficiencia / 100));
}

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
      horas_jornada: Number(datos.horas_jornada || 9),
      horas_semanales: Number(datos.horas_semanales || 44),
      eficiencia_esperada: Number(datos.eficiencia_esperada || 80),
      umbral_cumplimiento: Number(datos.umbral_cumplimiento || 85),
      orden_visual: Number(datos.orden_visual || 1),
    }),
  });

  const [estado, setEstado] = useState([]);
  const [selected, setSelected] = useState(null);

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

  const totals = useMemo(() => {
    const suma = (campo) => modulos.reduce((total, modulo) => total + Number(modulo[campo] || 0), 0);

    const producido = suma("unidades_producidas");
    const capacidad = suma("capacidad_operarios");
    const minutosDisponibles = modulos.reduce(
      (total, modulo) =>
        total + Number(modulo.promedio_personas || 0) * 60 * Number(modulo.horas_registradas || 0),
      0,
    );

    return {
      modulos: modulos.length,
      capacidad,
      operariosAsignados: Math.round(suma("promedio_personas")),
      producido,
      eficiencia:
        modulos.length > 0
          ? Number(
              (
                modulos.reduce((total, modulo) => total + Number(modulo.eficiencia || 0), 0) /
                modulos.length
              ).toFixed(1),
            )
          : 0,
      minutosDisponibles,
      cumplimiento: porcentaje(producido, suma("meta_dia") || producido),
    };
  }, [modulos]);

  return {
    ...crud,
    modulos,
    lista,
    ubicaciones,
    selected,
    setSelected,
    totals,
  };
}
