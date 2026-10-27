import nodemailer from "nodemailer";
import { env } from "../config/env.js";

/**
 * Envio de correos del sistema (por ahora, solo la recuperacion de
 * contrasena).
 *
 * Se configura con SMTP_* en `.env`. Sin usuario y clave no se envia nada:
 * `enviarCorreo` devuelve false y quien llama decide que hacer (en
 * desarrollo, escribir el enlace en la consola). Asi el backend arranca y
 * funciona igual en una maquina sin correo configurado.
 */
const configurado = Boolean(env.correo.usuario && env.correo.clave);

const transporte = configurado
  ? nodemailer.createTransport({
      host: env.correo.host,
      port: env.correo.puerto,
      // 465 es SSL directo; 587 arranca en claro y sube a TLS (STARTTLS).
      secure: env.correo.puerto === 465,
      auth: { user: env.correo.usuario, pass: env.correo.clave },
      // Sin limites, un servidor de correo que no contesta dejaba colgada
      // la peticion de "recuperar contraseña" por minutos.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : null;

export const correoConfigurado = () => configurado;

/** Lo que paso al enviar, dicho para quien administra el sistema (va a la consola, no a la pantalla). */
export function describirErrorCorreo(error) {
  if (error?.code === "EAUTH" || error?.responseCode === 535) {
    return (
      "el servidor de correo rechazó el usuario o la clave (535). Con Gmail, SMTP_PASS tiene que ser una " +
      '"contraseña de aplicación" de 16 letras (Cuenta de Google > Seguridad > Verificación en 2 pasos > ' +
      "Contraseñas de aplicaciones); deja de servir si se cambia la contraseña de la cuenta o se revoca. " +
      "Crea una nueva, ponla en SMTP_PASS de backend/.env y reinicia el backend."
    );
  }
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED"].includes(error?.code)) {
    return `no se pudo conectar a ${env.correo.host}:${env.correo.puerto} (${error.code}). Revisa la conexión a internet o SMTP_HOST y SMTP_PORT.`;
  }
  return error?.message ?? String(error);
}

/**
 * Comprueba que el servidor de correo acepta el usuario y la clave. NO envia
 * ningun mensaje. Lo usa `npm run correo:probar`; no corre al arrancar, porque
 * con `node --watch` el backend reinicia a cada cambio y cada reinicio seria
 * un inicio de sesion mas contra Gmail.
 */
export async function verificarCorreo() {
  if (!transporte) {
    return { configurado: false, ok: false, motivo: "falta SMTP_USER o SMTP_PASS en backend/.env" };
  }
  try {
    await transporte.verify();
    return { configurado: true, ok: true, motivo: null };
  } catch (error) {
    return { configurado: true, ok: false, motivo: describirErrorCorreo(error) };
  }
}

/** Envia un correo. Devuelve true si salio, false si no hay correo configurado. */
export async function enviarCorreo({ para, asunto, texto, html }) {
  if (!transporte) return false;
  await transporte.sendMail({
    from: env.correo.remitente || `BGoat <${env.correo.usuario}>`,
    to: para,
    subject: asunto,
    text: texto,
    html,
  });
  return true;
}

/** El nombre va dentro del HTML del correo: se escapa por si trae < o &. */
const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** El correo de recuperacion: el enlace vence en una hora. */
export function correoRecuperacion({ nombre, enlace }) {
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const saludoHtml = nombre ? `Hola ${escapar(nombre)},` : "Hola,";
  return {
    asunto: "Restablece tu contraseña de BGoat",
    texto: [
      saludo,
      "",
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta en BGoat.",
      "Abre este enlace para escribir una nueva (vence en 1 hora):",
      "",
      enlace,
      "",
      "Si no fuiste tú, ignora este correo: tu contraseña sigue igual.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#12201B">
        <h2 style="color:#0F4C3F;margin-bottom:8px">Restablece tu contraseña</h2>
        <p>${saludoHtml}</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en BGoat.</p>
        <p style="margin:24px 0">
          <a href="${enlace}"
             style="background:#D08E10;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">
            Escribir una nueva contraseña
          </a>
        </p>
        <p style="font-size:13px;color:#5C6B64">El enlace vence en 1 hora. Si no fuiste tú, ignora este correo: tu contraseña sigue igual.</p>
      </div>`,
  };
}
