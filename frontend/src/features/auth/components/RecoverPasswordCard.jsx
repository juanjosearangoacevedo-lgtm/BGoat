import { AuthBrand } from "./AuthBrand";
import { RecoverPasswordForm } from "./RecoverPasswordForm";
import { RecoverPasswordSent } from "./RecoverPasswordSent";

export function RecoverPasswordCard({
  email,
  error,
  onEmailChange,
  onNavigate,
  onSubmit,
  sent,
}) {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-10">
        <div className="mb-8">
          <AuthBrand />
        </div>
        {!sent ? (
          <RecoverPasswordForm
            email={email}
            error={error}
            onEmailChange={onEmailChange}
            onNavigate={onNavigate}
            onSubmit={onSubmit}
          />
        ) : (
          <RecoverPasswordSent email={email} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
