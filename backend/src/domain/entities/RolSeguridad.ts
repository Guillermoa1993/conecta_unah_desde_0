// Módulo 4 · Seguridad — catálogo de roles (tabla_grupo_4_roles).

export interface RolSeguridad {
  id_rol: number;
  nombre_rol: string;
  codigo_rol: string;
  descripcion: string | null;
}

export interface RolSeguridadConPermisos extends RolSeguridad {
  permisos: { id_permiso: number; nombre_permiso: string; modulo: string }[];
}

export interface CrearRolSeguridadDto {
  nombre_rol: string;
  codigo_rol: string;
  descripcion?: string;
  permisos?: number[];
}

export interface ActualizarRolSeguridadDto {
  nombre_rol?: string;
  codigo_rol?: string;
  descripcion?: string;
}
