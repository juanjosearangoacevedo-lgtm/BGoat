import { Filter } from "lucide-react";
import { Card } from "@/shared/components/card";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import { periodOptions } from "../hooks/usePanelReportes";

function FilterSelect({ label, value, onChange, options = [], allLabel }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allLabel && <SelectItem value="all">{allLabel}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Filtros por periodo y modulo, con los nombres de columna reales. */
export function PanelFiltros({
  filters,
  moduloOptions = [],
  onPeriod,
  onModulo,
  onFechaInicio,
  onFechaFin,
}) {
  const esPersonalizado = filters.period === "personalizado";

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Filter className="mt-8 h-5 w-5 flex-shrink-0 text-gray-500" />
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="Periodo" value={filters.period} onChange={onPeriod} options={periodOptions} />
          <FilterSelect
            label="Modulo"
            value={filters.idModulo}
            onChange={onModulo}
            options={moduloOptions}
            allLabel="Todos"
          />

          {esPersonalizado && (
            <>
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={filters.fechaInicio}
                  onChange={(evento) => onFechaInicio?.(evento.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={filters.fechaFin}
                  onChange={(evento) => onFechaFin?.(evento.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
