import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { enviarCodigoOtp } from '../../infrastructure/mail/mailService';

export class EnviarOtp {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(correo: string): Promise<void> {
    const usuario = await this.usuarioRepo.findByCorreo(correo);
    if (!usuario) throw new Error('NO_ENROLADO');
    if (usuario.estado !== 'ACTIVO') throw new Error('Cuenta suspendida o inactiva');

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 5 * 60 * 1000);

    await this.usuarioRepo.update(usuario.id_usuario, {
      otp_code: codigo,
      otp_expira: expira,
    });

    await enviarCodigoOtp(usuario.correo, codigo);
  }
}
