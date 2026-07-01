import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { UsuarioPublico } from '../../domain/entities/Usuario';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

interface LoginDto {
  correo: string;
  contrasena: string;
}

interface LoginResult {
  token: string;
  usuario: UsuarioPublico;
}

export class LoginUsuario {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute({ correo, contrasena }: LoginDto): Promise<LoginResult> {
    const usuario = await this.usuarioRepo.findByCorreo(correo);
    if (!usuario) throw new Error('Credenciales inválidas');
    if (usuario.estado !== 'ACTIVO') throw new Error('Cuenta suspendida o inactiva');

    const match = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!match) throw new Error('Credenciales inválidas');

    const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      secret,
      { expiresIn: '8h' }
    );

    const { contrasena_hash, ...usuarioPublico } = usuario;
    return { token, usuario: usuarioPublico };
  }
}
