/**
 * Revisa el correo del sistema (el de "recuperar contraseña").
 *
 *   npm run correo:probar                  -> comprueba el usuario y la clave
 *                                            contra el servidor; NO envia nada
 *   npm run correo:probar -- tu@correo.com -> ademas manda un correo de prueba
 *                                            a esa direccion
 *
 * Lee la configuracion de backend/.env (SMTP_*) y nunca imprime la clave.
 */
import { env } from "../src/config/env.js";
import { enviarCorreo, describirErrorCorreo, verificarCorreo } from "../src/lib/correo.js";

const destino = process.argv[2];

const { usuario, host, puerto } = env.correo;
const cuenta = usuario ? `${usuario.slice(0, 2)}***@${usuario.split("@")[1] ?? "?"}` : "(sin configurar)";
console.log(`Servidor: ${host}:${puerto} · cuenta remitente: ${cuenta}`);

const estado = await verificarCorreo();
if (!estado.configurado) {
  console.log(`\nSin configurar: ${estado.motivo}.`);
  console.log("Sin correo, el enlace de recuperación solo aparece en la consola del backend.");
  process.exit(1);
}
if (!estado.ok) {
  console.log(`\nFALLO: ${estado.motivo}`);
  process.exit(1);
}
console.log("\nOK: el servidor de correo aceptó el usuario y la clave.");

if (destino) {
  try {
    await enviarCorreo({
      para: destino,
      asunto: "Prueba de correo de BGoat",
      texto: "Si lees esto, el correo del sistema funciona: la recuperación de contraseña va a llegar.",
    });
    console.log(`Correo de prueba enviado a ${destino}. Revisa también la carpeta de spam.`);
  } catch (error) {
    console.log(`No se pudo enviar a ${destino}: ${describirErrorCorreo(error)}`);
    process.exit(1);
  }
} else {
  console.log("Para mandar además un correo de prueba: npm run correo:probar -- tu@correo.com");
}
