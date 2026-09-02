import { Card } from "@/shared/components/card";

export function OrdenFormSection({ title, children, columns = "md:grid-cols-2" }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-bold text-gray-900">{title}</h2>
      <div className={`grid gap-4 ${columns}`}>{children}</div>
    </Card>
  );
}
