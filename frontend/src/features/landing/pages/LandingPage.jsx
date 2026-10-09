import { LandingHeader } from "../components/LandingHeader";
import { LandingHero } from "../components/LandingHero";

export function LandingPage({ onNavigate }) {
  return (
    <div className="fuente-bgoat sin-barra flex h-dvh flex-col overflow-x-hidden overflow-y-auto bg-white">
      <LandingHeader onNavigate={onNavigate} />
      <LandingHero />
    </div>
  );
}
