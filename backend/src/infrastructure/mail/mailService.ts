import { cfg } from '../config/configService';

export async function enviarCodigoOtp(destinatario: string, codigo: string): Promise<void> {
  if (cfg('NOTIF_EMAIL_ACTIVO', '1') === '0') return;

  const apiKey = cfg('RESEND_API_KEY');
  if (!apiKey) throw new Error('RESEND_API_KEY no configurada');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Conecta Pumas UNAH <onboarding@resend.dev>',
      to: [destinatario],
      subject: 'Tu código de acceso - Conecta Pumas',
      html: `
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
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}
