import { cfg } from '../config/configService';

export async function enviarCodigoOtp(destinatario: string, codigo: string): Promise<void> {
  if (cfg('NOTIF_EMAIL_ACTIVO', '1') === '0') return;

  const apiKey = cfg('BREVO_API_KEY');
  if (!apiKey) throw new Error('BREVO_API_KEY no configurada');

  const senderEmail = cfg('GMAIL_USER', 'unah_conecta@outlook.com');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Conecta Pumas UNAH', email: senderEmail },
      to: [{ email: destinatario }],
      subject: 'Tu código de acceso - Conecta Pumas',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
          <h2 style="color:#004B87;">Conecta Pumas UNAH</h2>
          <p>Tu código de acceso es:</p>
          <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${codigo}</p>
          <p style="color:#666; font-size: 12px;">Este código expira en 5 minutos. Si no solicitaste este código, ignora este correo.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo error ${res.status}: ${err}`);
  }
}
