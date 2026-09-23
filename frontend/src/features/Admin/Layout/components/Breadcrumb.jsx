import { findAdminPageLabel } from "../services/adminMenu";

/** Ruta actual dentro del panel. En pantallas angostas solo queda la pagina. */
export function Breadcrumb({ currentPage }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm text-gray-500">
      <span className="hidden sm:inline">Admin</span>
      <span className="hidden sm:inline">/</span>
      <span className="truncate font-medium text-[#0F4C3F]">{findAdminPageLabel(currentPage)}</span>
    </div>
  );
}
