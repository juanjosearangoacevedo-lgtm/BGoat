import { useState } from "react";
import { Calculator, Package2 } from "lucide-react";
import { FormField } from "@/shared/components/FormField";
import { Label } from "@/shared/components/label";
import { Modal } from "@/shared/components/Modal";
import { ModalAcciones } from "@/shared/components/ModalAcciones";
import { formatFecha, formatMoneda, formatNumero } from "@/shared/utils/formatters";
import { CalculadoraSamModal } from "./CalculadoraSamModal";
import { DesgloseTallaColor } from "./DesgloseTallaColor";
import { FichaTecnicaLote } from "./FichaTecnicaLote";

/**
 * Formulario de la tabla `lotes`.
 *
 * Es el unico formulario del producto: aqui esta lo que antes obligaba a
 * recorrer cinco pantallas (Pedidos, Referencias, Fichas Tecnicas,
 * Prendas y el propio Lote). Va en secciones para que se lea en el orden
 * en que llega la hoja del cliente: de quien es, que es, que acordamos,
 * cuanto y para cuando.
 *
 * La ficha se puede cargar desde el primer momento: los archivos se
 * guardan en memoria y se suben apenas el lote se crea. El desglose por
 * talla y color igual: vive en memoria (`desglose`) hasta que el lote
 * existe, y se sube junto con el resto al guardar. "Cantidad recibida"
 * ya no se digita: es la suma de esas filas.
 *
 * "Valor de maquila por unidad" tampoco se digita: es el precio pactado
 * que se escribe en la calculadora del SAM, y la calculadora llena los
 * dos campos a la vez.
 *
 * "Entrega programada" tampoco se digita: se calcula cuando se crea una
 * orden de produccion para este lote (SAM + eficiencia esperada + dias
 * no laborales), asi que aqui solo se muestra de solo lectura.
 *
 * El "Codigo de lote" tampoco: lo asigna el backend al crear (el
 * consecutivo del año, `LT-2026-0001`...) y no cambia, asi que solo se
 * muestra. Lo que identifica al lote es el numero de pedido, el codigo de
 * referencia o el nombre de la referencia: hace falta al menos uno, y el
 * pedido y el codigo de referencia se escriben en MAYUSCULAS.
 */
