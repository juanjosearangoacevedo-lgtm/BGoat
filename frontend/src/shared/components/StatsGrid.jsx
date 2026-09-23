// Tailwind solo conserva las clases que puede ver escritas completas, asi que
// el numero de columnas mapea a una clase fija en lugar de interpolarse.
const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5",
};

export function StatsGrid({ items = [], columns = 4 }) {
  return (
    <div className={`mb-6 grid gap-4 ${columnClasses[columns] || columnClasses[4]}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold" style={{ color: item.color || "#0F4C3F" }}>
            {item.value}
          </div>
          <div className="mt-1 text-sm text-gray-500">{item.label}</div>
          {item.hint && <div className="mt-1 text-xs text-gray-400">{item.hint}</div>}
        </div>
      ))}
    </div>
  );
}
