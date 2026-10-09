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
    })
  : null;

export const correoConfigurado = () => configurado;

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
