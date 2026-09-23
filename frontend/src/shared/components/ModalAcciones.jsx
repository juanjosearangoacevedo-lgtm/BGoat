import { Check } from "lucide-react";
import { Button } from "@/shared/components/button";

/**
 * El pie de un formulario en modal: cancelar y guardar.
 *
 * Los cinco formularios del panel --cliente, lote, modulo, rol y
 * usuario-- repetian estos dos botones palabra por palabra, con el mismo
 * color, el mismo `disabled` y el mismo "Guardando...". Lo unico que
 * cambiaba entre ellos era la palabra final: "Crear cliente", "Crear
 * lote", "Crear modulo".
 *
 * `entidad` es esa palabra. Si un formulario necesita otro texto, pasa
 * `etiquetaGuardar`; si necesita bloquear el guardado por una razon
 * propia --el de rol espera a que carguen los permisos-- pasa
 * `deshabilitarGuardar`.
 */
export function ModalAcciones({
  editing,
  guardando,
  entidad,
  onClose,
  onSave,
  etiquetaGuardar,
  deshabilitarGuardar = false,
}) {
  const etiqueta =
    etiquetaGuardar ?? (editing ? "Guardar cambios" : `Crear ${entidad}`);

  return (
    <>
      <Button variant="outline" className="flex-1" onClick={onClose} disabled={guardando}>
        Cancelar
      </Button>
      <Button
        className="flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14]"
        onClick={onSave}
        disabled={guardando || deshabilitarGuardar}
      >
        <Check className="mr-2 h-4 w-4" />
        {guardando ? "Guardando..." : etiqueta}
      </Button>
    </>
  );
}
