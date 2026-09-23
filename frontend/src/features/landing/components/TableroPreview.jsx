/**
 * El tablero de captura, dibujado: la prueba de la landing.
 *
 * Va en su propia banda debajo del hero. Arriba esta la planta --una foto
 * de verdad-- y aqui la pantalla que la lee; separarlas deja que cada una
 * se vea a su tamano en vez de pelearse el mismo hueco.
 *
 * Es un SVG y no una captura de pantalla: se ve nitido en cualquier
 * resolucion, pesa nada y se corrige editando datos en vez de volver a
 * fotografiar la aplicacion cada vez que cambia.
 *
 * Los numeros son los del modulo de demostracion y cuadran entre si: la
 * meta de cada hora sale de (personas x 60) / SAM, y el porcentaje de
 * unidades sobre esa meta. Una imagen de producto con cuentas que no
 * cuadran es lo primero que nota alguien que sabe de planta.
 *
 * Cada celda lleva su numero y cada fila su porcentaje, asi que el color
 * confirma el estado pero no es el unico que lo dice: en blanco y negro,
 * o para quien no distingue el verde del rojo, la informacion sigue ahi.
 */

// Verde, ambar y rojo son los mismos del umbral de cumplimiento dentro de
// la aplicacion, no unos nuevos: la landing y el producto tienen que
// verse como la misma cosa.
const ESTADOS = {
  bien: { fondo: "#dcfce7", borde: "#86efac", texto: "#15803d", barra: "#16a34a" },
  medio: { fondo: "#fef3c7", borde: "#fcd34d", texto: "#b46a12", barra: "#d97706" },
  mal: { fondo: "#fee2e2", borde: "#fca5a5", texto: "#b91c1c", barra: "#dc2626" },
};

const HORAS = ["6:00", "7:00", "8:00", "9:00", "10:00", "11:00"];

const MODULOS = [
  {
    codigo: "MOD-01",
    detalle: "12 operarias · SAM 4.20",
    meta: 171,
    horas: [155, 154, 156, 155, 154, null],
    total: "90%",
    estado: "bien",
  },
  {
    codigo: "MOD-04",
    detalle: "8 operarias · SAM 9.40",
    meta: 51,
    horas: [48, 47, 49, 48, null, null],
    total: "94%",
    estado: "bien",
  },
  {
    codigo: "MOD-03",
    detalle: "10 operarias · SAM 5.80",
    meta: 103,
    horas: [76, 75, 77, 76, 75, null],
    total: "73%",
    estado: "medio",
  },
  {
    codigo: "MOD-02",
    detalle: "3 operarias · SAM 6.50",
    meta: 28,
    horas: [0, 0, 3, 4, null, null],
    total: "10%",
    estado: "mal",
  },
];

// La columna de la izquierda tiene que caber "12 operarias - SAM 4.20"
// sin rozar la primera celda, de ahi que la rejilla arranque en 118.
const COL_X = 118;
const COL_ANCHO = 66;
const COL_GAP = 6;
const FILA_Y = 80;
const FILA_ALTO = 46;
const FILA_GAP = 8;

const xDeColumna = (indice) => COL_X + indice * (COL_ANCHO + COL_GAP);
const yDeFila = (indice) => FILA_Y + indice * (FILA_ALTO + FILA_GAP);

/** El estado de una celda segun que tanto se acerco a la meta de la hora. */
function estadoDeCelda(unidades, meta) {
  const cumplimiento = (unidades * 100) / meta;
  if (cumplimiento >= 85) return ESTADOS.bien;
  if (cumplimiento >= 60) return ESTADOS.medio;
  return ESTADOS.mal;
}

