import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/shared/components/button";
import { PageHeader } from "@/shared/components/PageHeader";
import { JornadaPasos } from "../components/JornadaPasos";
import { JornadasAbiertas } from "../components/JornadasAbiertas";
import { PasoAsignacion } from "../components/PasoAsignacion";
import { PasoModulo } from "../components/PasoModulo";
import { PasoOperarias } from "../components/PasoOperarias";
import { PasoTrabajo } from "../components/PasoTrabajo";
import { useJornadaPage } from "../hooks/useJornadaPage";

/**
 * Inicio de jornada.
 *
 * La traduccion literal del flujo de la planta: modulo -> cuantas
 * operarias -> quienes -> cliente y lote -> iniciar produccion.
 *
 * No tiene entrada en el menu. Se llega desde Registrar produccion, que es
 * donde se nota que falta: el modulo aparece como "Sin jornada" y no deja
 * capturar. Tenerla tambien arriba ponia una pantalla de configuracion
 * delante del trabajo del dia.
 *
 * Una pregunta por pantalla, con la respuesta en botones grandes. La
 * alternativa --un formulario con los cinco campos juntos-- cabe en menos
 * espacio pero obliga a leerlo entero antes de contestar lo primero, y
 * esto se llena de pie y en dos minutos.
 */
export function JornadaPage({ onNavigate, moduloInicial = null, fechaInicial = null }) {
  const jornada = useJornadaPage({ moduloInicial, fechaInicial });

  const irACaptura = (modulo) =>
    onNavigate?.("captura", { id_modulo: modulo.id_modulo, fecha: jornada.fecha });

  const handleIniciar = async () => {
    const creada = await jornada.iniciar();
    if (creada) irACaptura({ id_modulo: creada.id_modulo });
  };

  if (jornada.cargando) {
    return (
      <div className="p-4 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="h-64 rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const contenidoPaso = {
    modulo: (
      <PasoModulo
        modulos={jornada.modulos}
        seleccionado={jornada.form.id_modulo}
        onSeleccionar={(valor) => jornada.setField("id_modulo", valor)}
        onContinuarJornada={irACaptura}
      />
    ),
    operarias: (
      <PasoOperarias
        valor={jornada.form.cantidad_operarias}
        capacidad={jornada.moduloSeleccionado?.capacidad_operarios}
        onCambiar={jornada.setCantidad}
        error={jornada.errors.cantidad_operarias}
      />
    ),
    asignacion: (
      <PasoAsignacion
        cantidad={Number(jornada.form.cantidad_operarias) || 0}
        asignacion={jornada.asignacion}
        operarias={jornada.operarias}
        onAsignar={jornada.asignarOperaria}
      />
    ),
    trabajo: (
      <PasoTrabajo
        clientes={jornada.clientes}
        lotes={jornada.lotesDelCliente}
        ordenes={jornada.ordenesDelLote}
        form={jornada.form}
        errors={jornada.errors}
        onCambiar={jornada.setField}
        loteSeleccionado={jornada.loteSeleccionado}
        ordenSeleccionada={jornada.ordenSeleccionada}
      />
    ),
  };

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Inicio de jornada"
        subtitle="Configura el modulo antes de empezar a registrar la produccion"
      >
        <input
          type="date"
          value={jornada.fecha}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(evento) => jornada.setFecha(evento.target.value)}
          className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#0F4C3F]"
        />
      </PageHeader>

      {jornada.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {jornada.error}
        </div>
      )}

      <JornadasAbiertas
        jornadas={jornada.jornadasAbiertas}
        onCapturar={irACaptura}
        onCerrar={jornada.cerrar}
        onReabrir={jornada.reabrir}
      />

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
        <JornadaPasos
          pasos={jornada.pasos}
          actual={jornada.paso}
          onIr={jornada.irAPaso}
        />

        <h2 className="mb-5 text-xl font-semibold text-gray-900 md:text-2xl">
          {jornada.pasoActual.pregunta}
        </h2>

        {contenidoPaso[jornada.pasoActual.clave]}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <Button
            variant="outline"
            onClick={jornada.retroceder}
            disabled={jornada.paso === 0}
            className="h-11"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Atras
          </Button>

          {jornada.esUltimoPaso ? (
            <Button
              onClick={handleIniciar}
              disabled={jornada.guardando || !jornada.loteSeleccionado?.sam_pactado}
              className="h-11 flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14] sm:flex-none sm:px-8"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              {jornada.guardando ? "Iniciando..." : "Iniciar produccion"}
            </Button>
          ) : (
            <Button
              onClick={jornada.avanzar}
              className="h-11 flex-1 bg-[#D08E10] text-white hover:bg-[#B67F14] sm:flex-none sm:px-8"
            >
              Continuar
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
