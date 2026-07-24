import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';
import { Usuario } from '../../domain/entities/Usuario';

interface ActualizarPerfilDto {
  telefono?: string;
  genero?: string;
  biografia?: string;
  foto_url?: string;
}

const FOTO_MAX_BYTES = 2 * 1024 * 1024; // 2MB aprox sobre el string base64

export class ActualizarPerfilPersonal {
  constructor(private readonly usuarioRepo: UsuarioRepository) {}

  async execute(idUsuario: number, datos: ActualizarPerfilDto): Promise<Usuario> {
    if (datos.biografia && datos.biografia.length > 300) {
      throw new Error('La biografía no puede superar los 300 caracteres.');
    }

    if (datos.telefono !== undefined) {
      const limpio = datos.telefono.trim();
      if (limpio.length < 8 || limpio.length > 15) {
        throw new Error('El teléfono debe tener entre 8 y 15 caracteres.');
      }
      datos.telefono = limpio;
    }

    if (datos.genero !== undefined) {
      const limpio = datos.genero.trim();
      if (limpio === '' || limpio.length > 30) {
        throw new Error('El género no es válido.');
      }
      datos.genero = limpio;
    }

    if (datos.foto_url !== undefined) {
      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(datos.foto_url)) {
        throw new Error('La foto debe enviarse como imagen (png, jpg o webp) en base64.');
      }
      if (datos.foto_url.length > FOTO_MAX_BYTES) {
        throw new Error('La foto de perfil es demasiado grande (máximo 2MB).');
      }
    }

    const usuario = await this.usuarioRepo.actualizarPerfil(idUsuario, datos);
    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }
}