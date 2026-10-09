import { Eye, EyeOff } from "lucide-react";
import { AuthBrand } from "./AuthBrand";
import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import { documentTypes } from "../hooks/useRegisterForm";

/** Formulario de registro con los campos de la tabla `usuarios`. */
export function RegisterFormPanel({
  errors,
  form,
  onNavigate,
  onSubmit,
  setField,
  setShowConfirm,
  setShowPassword,
  showConfirm,
  showPassword,
}) {
  return (
    <div className="flex items-center justify-center overflow-y-auto bg-white p-8">
      <div className="w-full max-w-md py-8">
        <div className="mb-8">
          <div className="mb-6">
            <AuthBrand />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-600">Completa la información para registrarte en el sistema</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input
                id="nombres"
                placeholder="Juan José"
                value={form.nombres}
                onChange={setField("nombres")}
                className={`h-12 ${errors.nombres ? "border-red-400" : ""}`}
              />
              {errors.nombres && <p className="text-xs text-red-500">{errors.nombres}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input
                id="apellidos"
                placeholder="Arango Acevedo"
                value={form.apellidos}
                onChange={setField("apellidos")}
                className={`h-12 ${errors.apellidos ? "border-red-400" : ""}`}
              />
              {errors.apellidos && <p className="text-xs text-red-500">{errors.apellidos}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_documento">Tipo</Label>
              <select
                id="tipo_documento"
                value={form.tipo_documento}
                onChange={setField("tipo_documento")}
                className="h-12 w-full rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-marca/30"
              >
                {documentTypes.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="numero_documento">Número de documento</Label>
              <Input
                id="numero_documento"
                placeholder="1017925610"
                value={form.numero_documento}
                onChange={setField("numero_documento")}
                className={`h-12 ${errors.numero_documento ? "border-red-400" : ""}`}
              />
              {errors.numero_documento && (
                <p className="text-xs text-red-500">{errors.numero_documento}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">Correo electrónico</Label>
            <Input
              id="correo"
              type="email"
              placeholder="usuario@empresa.com"
              value={form.correo}
              onChange={setField("correo")}
              className={`h-12 ${errors.correo ? "border-red-400" : ""}`}
            />
            {errors.correo && <p className="text-xs text-red-500">{errors.correo}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              placeholder="300 000 0000"
              value={form.telefono}
              onChange={setField("telefono")}
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clave">Contraseña</Label>
            <div className="relative">
              <Input
                id="clave"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 8 caracteres"
                value={form.clave}
                onChange={setField("clave")}
                className={`h-12 pr-10 ${errors.clave ? "border-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.clave && <p className="text-xs text-red-500">{errors.clave}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmar_clave">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirmar_clave"
                type={showConfirm ? "text" : "password"}
                placeholder="Repite tu contraseña"
                value={form.confirmar_clave}
                onChange={setField("confirmar_clave")}
                className={`h-12 pr-10 ${errors.confirmar_clave ? "border-red-400" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmar_clave && <p className="text-xs text-red-500">{errors.confirmar_clave}</p>}
          </div>

          <p className="text-xs text-gray-500">
            El rol de acceso lo asigna un administrador desde el módulo Usuarios.
          </p>

          <Button type="submit" className="h-12 w-full bg-dorado text-white hover:bg-dorado-hover">
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-gray-600">
            Ya tienes una cuenta?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="font-medium text-marca-letra hover:text-marca-letra/80"
            >
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
