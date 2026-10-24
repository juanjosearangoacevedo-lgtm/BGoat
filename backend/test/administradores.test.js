import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exigirAdministradorRestante,
  exigirNoInactivarseASiMismo,
} from "../src/lib/administradores.js";

/**
 * La guarda que impide dejar al sistema sin administrador activo. Aqui se
 * prueba la decision con consultas falsas; que las consultas lean bien la
 * base (roles con `Usuarios` + `EDITAR`, usuarios activos) se prueba contra
 * MySQL, no aqui.
 *
 * `administran` son los ids de rol que pueden editar usuarios y `otros`
 * cuantos OTROS administradores activos hay.
 */
function consultas({ administran = [1], otros = 0 } = {}) {
  const llamadas = { otros: 0 };
  return {
    llamadas,
    rolPuedeAdministrar: async (idRol) => administran.includes(Number(idRol)),
    otrosAdministradoresActivos: async () => {
      llamadas.otros += 1;
      return otros;
    },
  };
}

const administrador = { id_usuario: 1, id_rol: 1, estado: "ACTIVO" };
const operario = { id_usuario: 2, id_rol: 3, estado: "ACTIVO" };

const rechazo = (patron) => (error) => error.status === 400 && patron.test(error.message);

test("el unico administrador activo no se puede inactivar", async () => {
  await assert.rejects(
    () => exigirAdministradorRestante(administrador, { estado: "INACTIVO" }, consultas({ otros: 0 })),
    rechazo(/inactivar al último administrador activo/),
  );
});

test("tampoco se puede bloquear", async () => {
  await assert.rejects(
    () => exigirAdministradorRestante(administrador, { estado: "BLOQUEADO" }, consultas({ otros: 0 })),
    rechazo(/inactivar al último administrador activo/),
  );
});

test("con otro administrador activo si se puede inactivar", async () => {
  await exigirAdministradorRestante(administrador, { estado: "INACTIVO" }, consultas({ otros: 1 }));
});

test("el unico administrador no puede perder el rol con el que administra", async () => {
  await assert.rejects(
    () => exigirAdministradorRestante(administrador, { id_rol: 3 }, consultas({ otros: 0 })),
    rechazo(/quitar el rol de administrador al último administrador activo/),
  );
});

test("el id del rol puede llegar como texto desde el formulario", async () => {
  await assert.rejects(
    () => exigirAdministradorRestante(administrador, { id_rol: "3" }, consultas({ otros: 0 })),
    rechazo(/quitar el rol/),
  );
});

test("cambiarle a otro rol que tambien administra es valido", async () => {
  await exigirAdministradorRestante(
    administrador,
    { id_rol: 5 },
    consultas({ administran: [1, 5], otros: 0 }),
  );
});

test("editar sin tocar el estado ni el rol no se bloquea ni consulta nada mas", async () => {
  const falsas = consultas({ otros: 0 });

  await exigirAdministradorRestante(administrador, {}, falsas);

  assert.equal(falsas.llamadas.otros, 0);
});

test("a quien no administra se le puede inactivar o cambiar de rol", async () => {
  const falsas = consultas({ otros: 0 });

  await exigirAdministradorRestante(operario, { estado: "INACTIVO" }, falsas);
  await exigirAdministradorRestante(operario, { id_rol: 4 }, falsas);

  assert.equal(falsas.llamadas.otros, 0);
});

test("un administrador que ya esta inactivo no cuenta: cambiarle el rol no se bloquea", async () => {
  await exigirAdministradorRestante(
    { ...administrador, estado: "INACTIVO" },
    { id_rol: 3 },
    consultas({ otros: 0 }),
  );
});

test("reactivar a un administrador inactivo pasa", async () => {
  await exigirAdministradorRestante(
    { ...administrador, estado: "INACTIVO" },
    { estado: "ACTIVO" },
    consultas({ otros: 0 }),
  );
});

test("nadie se inactiva a si mismo, aunque el id llegue como texto", () => {
  assert.throws(
    () => exigirNoInactivarseASiMismo({ idObjetivo: "5", idSolicitante: 5, estado: "INACTIVO" }),
    (error) => error.status === 400 && error.message === "No puede inactivar su propio usuario",
  );
  assert.throws(
    () => exigirNoInactivarseASiMismo({ idObjetivo: 5, idSolicitante: 5, estado: "BLOQUEADO" }),
    (error) => error.status === 400,
  );
});

test("reactivarse a si mismo o editar sin tocar el estado si se permite", () => {
  exigirNoInactivarseASiMismo({ idObjetivo: 5, idSolicitante: 5, estado: "ACTIVO" });
  exigirNoInactivarseASiMismo({ idObjetivo: 5, idSolicitante: 5, estado: undefined });
});

test("inactivar a OTRO usuario no lo toca esta guarda", () => {
  exigirNoInactivarseASiMismo({ idObjetivo: 6, idSolicitante: 5, estado: "INACTIVO" });
});
