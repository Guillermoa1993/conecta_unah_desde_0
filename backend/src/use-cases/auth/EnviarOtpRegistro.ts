import { enviarCodigoOtp } from '../../infrastructure/mail/mailService';
import { guardarOtpRegistro } from '../../infrastructure/otp/otpRegistroStore';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

export class EnviarOtpRegistro {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(correo: string): Promise<void> {
    if (!correo.endsWith('@unah.hn') && !correo.endsWith('@unah.edu.hn')) {
      throw new Error('Solo se permiten correos institucionales @unah.hn o @unah.edu.hn');
    }

    const existente = await this.usuarioRepo.findByCorreo(correo);
    if (existente) throw new Error('Este correo ya está registrado');

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    guardarOtpRegistro(correo, codigo);
    await enviarCodigoOtp(correo, codigo);
  }
}