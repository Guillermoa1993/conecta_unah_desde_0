import { cfg } from '../../infrastructure/config/configService';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { UsuarioPublico } from '../../domain/entities/Usuario';
import jwt from 'jsonwebtoken';

interface VerificarOtpDto {
  correo: string;
  codigo: string;
}

interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}

export class VerificarOtp {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute({ correo, codigo }: VerificarOtpDto): Promise<LoginResult> {
    const usuario = await this.usuarioRepo.findByCorreo(correo) as any;
    if (!usuario) throw new Error('Correo no encontrado');

    if (!usuario.otp_code || !usuario.otp_expira) {
      throw new Error('No hay un código solicitado para este correo');
    }
    if (usuario.otp_code !== codigo) throw new Error('Código incorrecto');
    if (new Date() > new Date(usuario.otp_expira)) {
      throw new Error('El código ha expirado, solicita uno nuevo');
    }

    const actualizado = await this.usuarioRepo.update(usuario.id_usuario, {
      otp_code: null,
      otp_expira: null,
    });
    if (!actualizado) throw new Error('No se pudo actualizar el usuario');

    const secret = cfg('JWT_SECRET', 'dev-secret-change-in-prod');
    const token = jwt.sign(
      { id: (actualizado as any).id_usuario, rol: (actualizado as any).rol },
      secret,
      cfg('SESION_PERMANENTE') === '1' ? {} : { expiresIn: parseInt(cfg('DURACION_SESION_HORAS', '8')) * 3600 }
    );

    const { password, microsoft_id, otp_code, otp_expira, ...usuarioPublico } = actualizado as any;
    return { token, usuario: usuarioPublico as UsuarioPublico };
  }
}
