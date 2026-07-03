import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { UsuarioPublico } from '../../domain/entities/Usuario';
import jwt from 'jsonwebtoken';

interface MicrosoftProfileDto {
  microsoftId: string;
  correo: string;
  nombre: string;
}

interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}

export class LoginMicrosoft {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute({ microsoftId, correo, nombre }: MicrosoftProfileDto): Promise<LoginResult> {
    const correoNormalizado = correo.toLowerCase();

    if (!correoNormalizado.endsWith('@unah.hn') && !correoNormalizado.endsWith('@unah.edu.hn')) {
      throw new Error('DOMINIO_NO_PERMITIDO');
    }

    let usuario = await this.usuarioRepo.findByMicrosoftId(microsoftId);

    if (!usuario) {
      const porCorreo = await this.usuarioRepo.findByCorreo(correoNormalizado);
      if (!porCorreo) throw new Error('NO_ENROLADO');
      usuario = await this.usuarioRepo.update(porCorreo.id_usuario, { microsoft_id: microsoftId });
    }

    if (!usuario) throw new Error('No se pudo vincular el usuario');
    if (usuario.estado !== 'ACTIVO') throw new Error('Cuenta suspendida o inactiva');

    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';
    const token = jwt.sign(
      { id: usuario.id_usuario, rol: usuario.rol },
      secret,
      { expiresIn: '8h' }
    );

    const { password, microsoft_id, ...usuarioPublico } = usuario as any;
    return { token, usuario: usuarioPublico as UsuarioPublico };
  }
}
