// Módulo 4 · Seguridad — entidad de usuario administrado por este módulo.
// Nombrada "UsuarioSeguridad" (y no "Usuario") a propósito: el proyecto ya
// tiene un Usuario del Grupo 1 (tabla_grupo_1_usuario, login institucional).
// Esta es una entidad DISTINTA, propia de tabla_grupo_4_usuarios.

export interface UsuarioSeguridad {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  contrasena_hash: string;
  telefono: string | null;
  estado: number; // 1 = Activo, 0 = Inhabilitado
  motivo_inhabilitacion: string | null;
  modulos_acceso: string[];
}

// Forma pública (sin el hash de la contraseña) devuelta por la API.
export interface UsuarioSeguridadPublico {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  telefono: string | null;
  estado: number;
  motivo_inhabilitacion: string | null;
  modulos_acceso: string[];
  roles: { id_rol: number; nombre_rol: string; codigo_rol: string }[];
  permisos_directos: { id_permiso: number; nombre_permiso: string; modulo: string }[];
}

export interface CrearUsuarioSeguridadDto {
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string;
  modulos_acceso?: string[];
  roles?: number[];
  permisos_directos?: number[];
}

export interface ActualizarUsuarioSeguridadDto {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  modulos_acceso?: string[];
}
