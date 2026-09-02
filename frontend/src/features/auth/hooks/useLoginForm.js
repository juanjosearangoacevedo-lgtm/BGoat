import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/shared/contexts/AuthContext";
import { validarFormulario } from "@/shared/validations";
import { loginEsquema } from "../validations/authValidation";

/** Login contra /auth/login. El backend valida, registra el acceso y firma el token. */
export function useLoginForm(onNavigate) {
  const { iniciarSesion } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    // Se valida el formato antes de gastar un intento: el backend bloquea la
    // cuenta a los 5 fallidos y un correo mal escrito no deberia contar.
    const encontrados = validarFormulario({ correo: email, clave: password }, loginEsquema);
    setErrors(encontrados);

    if (Object.keys(encontrados).length > 0) {
      setError(encontrados.correo || encontrados.clave);
      return;
    }

    setCargando(true);
    setError("");
    try {
      const usuario = await iniciarSesion(email.trim(), password);
      toast.success(`Bienvenido, ${usuario.nombres}`);
      onNavigate?.("dashboard");
    } catch (problema) {
      setError(problema.message);
    } finally {
      setCargando(false);
    }
  };

  return {
    email,
    password,
    showPassword,
    error,
    errors,
    cargando,
    setEmail,
    setPassword,
    setShowPassword,
    handleLogin,
  };
}
