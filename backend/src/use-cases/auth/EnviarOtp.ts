import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { enviarCodigoOtp } from '../../infrastructure/mail/mailService';
import { cfg } from '../../infrastructure/config/configService';

export class EnviarOtp {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(correo: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByCorreo(correo);
    if (!usuario) throw new Error('NO_ENROLADO');
    if (usuario.estado !== 'ACTIVO') throw new Error('Cuenta suspendida o inactiva');

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const minutos = parseInt(cfg('TIEMPO_EXPIRACION_OTP', '5'));
    const expira = new Date(Date.now() + minutos * 60 * 1000);

    await this.usuarioRepo.update(usuario.id_usuario, {
      otp_code: codigo,
      otp_expira: expira,
    });

    const DEV_EMAIL_REDIRECT: Record<string, string> = {
      'dev@unah.hn': 'unah_conecta@outlook.com',
    };
    const destinatario = DEV_EMAIL_REDIRECT[usuario.correo.toLowerCase()] ?? usuario.correo;
    await enviarCodigoOtp(destinatario, codigo);
  }
}
