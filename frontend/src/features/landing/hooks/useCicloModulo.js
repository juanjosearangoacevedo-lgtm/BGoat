import { useEffect, useRef, useState } from "react";
import { heroModulosDemo } from "../services/landingContent";

const DURACION_CONTEO = 1500;
const DURACION_VISIBLE = 900;
const DURACION_SALIDA = 450;
const PROPORCION_INICIAL = 0.12;

let contadorId = 0;

/** Rojo por debajo de la mitad, naranja acercandose, verde en la meta. */
export function colorPorEficiencia(porcentaje) {
  if (porcentaje < 50) return { arco: "var(--anillo-bajo)", texto: "var(--anillo-bajo-texto)" };
  if (porcentaje < 80) return { arco: "var(--dorado)", texto: "var(--dorado-hover)" };
  return { arco: "var(--exito-barra)", texto: "var(--marca)" };
}

/**
 * Feed de dos tarjetas: una arriba cuenta sus unidades hasta la meta; al
 * cerrarse el ciclo, una tarjeta nueva entra arriba, la que estaba arriba
 * baja de puesto (se congela en su valor final) y la que ya estaba abajo
 * sale desvaneciendose. Cada tarjeta conserva su `id` mientras cambia de
 * puesto, para que la transicion de posicion sea continua en vez de un
 * corte seco.
 */
export function useFeedModulos() {
  const [superior, setSuperior] = useState(null);
  const [unidadesSuperior, setUnidadesSuperior] = useState(0);
  const [inferior, setInferior] = useState(null);
  const [saliente, setSaliente] = useState(null);

  const superiorRef = useRef(null);
  const inferiorRef = useRef(null);
  const punteroRef = useRef(0);

  useEffect(() => {
    let cancelado = false;
    let idAnimacion;
    let idSalida;

    function siguienteDato() {
      const dato = heroModulosDemo[punteroRef.current % heroModulosDemo.length];
      punteroRef.current += 1;
      return dato;
    }

    function animarSuperior(dato) {
      const tarjeta = { id: contadorId++, dato };
      superiorRef.current = tarjeta;
      setSuperior(tarjeta);

      const inicio = Math.round(dato.meta * PROPORCION_INICIAL);
      setUnidadesSuperior(inicio);

      const t0 = performance.now();
      function paso(ahora) {
        if (cancelado) return;
        const progreso = Math.min(1, (ahora - t0) / DURACION_CONTEO);
        const suavizado = 1 - Math.pow(1 - progreso, 3);
        setUnidadesSuperior(Math.round(inicio + (dato.unidadesFinal - inicio) * suavizado));
        if (progreso < 1) idAnimacion = requestAnimationFrame(paso);
      }
      idAnimacion = requestAnimationFrame(paso);
    }

    animarSuperior(siguienteDato());
    const tarjetaInferior = { id: contadorId++, dato: siguienteDato() };
    inferiorRef.current = tarjetaInferior;
    setInferior(tarjetaInferior);

    const idIntervalo = setInterval(() => {
      if (cancelado) return;

      setSaliente(inferiorRef.current);
      clearTimeout(idSalida);
      idSalida = setTimeout(() => !cancelado && setSaliente(null), DURACION_SALIDA);

      inferiorRef.current = superiorRef.current;
      setInferior(superiorRef.current);

      animarSuperior(siguienteDato());
    }, DURACION_CONTEO + DURACION_VISIBLE);

    return () => {
      cancelado = true;
      cancelAnimationFrame(idAnimacion);
      clearInterval(idIntervalo);
      clearTimeout(idSalida);
    };
  }, []);

  return { superior, unidadesSuperior, inferior, saliente };
}
