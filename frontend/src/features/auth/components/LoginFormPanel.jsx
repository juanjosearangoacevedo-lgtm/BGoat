import { Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/shared/components/checkbox";
import { AuthBrand } from "./AuthBrand";

export function LoginFormPanel({
  dark,
  email,
  password,
  showPassword,
  error,
  cargando,
  theme,
  onEmailChange,
  onNavigate,
  onPasswordChange,
  onSubmit,
  onTogglePassword,
}) {
  const inputStyle = {
    height: 48,
    width: "100%",
    padding: "0 0.875rem",
    borderRadius: 8,
    border: `1px solid ${theme.inputBorder}`,
    background: theme.inputBg,
    color: theme.inputText,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.3s ease",
  };

  const handleFocus = (event) => {
    event.currentTarget.style.borderColor = dark ? "#7D5BFF" : "#433A9B";
    event.currentTarget.style.boxShadow = theme.focusShadow;
  };

  const handleBlur = (event) => {
    event.currentTarget.style.borderColor = theme.inputBorder;
    event.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="flex items-center justify-center p-8" style={{ background: theme.leftBg, transition: "background 0.3s ease" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: theme.cardBg,
          borderRadius: dark ? 16 : 0,
          padding: dark ? "2.5rem" : 0,
          transition: "background 0.3s ease",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <AuthBrand logo="image" textColor="" />
          </div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: 700, color: theme.title, marginBottom: 8 }}>
            Bienvenido de nuevo
          </h1>
          <p style={{ color: theme.body }}>Ingresa tus credenciales para acceder al sistema</p>
        </div>

        <form
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: theme.label }}>Correo electronico</label>
            <input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              required
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 500, color: theme.label }}>Contrasena</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                required
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <button
                type="button"
                onClick={onTogglePassword}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: theme.body,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff style={{ width: 20, height: 20 }} /> : <Eye style={{ width: 20, height: 20 }} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Checkbox id="remember" />
              <label htmlFor="remember" style={{ fontSize: 14, color: theme.label, cursor: "pointer" }}>Recordarme</label>
            </div>
            <button type="button" onClick={() => onNavigate("recover-password")} style={{ fontSize: 14, fontWeight: 500, color: theme.link, background: "transparent", border: "none", cursor: "pointer" }}>
              Olvidaste tu contrasena?
            </button>
          </div>

          {error && (
            <p
              role="alert"
              style={{
                margin: 0,
                borderRadius: 8,
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
                color: "#dc2626",
                fontSize: 13,
                padding: "10px 12px",
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            style={{
              height: 48,
              width: "100%",
              borderRadius: 8,
              background: theme.btnBg,
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              border: "none",
              cursor: cargando ? "wait" : "pointer",
              opacity: cargando ? 0.7 : 1,
            }}
          >
            {cargando ? "Ingresando..." : "Iniciar Sesion"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${theme.divider}` }}>
          <p style={{ fontSize: 12, textAlign: "center", color: theme.small }}>
            Al iniciar sesion, aceptas nuestros Terminos de Servicio y Politica de Privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
