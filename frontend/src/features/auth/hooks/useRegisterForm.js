import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { validarFormulario } from "@/shared/validations";
import { authTiposDocumento, registroEsquema } from "../validations/authValidation";

/**
 * Registro de usuario -> tabla `usuarios`.
 *
 * Los campos son los de la tabla. `clave` viaja en claro y el backend guarda
 * el hash en `clave_hash`. `id_rol` NO se elige aqui: el backend crea la
 * cuenta INACTIVA con el rol base y un administrador la activa desde el
 * modulo Usuarios (regla de seguridad del alcance).
 */
export const documentTypes = authTiposDocumento;

const initialForm = {
  nombres: "",
  apellidos: "",
  tipo_documento: "CC",
  numero_documento: "",
  correo: "",
  telefono: "",
  clave: "",
  confirmar_clave: "",
};

export function useRegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState("form");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [enviando, setEnviando] = useState(false);

  const setField = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /** Cuerpo del POST /auth/registro (sin la confirmacion, que no es columna). */
  const buildPayload = () => ({
    nombres: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    tipo_documento: form.tipo_documento,
    numero_documento: form.numero_documento.trim(),
    correo: form.correo.trim().toLowerCase(),
    telefono: form.telefono.trim() || null,
    clave: form.clave,
  });

  const validar = () => {
    const encontrados = validarFormulario(form, registroEsquema);
    setErrors(encontrados);
    return Object.keys(encontrados).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validar()) {
      toast.error("Revisa los campos marcados antes de continuar");
      return;
    }

    setEnviando(true);
    try {
      await apiClient.post(endpoints.registro, buildPayload());
      setStep("success");
    } catch (problema) {
      // El backend responde 409 cuando el correo o el documento ya existen.
      if (problema.status === 409) setErrors({ correo: problema.message });
      toast.error(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  return {
    errors,
    form,
    enviando,
    handleSubmit,
    buildPayload,
    setField,
    setShowConfirm,
    setShowPassword,
    showConfirm,
    showPassword,
    step,
  };
}
