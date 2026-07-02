export type RolUsuario = 'ESTUDIANTE' | 'TUTOR' | 'ADMIN' | 'VOAE';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  password: string;
  id_rol: number;
  rol?: string;
  id_estado: number;
  estado?: string;
  id_carrera?: number;
  carrera?: string;
}

export interface UsuarioPublico {
  id_usuario: number;
  nombre: string;
  correo: string;
  id_rol: number;
  rol?: string;
  id_estado: number;
  estado?: string;
  id_carrera?: number;
  carrera?: string;
}
