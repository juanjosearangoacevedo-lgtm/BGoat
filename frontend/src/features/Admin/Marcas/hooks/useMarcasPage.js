import { useMemo } from "react";
import { useCrudResource } from "@/shared/hooks/useCrudResource";
import { useListaAdmin } from "@/shared/hooks/useListaAdmin";
import { endpoints } from "@/shared/services/endpoints";
import { crearMarcaEsquema, marcaEstados } from "../validations/marcaValidation";

/**
 * Modulo Marcas -> tabla `marcas`.
 * La tabla solo tiene nombre, descripcion, estado y fecha_creacion.
 */
export const marcaStatusOptions = marcaEstados.map((estado) => ({
  value: estado,
  label: estado === "ACTIVO" ? "Activo" : "Inactivo",
}));

export const emptyMarcaForm = {
  nombre: "",
  descripcion: "",
  estado: "ACTIVO",
};

export function useMarcasPage() {
  const crud = useCrudResource({
    recurso: endpoints.marcas,
    idField: "id_marca",
    emptyForm: emptyMarcaForm,
    nombreRegistro: (marca) => (marca?.nombre ? `la marca ${marca.nombre}` : "la marca"),
    esquema: ({ items, editing }) => crearMarcaEsquema({ lista: items, editing }),
  });

  const definicionesFiltro = useMemo(
    () => [
      {
        clave: "estado",
        label: "Estado",
        etiquetaTodos: "Todos los estados",
        opciones: marcaStatusOptions,
      },
      {
        clave: "descripcion",
        label: "Descripcion",
        etiquetaTodos: "Con y sin descripcion",
        opciones: [
          { value: "si", label: "Con descripcion" },
          { value: "no", label: "Sin descripcion" },
        ],
        comparar: (fila, valor) => (valor === "si" ? Boolean(fila.descripcion) : !fila.descripcion),
      },
    ],
    [],
  );

  const lista = useListaAdmin(crud.items, {
    filtros: definicionesFiltro,
    ordenInicial: { campo: "nombre", direccion: "asc" },
    pageSize: 12,
    extraReset: [crud.search],
  });

  const resumen = useMemo(() => {
    const activas = crud.items.filter(
      (marca) => String(marca.estado || "").toUpperCase() === "ACTIVO",
    ).length;

    return {
      total: crud.items.length,
      activas,
      inactivas: crud.items.length - activas,
      documentadas: crud.items.filter((marca) => Boolean(marca.descripcion)).length,
    };
  }, [crud.items]);

  return { ...crud, lista, resumen };
}
