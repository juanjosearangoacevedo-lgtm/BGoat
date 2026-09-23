import { Factory, Package } from "lucide-react";

export const authLogo = "/image.png";

/** Marca del login: el sistema entra por la puerta de God's Eyes S.A.S. */
export const authMarca = "GOD'S EYES S.A.S";

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
  { color: "#D08E10", text: "Monitoreo de produccion en tiempo real" },
  { color: "#E3A81B", text: "Reportes analiticos y exportacion de datos" },
  { color: "#D08E10", text: "Gestion completa de ordenes y operarios" },
];
