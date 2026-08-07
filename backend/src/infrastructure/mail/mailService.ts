import nodemailer from 'nodemailer';
import { promises as dns } from 'dns';
import { cfg } from '../config/configService';

async function resolveIPv4(hostname: string): Promise<string> {
  try {
    const addrs = await dns.resolve4(hostname);
    return addrs[0];
  } catch {
    return hostname;
  }
}

async function createTransporter() {
  const smtpHost = cfg('SMTP_HOST', 'smtp.gmail.com');
  const host = await resolveIPv4(smtpHost);
  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    tls: { servername: smtpHost },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: cfg('GMAIL_USER'),
      pass: cfg('GMAIL_APP_PASSWORD'),
    },
  });
}

export async function enviarCodigoOtp(destinatario: string, codigo: string): Promise<void> {
  if (cfg('NOTIF_EMAIL_ACTIVO', '1') === '0') return;
  const transporter = await createTransporter();
  const gmailUser = cfg('GMAIL_USER');

  await transporter.sendMail({
    from: `"Conecta Pumas UNAH" <${gmailUser}>`,
    to: destinatario,
    subject: 'Tu código de acceso - Conecta Pumas',
    text: `Tu código de acceso es: ${codigo}\n\nEste código expira en 5 minutos. Si no solicitaste este código, ignora este correo.`,
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2 style="color:#004B87;">Conecta Pumas UNAH</h2>
        <p>Tu código de acceso es:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
        <p style="color:#666; font-size: 12px;">Este código expira en 5 minutos. Si no solicitaste este código, ignora este correo.</p>
      </div>
    `,
  });
}
