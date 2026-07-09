import { Usuario, UsuarioPublico } from '../entities/Usuario';

export interface UsuarioRepository {
  findById(id: number): Promise<Usuario | null>;
  findByCorreo(correo: string): Promise<Usuario | null>;
  findByMicrosoftId(microsoftId: string): Promise<Usuario | null>;
  findAll(filtros?: { rol?: string; estado?: string }): Promise<UsuarioPublico[]>;
  create(data: {
    nombre: string;
    correo: string;
    password: string;
    rol: string;
    carrera?: string;
    telefono?: string;
    numero_cuenta?: string;
    centro_regional?: string;
    genero?: string;
    biografia?: string;
    foto_url?: string;
    forma003_base64?: string;
  }): Promise<Usuario>;
  update(id: number, data: Partial<Usuario>): Promise<Usuario | null>;
  delete(id: number): Promise<boolean>;
}
