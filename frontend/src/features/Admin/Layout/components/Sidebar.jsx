import { ChevronDown, ChevronRight, LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

/**
 * Menu lateral del panel.
 *
 * Tiene tres formas segun el espacio disponible: expandido, contraido a solo
 * iconos (el contenido principal gana ancho) y flotante sobre el contenido en
 * pantallas pequenas. El estado lo maneja `useAdminSidebar` desde el layout,
 * para que el `<main>` sepa a que ancho ajustarse.
 */
export function Sidebar({ sidebar }) {
  const {
    menuItems,
    currentPage,
    handleLogout,
    isExpanded,
    isItemActive,
    handleItemClick,
    handleChildClick,
    colapsado,
    alternarColapso,
    movilAbierto,
    cerrarMovil,
  } = sidebar;

  return (
    <>
      {/* Capa que oscurece el contenido cuando el menu flota en movil. */}
      <div
        onClick={cerrarMovil}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          movilAbierto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col bg-gradient-to-b from-[#0F4C3F] to-[#0A3A2F] text-white shadow-2xl transition-all duration-300 ease-in-out ${
          colapsado ? "w-20" : "w-64"
        } ${movilAbierto ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Contraido no caben la marca y el boton en la misma fila: se apilan,
            si no el boton de expandir queda fuera del ancho y no hay forma de
            volver a abrir el menu. */}
        <div
          className={`flex flex-shrink-0 border-b border-white/10 p-4 ${
            colapsado ? "flex-col items-center gap-2" : "items-center gap-2"
          }`}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-sm font-black tracking-tight">
            GE
          </div>

          {!colapsado && (
            <div className="min-w-0 flex-1 overflow-hidden">
              <h1 className="truncate text-base font-bold tracking-tight">GOD&apos;S EYES SAS</h1>
              <p className="truncate text-xs text-white/70">Sistema de Gestion</p>
            </div>
          )}

          <button
            onClick={cerrarMovil}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            type="button"
            aria-label="Cerrar menu"
          >
            <X className="h-4 w-4" />
          </button>

          <button
            onClick={alternarColapso}
            className="hidden rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:block"
            type="button"
            title={colapsado ? "Expandir menu" : "Contraer menu"}
            aria-label={colapsado ? "Expandir menu" : "Contraer menu"}
          >
            {colapsado ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="scroll-sidebar flex-1 overflow-y-auto px-2 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const expanded = isExpanded(item.label);
            const active = isItemActive(item);

            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => handleItemClick(item)}
                  title={colapsado ? item.label : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${
                    colapsado ? "justify-center" : ""
                  } ${
                    active ? "bg-[#D08E10] text-white shadow-lg" : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  type="button"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />

                  {!colapsado && (
                    <>
                      <span className="flex-1 truncate text-left text-sm font-medium">{item.label}</span>
                      {item.children &&
                        (expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                        ))}
                    </>
                  )}
                </button>

                {/* El submenu se despliega con una transicion de alto para que no salte. */}
                {item.children && !colapsado && (
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="ml-3 mt-1 space-y-0.5 border-l border-white/20 pl-3">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;

                          return (
                            <button
                              key={child.label}
                              onClick={() => handleChildClick(child.page)}
                              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                                currentPage === child.page
                                  ? "bg-[#D08E10] text-white"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                              type="button"
                            >
                              <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate text-xs font-medium">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            title={colapsado ? "Cerrar sesion" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-white/80 transition-all hover:bg-red-500/20 hover:text-red-300 ${
              colapsado ? "justify-center" : ""
            }`}
            type="button"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!colapsado && <span className="truncate text-sm font-medium">Cerrar Sesion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