export function TableroPreview() {
  return (
    <svg
      viewBox="0 0 620 380"
      role="img"
      aria-label="Tablero de captura de BGoat: cuatro modulos de produccion con las unidades registradas en cada hora y su cumplimiento frente a la meta"
      className="w-full h-auto"
    >
      <defs>
        <filter id="sombra-tablero" x="-8%" y="-8%" width="116%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#1e1b4b" floodOpacity="0.28" />
        </filter>
      </defs>

      <rect
        x="0"
        y="0"
        width="620"
        height="380"
        rx="16"
        fill="#ffffff"
        filter="url(#sombra-tablero)"
      />

      {/* Cabecera */}
      <rect x="0" y="0" width="620" height="48" rx="16" fill="#fafafa" />
      <rect x="0" y="32" width="620" height="16" fill="#fafafa" />
      <line x1="0" y1="48" x2="620" y2="48" stroke="#e5e7eb" strokeWidth="1" />

      <circle cx="26" cy="24" r="4" fill="#f87171" />
      <circle cx="40" cy="24" r="4" fill="#fbbf24" />
      <circle cx="54" cy="24" r="4" fill="#34d399" />

      <text x="76" y="28" fontSize="13" fontWeight="700" fill="#111827">
        Registrar produccion
      </text>

      <rect x="452" y="13" width="152" height="22" rx="11" fill="#0F4C3F" opacity="0.1" />
      <text x="528" y="28" fontSize="11" fontWeight="600" fill="#0F4C3F" textAnchor="middle">
        24 de 36 celdas
      </text>

      {/* Encabezado de horas */}
      {HORAS.map((hora, indice) => (
        <text
          key={hora}
          x={xDeColumna(indice) + COL_ANCHO / 2}
          y="70"
          fontSize="10"
          fontWeight="600"
          fill="#9ca3af"
          textAnchor="middle"
        >
          {hora}
        </text>
      ))}
      <text x="578" y="70" fontSize="10" fontWeight="600" fill="#9ca3af" textAnchor="middle">
        DIA
      </text>

      {/* Una fila por modulo */}
      {MODULOS.map((modulo, fila) => {
        const y = yDeFila(fila);
        const estadoFila = ESTADOS[modulo.estado];

        return (
          <g key={modulo.codigo}>
            <text x="18" y={y + 19} fontSize="12" fontWeight="700" fill="#111827">
              {modulo.codigo}
            </text>
            <text x="18" y={y + 33} fontSize="8.5" fill="#9ca3af">
              {modulo.detalle}
            </text>

            {modulo.horas.map((unidades, columna) => {
              const x = xDeColumna(columna);

              // Las horas que todavia no llegan quedan vacias, igual que
              // en la pantalla real: no son un cero, son un "aun no".
              if (unidades === null) {
                return (
                  <rect
                    key={columna}
                    x={x}
                    y={y}
                    width={COL_ANCHO}
                    height={FILA_ALTO}
                    rx="8"
                    fill="#f9fafb"
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                );
              }

              const estado = estadoDeCelda(unidades, modulo.meta);
              const cumplimiento = Math.min((unidades * 100) / modulo.meta, 100);

              return (
                <g key={columna}>
                  <rect
                    x={x}
                    y={y}
                    width={COL_ANCHO}
                    height={FILA_ALTO}
                    rx="8"
                    fill={estado.fondo}
                    stroke={estado.borde}
                    strokeWidth="1"
                  />
                  <text
                    x={x + COL_ANCHO / 2}
                    y={y + 21}
                    fontSize="14"
                    fontWeight="700"
                    fill={estado.texto}
                    textAnchor="middle"
                  >
                    {unidades}
                  </text>
                  <text
                    x={x + COL_ANCHO / 2}
                    y={y + 32}
                    fontSize="8"
                    fill={estado.texto}
                    opacity="0.75"
                    textAnchor="middle"
                  >
                    de {modulo.meta}
                  </text>

                  {/* La barra repite el cumplimiento que ya dice el numero. */}
                  <rect
                    x={x + 10}
                    y={y + FILA_ALTO - 9}
                    width={COL_ANCHO - 20}
                    height="3"
                    rx="1.5"
                    fill="#ffffff"
                    opacity="0.7"
                  />
                  <rect
                    x={x + 10}
                    y={y + FILA_ALTO - 9}
                    width={((COL_ANCHO - 20) * cumplimiento) / 100}
                    height="3"
                    rx="1.5"
                    fill={estado.barra}
                  />
                </g>
              );
            })}

            <text
              x="578"
              y={y + 28}
              fontSize="13"
              fontWeight="700"
              fill={estadoFila.texto}
              textAnchor="middle"
            >
              {modulo.total}
            </text>
          </g>
        );
      })}

      {/* Cierre del dia */}
      <line x1="18" y1="306" x2="602" y2="306" stroke="#e5e7eb" strokeWidth="1" />

      <text x="18" y="330" fontSize="9" fill="#9ca3af">
        UNIDADES DE LA PLANTA
      </text>
      <text x="18" y="350" fontSize="17" fontWeight="700" fill="#111827">
        1.689
      </text>

      <text x="178" y="330" fontSize="9" fill="#9ca3af">
        EFICIENCIA
      </text>
      <text x="178" y="350" fontSize="17" fontWeight="700" fill="#0F4C3F">
        79,1%
      </text>

      <text x="300" y="330" fontSize="9" fill="#9ca3af">
        FACTURACION REAL
      </text>
      <text x="300" y="350" fontSize="17" fontWeight="700" fill="#111827">
        $ 4.026.600
      </text>

      <text x="470" y="330" fontSize="9" fill="#9ca3af">
        MIN. PERDIDOS
      </text>
      <text x="470" y="350" fontSize="17" fontWeight="700" fill="#dc2626">
        360
      </text>
    </svg>
  );
}
