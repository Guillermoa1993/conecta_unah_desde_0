// Módulo 4 · Seguridad — permisos granulares (tabla_grupo_4_permisos).

export interface PermisoSeguridad {
  id_permiso: number;
  nombre_permiso: string;
  modulo: string;
  descripcion: string | null;
}

export interface CrearPermisoSeguridadDto {
  nombre_permiso: string;
  modulo: string;
  descripcion?: string;
}

export interface ActualizarPermisoSeguridadDto {
  nombre_permiso?: string;
  modulo?: string;
  descripcion?: string;
}
