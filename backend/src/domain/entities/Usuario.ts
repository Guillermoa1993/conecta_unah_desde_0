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
  microsoft_id?: string | null;
  otp_code?: string | null;
  otp_expira?: Date | null;
  permite_reacciones_perfil: boolean;
  // Datos del perfil (tabla separada, vienen unidos por JOIN)
  telefono?: string | null;
  numero_cuenta?: string | null;
  id_centro_regional?: number | null;
  centro_regional?: string | null;
  genero?: string | null;
  biografia?: string | null;
  foto_url?: string | null;
  forma003_base64?: string | null;
  numero_empleado?: string | null;
  id_departamento?: number | null;
  departamento?: string | null;
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
  permite_reacciones_perfil: boolean;
  telefono?: string | null;
  numero_cuenta?: string | null;
  id_centro_regional?: number | null;
  centro_regional?: string | null;
  genero?: string | null;
  biografia?: string | null;
  foto_url?: string | null;
  numero_empleado?: string | null;
  id_departamento?: number | null;
  departamento?: string | null;
}
