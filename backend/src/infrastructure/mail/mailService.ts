import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function enviarCodigoOtp(destinatario: string, codigo: string): Promise<void> {
  await transporter.sendMail({
    from: `"Conecta Pumas UNAH" <${process.env.GMAIL_USER}>`,
    to: destinatario,
    subject: 'Tu código de acceso - Conecta Pumas',
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
