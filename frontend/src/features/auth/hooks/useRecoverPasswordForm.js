import { useState } from "react";
import { validarFormulario } from "@/shared/validations";
import { recuperarEsquema } from "../validations/authValidation";

/** Recuperacion de contrasena -> POST /auth/recuperar. */
export function useRecoverPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const errores = validarFormulario({ correo: email }, recuperarEsquema);
    if (errores.correo) {
      setError(errores.correo);
      return;
    }

    setSent(true);
  };

  return {
    email,
    error,
    handleEmailChange,
    handleSubmit,
    sent,
  };
}
