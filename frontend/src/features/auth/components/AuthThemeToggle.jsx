import { Moon, Sun } from "lucide-react";

export function AuthThemeToggle({
  dark,
  onToggle,
  color,
}) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className="absolute right-4 top-4 z-50 flex items-center justify-center rounded-xl bg-transparent p-2.5 transition-colors"
      style={{ color }}
      type="button"
    >
      {dark ? <Sun size={22} /> : <Moon size={22} />}
    </button>
  );
}
