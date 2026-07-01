import { Usuario, UsuarioPublico, RolUsuario } from '../entities/Usuario';

export interface UsuarioRepository {
  findById(id: string): Promise<Usuario | null>;
  findByCorreo(correo: string): Promise<Usuario | null>;
  findAll(filtros?: { rol?: RolUsuario; estado?: string }): Promise<UsuarioPublico[]>;
  create(data: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>): Promise<Usuario>;
  update(id: string, data: Partial<Usuario>): Promise<Usuario | null>;
  delete(id: string): Promise<boolean>;
}
