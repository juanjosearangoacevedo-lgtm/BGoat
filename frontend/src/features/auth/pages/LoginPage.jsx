import { useDarkMode } from "@/shared/contexts/DarkModeContext";
import { AuthThemeToggle } from "../components/AuthThemeToggle";
import { LoginFormPanel } from "../components/LoginFormPanel";
import { LoginVisualPanel } from "../components/LoginVisualPanel";
import { useLoginForm } from "../hooks/useLoginForm";

const loginThemes = {
  dark: {
    pageBg: "#0F0B1E",
    leftBg: "#1A1530",
    cardBg: "#231D3A",
    inputBg: "#2C2448",
    inputBorder: "#5A4FCF",
    inputText: "#E8E0FF",
    label: "#C4B8F0",
    body: "#C4B8F0",
    title: "#F0EAFF",
    link: "#A78BFA",
    btnBg: "#6C47FF",
    divider: "#2C2448",
    small: "#7A6FAA",
    toggle: "#A78BFA",
    overlay: "rgba(10,7,30,0.72)",
    focusShadow: "0 0 0 3px rgba(108,71,255,0.25)",
  },
  light: {
    pageBg: "#ffffff",
    leftBg: "#ffffff",
    cardBg: "transparent",
    inputBg: "#f9fafb",
    inputBorder: "#e5e7eb",
    inputText: "#111827",
    label: "#374151",
    body: "#6b7280",
    title: "#111827",
    link: "#433A9B",
    btnBg: "#433A9B",
    divider: "#e5e7eb",
    small: "#9ca3af",
    toggle: "#433A9B",
    overlay: "rgba(30,20,80,0.55)",
    focusShadow: "0 0 0 3px rgba(67,58,155,0.15)",
  },
};

export function LoginPage({ onNavigate }) {
  const { dark, toggleDark } = useDarkMode();
  const theme = dark ? loginThemes.dark : loginThemes.light;
  const login = useLoginForm(onNavigate);

  return (
    <div style={{ minHeight: "100vh", background: theme.pageBg, position: "relative" }}>
      <AuthThemeToggle dark={dark} onToggle={toggleDark} color={theme.toggle} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
        <LoginFormPanel
          dark={dark}
          email={login.email}
          password={login.password}
          showPassword={login.showPassword}
          error={login.error}
          cargando={login.cargando}
          theme={theme}
          onEmailChange={login.setEmail}
          onNavigate={onNavigate}
          onPasswordChange={login.setPassword}
          onSubmit={login.handleLogin}
          onTogglePassword={() => login.setShowPassword((value) => !value)}
        />
        <LoginVisualPanel overlay={theme.overlay} />
      </div>
    </div>
  );
}
