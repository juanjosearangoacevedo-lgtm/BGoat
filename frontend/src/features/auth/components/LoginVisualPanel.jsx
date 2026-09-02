import { Factory } from "lucide-react";
import { authLogo, loginHighlights } from "../services/authContent";

export function LoginVisualPanel({ overlay }) {
  return (
    <div className="hidden md:flex" style={{ position: "relative", overflow: "hidden", alignItems: "center", justifyContent: "center", padding: "3rem" }}>
      <img
        src={authLogo}
        alt=""
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(26px)", transform: "scale(1.12)", pointerEvents: "none", userSelect: "none" }}
      />
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: overlay, pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 10, color: "#ffffff", maxWidth: "28rem" }}>
        <Factory style={{ width: 80, height: 80, marginBottom: "1.5rem", color: "#F97316" }} />
        <h2 style={{ fontSize: "2.25rem", fontWeight: 700, marginBottom: "1rem", lineHeight: 1.2 }}>
          Sistema de Gestion de Produccion Textil
        </h2>
        <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.9)", marginBottom: "2rem" }}>
          Controla tu produccion en tiempo real, optimiza recursos y maximiza tu eficiencia
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loginHighlights.map(({ Icon, title, desc }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, background: "#F97316", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
