import { useState } from "react";
import { apiClient } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";
import { validarFormulario } from "@/shared/validations";
import { recuperarEsquema } from "../validations/authValidation";

/**
 * Recuperacion de contrasena -> POST /auth/recuperar.
 *
 * Antes esta pantalla no llamaba a nada: validaba el correo y ponia
 * `sent = true`, asi que decia "te enviamos las instrucciones" sin haber
 * enviado nada. El endpoint existia y funcionaba; lo que faltaba era la
 * llamada.
 *
 * El backend responde lo mismo exista o no la cuenta --a proposito, para
 * no filtrar quien esta registrado-- asi que la pantalla tampoco puede
 * distinguirlo, y por eso el mensaje de exito habla en condicional.
 */
export function useRecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errores = validarFormulario({ correo: email }, recuperarEsquema);
    if (errores.correo) {
      setError(errores.correo);
      return;
    }

    setEnviando(true);
    try {
      await apiClient.post(endpoints.recuperarClave, { correo: email.trim().toLowerCase() });
      setSent(true);
    } catch (problema) {
      setError(problema.message);
    } finally {
      setEnviando(false);
    }
  };

  return {
    email,
    error,
    enviando,
    handleEmailChange,
    handleSubmit,
    sent,
  };
}
