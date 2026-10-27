import { Ruler } from "lucide-react";
import { CrudPage } from "@/shared/components/CrudPage";
import { endpoints } from "@/shared/services/endpoints";
import { crearTallaEsquema } from "../validations/tallaValidation";

/**
 * Catalogo de tallas -> tabla `tallas`.
 *
 * Vive aqui y no dentro del formulario del lote porque antes no habia
 * forma de agregar una talla nueva sin tocar la base a mano: la unica
 * pantalla que las usaba (el desglose del lote) solo podia escoger entre
 * las que ya existian.
 *
 * El orden en que salen (en esta lista y en el desglose) no se digita: el
 * backend lo saca del nombre, ver `backend/src/lib/tallas.js`.
 */
export function TallasPage() {
  return (
    <CrudPage
      titulo="Tallas"
      entidad="talla"
      subtitulo="El catálogo que usa el desglose de cada lote"
      recurso={endpoints.tallas}
      idField="id_talla"
      etiquetaNuevo="Nueva talla"
      busquedaPlaceholder="Buscar por nombre..."
      nombreRegistro={(fila) => (fila?.nombre ? `la talla ${fila.nombre}` : "la talla")}
      emptyIcon={Ruler}
      emptyTitle="No hay tallas configuradas"
      emptyDescription="Sin tallas, el desglose del lote no tiene de donde escoger."
      filtrosLista={[
        {
          clave: "estado",
          label: "Estado",
          etiquetaTodos: "Todos los estados",
          opciones: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
          ],
        },
      ]}
      columnas={[
        { key: "nombre", header: "Talla" },
        { key: "estado", header: "Estado", tipo: "estado" },
      ]}
      emptyForm={{ nombre: "", estado: "ACTIVO" }}
      required={["nombre"]}
      esquema={({ items, editing }) => crearTallaEsquema({ lista: items, editing })}
      campos={[
        {
          name: "nombre",
          label: "Talla",
          placeholder: "XL, 32, 2T...",
          required: true,
          maxLength: 20,
          hint: "Adulto (XS-5XL), numérica (26-42) o infantil (1T-5T, 2-14): la que haga falta.",
        },
        {
          name: "estado",
          label: "Estado",
          options: [
            { value: "ACTIVO", label: "Activo" },
            { value: "INACTIVO", label: "Inactivo" },
          ],
        },
      ]}
    />
  );
}
