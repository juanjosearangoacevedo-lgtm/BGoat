import { RegisterFormPanel } from "../components/RegisterFormPanel";
import { RegisterSidePanel } from "../components/RegisterSidePanel";
import { RegisterSuccess } from "../components/RegisterSuccess";
import { useRegisterForm } from "../hooks/useRegisterForm";

export function RegisterPage({ onNavigate }) {
  const register = useRegisterForm();

  if (register.step === "success") {
    return <RegisterSuccess email={register.form.email} onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <RegisterFormPanel
        errors={register.errors}
        form={register.form}
        onNavigate={onNavigate}
        onSubmit={register.handleSubmit}
        setField={register.setField}
        setShowConfirm={register.setShowConfirm}
        setShowPassword={register.setShowPassword}
        showConfirm={register.showConfirm}
        showPassword={register.showPassword}
      />
      <RegisterSidePanel />
    </div>
  );
}
