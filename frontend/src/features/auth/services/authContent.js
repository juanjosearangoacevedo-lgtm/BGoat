import { Factory, Package } from "lucide-react";

export const authLogo = "/image.png";

/** Logo oficial de BGoat (vector reconstruido): recuperar y nueva contrasena. */
export const bgoatLogo = "/bgoat-logo.svg";

/** Fondo del login: la misma planta del hero, aqui desenfocada. */
export const authFoto = "/planta-hero.webp";

/** Frases manuscritas sobre la foto. Son decoracion del prototipo. */
export const authFrases = {
  izquierda: ["Personas, procesos y moda", "en equilibrio"],
  derecha: ["Moda que", "produce futuro"],
};

export const loginHighlights = [
  {
    Icon: Package,
    title: "Gestion Completa",
    desc: "Controla ordenes, operarios y modulos desde un solo lugar",
  },
  {
    Icon: Factory,
    title: "Tiempo Real",
    desc: "Monitorea la productividad de tu planta en vivo",
  },
];

export const registerBenefits = [
  { color: "var(--dorado)", text: "Monitoreo de produccion en tiempo real" },
  { color: "var(--dorado-claro)", text: "Reportes analiticos y exportacion de datos" },
  { color: "var(--dorado)", text: "Gestion completa de ordenes y operarios" },
];
