export type RolUsuario = 'ESTUDIANTE' | 'TUTOR' | 'ADMIN' | 'VOAE';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  contrasena_hash: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  numero_cuenta?: string;
  carrera?: string;
  centro_regional?: string;
  telefono?: string;
  foto_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UsuarioPublico {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  numero_cuenta?: string;
  carrera?: string;
  centro_regional?: string;
  telefono?: string;
  foto_url?: string;
  created_at: Date;
}
