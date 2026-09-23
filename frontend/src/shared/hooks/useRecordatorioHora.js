import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiClient, withQuery } from "@/shared/services/apiClient";
import { endpoints } from "@/shared/services/endpoints";

/**
 * Recordatorio de la hora pendiente -> GET /captura/pendientes.
 *
 * Cada franja de la jornada que ya termino y no tiene registro es un
 * recordatorio. El backend decide cuales son (solo cuenta las franjas
 * VENCIDAS de jornadas ABIERTAS): pedir la hora en curso seria pedir un
 * dato que todavia no existe.
 *
 * El aviso se dispara cuando APARECE una franja nueva, no en cada
 * consulta. Un toast cada dos minutos repitiendo lo mismo se vuelve
 * ruido y la digitadora deja de leerlo, que es justo lo contrario de lo
 * que el recordatorio busca.
 */
const INTERVALO_MS = 2 * 60 * 1000;

/** Identidad de una franja pendiente, para saber cual ya se aviso. */
const claveDe = (pendiente) => `${pendiente.id_modulo}|${pendiente.hora_jornada}`;

export function useRecordatorioHora({ fecha, activo = true, onIr = null } = {}) {
  const [pendientes, setPendientes] = useState([]);
  const [consultando, setConsultando] = useState(false);

  // Lo ya avisado vive en una ref: cambiarlo no debe repintar la app.
  const avisadas = useRef(new Set());
  const primeraVez = useRef(true);

  const consultar = useCallback(async () => {
    if (!activo) return;

    setConsultando(true);
    try {
      const respuesta = await apiClient.get(withQuery(endpoints.capturaPendientes, { fecha }));
      const lista = respuesta?.pendientes ?? [];
      setPendientes(lista);

      const nuevas = lista.filter((pendiente) => !avisadas.current.has(claveDe(pendiente)));
      lista.forEach((pendiente) => avisadas.current.add(claveDe(pendiente)));

      // Al entrar puede haber varias horas atrasadas: se resumen en un
      // solo aviso en vez de apilar seis toasts.
      if (nuevas.length > 0 && !primeraVez.current) {
        const [primera] = nuevas;
        toast.warning(
          nuevas.length === 1
            ? `Falta registrar ${primera.etiqueta} en el modulo ${primera.id_modulo}`
            : `Hay ${nuevas.length} horas sin registrar`,
          {
            duration: 10000,
            action: onIr ? { label: "Registrar", onClick: () => onIr(primera) } : undefined,
          },
        );
      }
      primeraVez.current = false;
    } catch {
      // Un recordatorio que falla no debe interrumpir: la pantalla de
      // captura sigue funcionando y se reintenta en el siguiente ciclo.
    } finally {
      setConsultando(false);
    }
  }, [fecha, activo, onIr]);

  useEffect(() => {
    if (!activo) {
      setPendientes([]);
      return undefined;
    }

    // Fecha nueva, cuenta nueva: lo avisado ayer no aplica hoy.
    avisadas.current = new Set();
    primeraVez.current = true;

    consultar();
    const temporizador = setInterval(consultar, INTERVALO_MS);
    return () => clearInterval(temporizador);
  }, [consultar, activo]);

  /** Quita una franja de la lista sin esperar al siguiente ciclo. */
  const marcarRegistrada = useCallback((idModulo, horaJornada) => {
    setPendientes((previo) =>
      previo.filter(
        (pendiente) =>
          !(
            String(pendiente.id_modulo) === String(idModulo) &&
            Number(pendiente.hora_jornada) === Number(horaJornada)
          ),
      ),
    );
  }, []);

  return {
    pendientes,
    total: pendientes.length,
    /** La mas vieja: es la que se esta olvidando. */
    siguiente: pendientes[0] ?? null,
    consultando,
    refrescar: consultar,
    marcarRegistrada,
  };
}
