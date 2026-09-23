import { useMemo, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Checkbox } from "@/shared/components/checkbox";
import { EmptyState } from "@/shared/components/EmptyState";
import { SearchInput } from "@/shared/components/SearchInput";

/**
 * Selector de permisos del formulario de rol.
 *
 * Presenta el catalogo de la tabla `permisos` agrupado por modulo, que es
 * como el usuario piensa el problema ("que puede hacer este rol en Ordenes"),
 * y no como una lista plana de 60 casillas. Cada modulo tiene su casilla de
 * "todos" y el contador muestra cuanto lleva marcado.
 */
function CasillaPermiso({ permiso, marcado, onToggle, disabled }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors ${
        marcado ? "bg-[#0F4C3F]/5" : "hover:bg-gray-50"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <Checkbox
        checked={marcado}
        disabled={disabled}
        onCheckedChange={() => onToggle(permiso.id_permiso)}
        aria-label={`${permiso.modulo} ${permiso.etiqueta}`}
      />
      <span className={`text-sm ${marcado ? "font-medium text-gray-900" : "text-gray-600"}`}>
        {permiso.etiqueta}
      </span>
    </label>
  );
}

function GrupoModulo({ grupo, seleccionados, onTogglePermiso, onToggleModulo, disabled }) {
  const marcados = grupo.permisos.filter((permiso) => seleccionados.has(permiso.id_permiso)).length;
  const todos = marcados === grupo.permisos.length && marcados > 0;

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-3">
      <header className="mb-2 flex items-center justify-between gap-3 border-b border-gray-50 pb-2">
        <label className="flex cursor-pointer items-center gap-2">
          <Checkbox
            checked={todos ? true : marcados > 0 ? "indeterminate" : false}
            disabled={disabled}
            onCheckedChange={() => onToggleModulo(grupo.modulo)}
            aria-label={`Todos los permisos de ${grupo.modulo}`}
          />
          <span className="text-sm font-semibold text-gray-800">{grupo.modulo}</span>
        </label>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            marcados > 0 ? "bg-[#0F4C3F]/10 text-[#0F4C3F]" : "bg-gray-100 text-gray-400"
          }`}
        >
          {marcados}/{grupo.permisos.length}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {grupo.permisos.map((permiso) => (
          <CasillaPermiso
            key={permiso.id_permiso}
            permiso={permiso}
            marcado={seleccionados.has(permiso.id_permiso)}
            onToggle={onTogglePermiso}
            disabled={disabled}
          />
        ))}
      </div>
    </section>
  );
}

export function RolPermisosSelector({
  grupos = [],
  total = 0,
  seleccionados = new Set(),
  cargando = false,
  error = null,
  onTogglePermiso,
  onToggleModulo,
  onToggleTodos,
}) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return grupos;

    return grupos
      .map((grupo) => {
        if (grupo.modulo.toLowerCase().includes(termino)) return grupo;
        const permisos = grupo.permisos.filter((permiso) =>
          `${permiso.etiqueta} ${permiso.accion}`.toLowerCase().includes(termino),
        );
        return permisos.length > 0 ? { ...grupo, permisos } : null;
      })
      .filter(Boolean);
  }, [grupos, busqueda]);

  const marcados = seleccionados.size;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#0F4C3F]" />
          <span className="text-sm font-semibold text-gray-800">Permisos del rol</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              marcados > 0 ? "bg-[#0F4C3F] text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {marcados} de {total}
          </span>
        </div>

        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Filtrar permisos..."
          className="ml-auto w-full sm:w-52"
          alto="h-8"
        />

        <button
          type="button"
          onClick={onToggleTodos}
          disabled={cargando || total === 0}
          className="h-8 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:border-[#0F4C3F] hover:text-[#0F4C3F] disabled:opacity-40"
        >
          {marcados === total && total > 0 ? "Desmarcar todo" : "Marcar todo"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          No se pudo cargar el catalogo de permisos: {error}
        </p>
      )}

      {cargando ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, indice) => (
            <div key={indice} className="animate-pulse rounded-xl border border-gray-100 bg-white p-3">
              <div className="mb-3 h-3 w-32 rounded-full bg-gray-100" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }, (_, columna) => (
                  <div key={columna} className="h-6 rounded-lg bg-gray-50" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <EmptyState
          compacto
          icon={Lock}
          title={busqueda ? "Ningun permiso coincide" : "No hay permisos configurados"}
          description={
            busqueda
              ? "Prueba con otro texto o limpia el filtro."
              : "El catalogo de la tabla permisos esta vacio."
          }
        />
      ) : (
        <div className="scroll-suave max-h-72 space-y-2 overflow-y-auto pr-1">
          {filtrados.map((grupo) => (
            <GrupoModulo
              key={grupo.modulo}
              grupo={grupo}
              seleccionados={seleccionados}
              onTogglePermiso={onTogglePermiso}
              onToggleModulo={onToggleModulo}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        Los usuarios con este rol deberan volver a iniciar sesion para que los cambios tomen efecto.
      </p>
    </div>
  );
}
