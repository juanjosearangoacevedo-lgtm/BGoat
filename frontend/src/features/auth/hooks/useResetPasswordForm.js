import { useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { validarFormulario } from "@/shared/validations";
import { restablecerEsquema } from "../validations/authValidation";

/**
 * Nueva contrasena -> POST /auth/restablecer.
 *
 * Se llega desde el enlace del correo de recuperacion
 * (`/?restablecer=<token>`). El token vale una sola vez y vence en una
 * hora; si ya no sirve, el backend lo dice y la pantalla ofrece pedir otro.
 */
export function useResetPasswordForm(token) {
  const [form, setForm] = useState({ clave: "", confirmar_clave: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const setCampo = (campo, valor) => {
    setForm((previo) => ({ ...previo, [campo]: valor }));
    setErrores((previo) => ({ ...previo, [campo]: undefined }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const encontrados = validarFormulario(form, restablecerEsquema);
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      return;
    }

    setEnviando(true);
    try {
      await apiClient.post(endpoints.restablecerClave, { token, clave: form.clave });
      setListo(true);
    } catch (problema) {
      setError(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  return { form, errores, error, listo, enviando, setCampo, handleSubmit, sinToken: !token };
}
