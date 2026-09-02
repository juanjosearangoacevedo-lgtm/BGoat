import { RecoverPasswordCard } from "../components/RecoverPasswordCard";
import { useRecoverPasswordForm } from "../hooks/useRecoverPasswordForm";

export function RecoverPasswordPage({ onNavigate }) {
  const recover = useRecoverPasswordForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#433A9B]/5 via-white to-[#F39A3D]/5 p-8">
      <RecoverPasswordCard
        email={recover.email}
        error={recover.error}
        onEmailChange={recover.handleEmailChange}
        onNavigate={onNavigate}
        onSubmit={recover.handleSubmit}
        sent={recover.sent}
      />
    </div>
  );
}