export function LoteFormModal({
  open,
  editing,
  form,
  errors,
  guardando,
  clienteOptions = [],
  tipoPrendaOptions = [],
  tallaOptions = [],
  colorOptions = [],
  subiendoFicha = false,
  archivosPendientes,
  desglose = [],
  onCambiarDesglose,
  onSubirFicha,
  onQuitarFicha,
  onSeleccionarArchivoPendiente,
  onQuitarArchivoPendiente,
  onChange,
  onClose,
  onSave,
}) {
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
  const sumaDesglose = desglose.reduce((total, fila) => total + Number(fila.cantidad || 0), 0);

  return (
    <Modal
      open={open}
      icon={Package2}
      title={editing ? `Editar lote: ${editing.codigo_lote}` : "Nuevo lote"}
      description="Los campos marcados con * son obligatorios. Ademas hace falta al menos uno de estos tres: numero de pedido, codigo de referencia o nombre de la referencia."
      onClose={onClose}
      maxWidth="max-w-3xl"
      footer={
        <ModalAcciones
          editing={editing}
          guardando={guardando}
          entidad="lote"
          onClose={onClose}
          onSave={onSave}
        />
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-marca-letra">
            De quien viene
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Codigo de lote</Label>
              {editing ? (
                <p className="mt-1 font-mono text-sm font-medium text-marca-letra">{editing.codigo_lote}</p>
              ) : (
                <p className="mt-1 text-sm text-gray-400">Se asigna solo al guardar</p>
              )}
              <p className="text-xs text-gray-400">Es un consecutivo automatico: no se digita ni se cambia.</p>
            </div>
            <FormField
              label="Cliente"
              required
              value={form.id_cliente ?? ""}
              options={clienteOptions}
              emptyOption="Seleccionar cliente"
              error={errors.id_cliente}
              onChange={(valor) => onChange("id_cliente", valor)}
            />
            <FormField
              label="Numero de pedido"
              autoFocus
              mayusculas
              placeholder="PED-2026-000"
              value={form.numero_pedido ?? ""}
              error={errors.numero_pedido}
              hint="El folio con el que el cliente lo pidio. Se guarda en mayusculas."
              onChange={(valor) => onChange("numero_pedido", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-marca-letra">
            Que se va a confeccionar
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Codigo de referencia"
              mayusculas
              placeholder="9703"
              value={form.codigo_referencia ?? ""}
              error={errors.codigo_referencia}
              hint="El codigo que trae la hoja del cliente. Se guarda en mayusculas."
              onChange={(valor) => onChange("codigo_referencia", valor)}
            />
            <FormField
              label="Nombre de la referencia"
              placeholder="Camiseta cuello redondo"
              value={form.nombre_referencia ?? ""}
              error={errors.nombre_referencia}
              onChange={(valor) => onChange("nombre_referencia", valor)}
            />
            <FormField
              label="Tipo de prenda"
              value={form.id_tipo_prenda ?? ""}
              options={tipoPrendaOptions}
              emptyOption="Sin clasificar"
              error={errors.id_tipo_prenda}
              onChange={(valor) => onChange("id_tipo_prenda", valor)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-marca-letra">
            Acuerdo con el cliente
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Label>SAM (acuerdo con el cliente)</Label>
                <button
                  type="button"
                  onClick={() => setMostrarCalculadora(true)}
                  className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  Calcular
                </button>
              </div>
              {/* Tampoco se digita: sale del precio pactado en "Calcular"
                  (documento de German). Escribirlo a mano lo desacoplaba
                  del valor de maquila con el que se calculo. */}
              <button
                type="button"
                onClick={() => setMostrarCalculadora(true)}
                className={`flex h-10 w-full items-center rounded-lg border bg-gray-50 px-3 text-left text-sm ${
                  errors.sam_pactado ? "border-red-400" : "border-gray-200"
                }`}
              >
                {Number(form.sam_pactado) ? (
                  <span className="font-medium text-gray-900">{form.sam_pactado} min</span>
                ) : (
                  <span className="text-gray-400">Se llena con la calculadora</span>
                )}
              </button>
              <p className={`text-xs ${errors.sam_pactado ? "text-red-500" : "text-gray-400"}`}>
                {errors.sam_pactado ??
                  "Sale del precio pactado. Sin el SAM no se puede iniciar la jornada."}
              </p>
            </div>
            {/* No se digita: es el "precio pactado con el cliente" que se
                escribe en la calculadora del SAM. Al darle "Usar este SAM"
                quedan los dos llenos y no pueden quedar desincronizados. */}
            <div className="space-y-1">
              <Label>
                Valor de maquila por unidad <span className="text-red-500">*</span>
              </Label>
              <div
                className={`flex h-10 items-center rounded-lg border bg-gray-50 px-3 text-sm ${
                  errors.valor_maquila_unidad ? "border-red-400" : "border-gray-200"
                }`}
              >
                {Number(form.valor_maquila_unidad) ? (
                  <span className="font-medium text-gray-900">{formatMoneda(form.valor_maquila_unidad)}</span>
                ) : (
                  <span className="text-gray-400">Se llena con la calculadora del SAM</span>
                )}
              </div>
              <p className={`text-xs ${errors.valor_maquila_unidad ? "text-red-500" : "text-gray-400"}`}>
                {errors.valor_maquila_unidad ??
                  'Es el precio pactado con el cliente: se escribe en "Calcular", junto al SAM.'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <DesgloseTallaColor
              filas={desglose}
              tallaOptions={tallaOptions}
              colorOptions={colorOptions}
              error={errors.cantidad_programada}
              onChange={onCambiarDesglose}
            />
          </div>
          <div className="mt-4">
            <Label>Entrega programada</Label>
            <p className="mt-1 text-sm text-gray-700">
              {form.fecha_entrega_programada ? formatFecha(form.fecha_entrega_programada) : "—"}
            </p>
            <p className="text-xs text-gray-400">
              Se calcula sola cuando su orden de produccion inicia jornada (formula de German).
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-marca-letra">
            Recepcion
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Fecha de recepcion"
              type="date"
              required
              value={form.fecha_recepcion ?? ""}
              error={errors.fecha_recepcion}
              hint="Cuando llego la mercancia a la planta -- no cuando se empieza a producir."
              onChange={(valor) => onChange("fecha_recepcion", valor)}
            />
            {/* No se digita: lo que llego es exactamente lo que se desgloso
                por talla y color, asi que es la suma de esas filas. */}
            <div className="space-y-1">
              <Label>Cantidad recibida</Label>
              <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm">
                <span className="font-medium text-gray-900">
                  {formatNumero(sumaDesglose)} {sumaDesglose === 1 ? "prenda" : "prendas"}
                </span>
              </div>
              <p className="text-xs text-gray-400">La suma del desglose por talla y color.</p>
            </div>
          </div>
        </section>

        <FichaTecnicaLote
          lote={editing}
          subiendo={subiendoFicha}
          onSubir={onSubirFicha}
          onQuitar={onQuitarFicha}
          pendientes={editing ? undefined : archivosPendientes}
          onSeleccionarPendiente={onSeleccionarArchivoPendiente}
          onQuitarPendiente={onQuitarArchivoPendiente}
        />

        <FormField
          label="Observaciones"
          type="textarea"
          placeholder="Observaciones del lote"
          value={form.observaciones ?? ""}
          error={errors.observaciones}
          onChange={(valor) => onChange("observaciones", valor)}
        />
      </div>

      <CalculadoraSamModal
        open={mostrarCalculadora}
        precioInicial={form.valor_maquila_unidad}
        onClose={() => setMostrarCalculadora(false)}
        onUsar={(sam, precio) => {
          onChange("sam_pactado", sam);
          // El precio con el que se calculo el SAM ES el valor de maquila:
          // si se cambio dentro de la calculadora para probar un escenario,
          // el formulario tiene que quedar con ese mismo numero.
          onChange("valor_maquila_unidad", precio);
          setMostrarCalculadora(false);
        }}
      />
    </Modal>
  );
}
