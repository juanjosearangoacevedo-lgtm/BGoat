/**
 * Encabezado de pagina del panel.
 * En pantallas angostas el titulo y las acciones se apilan en lugar de
 * comprimirse, que era lo que rompia la barra de busqueda en tablet.
 */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500 md:text-base">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
