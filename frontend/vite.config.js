import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// El proyecto es ESM ("type": "module"), asi que __dirname no existe.
const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Alias @ hacia la carpeta src
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    // Respeta el puerto que asigne el entorno; por defecto el 5173 de Vite.
    port: Number(process.env.PORT) || 5173,
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});
