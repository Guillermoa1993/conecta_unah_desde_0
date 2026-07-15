import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { RolUsuario } from '../../domain/entities/Usuario';
import bcrypt from 'bcryptjs';

interface RegistrarDto {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: RolUsuario;
  carrera?: string;
}

export class RegistrarUsuario {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(datos: RegistrarDto) {
    const existente = await this.usuarioRepo.findByCorreo(datos.correo);
    if (existente) throw new Error('El correo ya está registrado');

    if (!datos.correo.endsWith('@unah.hn') && !datos.correo.endsWith('@unah.edu.hn')) {
      throw new Error('Solo se permiten correos institucionales @unah.hn o @unah.edu.hn');
    }

    const password = await bcrypt.hash(datos.contrasena, 12);

    return this.usuarioRepo.create({
      nombre: datos.nombre,
      correo: datos.correo,
      password,
      rol: datos.rol,
      carrera: datos.carrera,
    });
  }
}
