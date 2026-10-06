import { RecoverPasswordCard } from "../components/RecoverPasswordCard";
import { useRecoverPasswordForm } from "../hooks/useRecoverPasswordForm";

export function RecoverPasswordPage({ onNavigate }) {
  const recover = useRecoverPasswordForm();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-marca/5 via-white to-marca/5 p-8">
      <RecoverPasswordCard
        email={recover.email}
        error={recover.error}
        enviando={recover.enviando}
        onEmailChange={recover.handleEmailChange}
        onNavigate={onNavigate}
        onSubmit={recover.handleSubmit}
        sent={recover.sent}
      />
    </div>
  );
}
