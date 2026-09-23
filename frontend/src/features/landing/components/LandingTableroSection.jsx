import { TableroPreview } from "./TableroPreview";

/**
 * La prueba, justo despues de la promesa del hero.
 *
 * El hero muestra la planta; esta banda muestra la pantalla. Van juntas
 * a proposito: quien evalua un sistema de produccion quiere ver el
 * tablero antes de crear una cuenta, y esconderlo detras del login es la
 * forma mas facil de que no la cree.
 */
export function LandingTableroSection() {
  return (
    <section id="tablero" className="border-b border-gray-200 bg-white py-20 scroll-mt-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            El tablero de la pared, en la pantalla
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Una celda por modulo y por hora. La digitadora solo escribe las unidades; la meta, la
            eficiencia y la facturacion las calcula el sistema.
          </p>
        </div>

        <TableroPreview />

        <div className="mt-10 grid gap-6 text-center sm:grid-cols-3">
          <div>
            <p className="text-3xl font-bold text-[#0F4C3F]">3 datos</p>
            <p className="mt-1 text-sm text-gray-600">
              es todo lo que se digita por hora: unidades, defectuosas y la incidencia
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0F4C3F]">520 min</p>
            <p className="mt-1 text-sm text-gray-600">
              la jornada real, con la ultima franja mas corta: la meta se ajusta sola
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#0F4C3F]">0 cuentas</p>
            <p className="mt-1 text-sm text-gray-600">
              a mano al cerrar el dia, frente a las 200 que hoy se hacen con calculadora
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
