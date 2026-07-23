import { api } from './api';
import type {
  UsuarioSeguridad,
  CrearUsuarioSeguridadPayload,
  ActualizarUsuarioSeguridadPayload,
} from '../types';

interface FiltrosUsuarioSeguridad {
  busqueda?: string;
  estado?: number;
}

function buildQuery(filtros?: FiltrosUsuarioSeguridad): string {
  if (!filtros) return '';
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export const usuariosSeguridadService = {
  getAll(filtros?: FiltrosUsuarioSeguridad): Promise<UsuarioSeguridad[]> {
    return api.get<UsuarioSeguridad[]>(`/seguridad/usuarios${buildQuery(filtros)}`);
  },

  getById(id: number): Promise<UsuarioSeguridad> {
    return api.get<UsuarioSeguridad>(`/seguridad/usuarios/${id}`);
  },

  crear(payload: CrearUsuarioSeguridadPayload): Promise<UsuarioSeguridad> {
    return api.post<UsuarioSeguridad>('/seguridad/usuarios', payload);
  },

  actualizar(id: number, payload: ActualizarUsuarioSeguridadPayload): Promise<UsuarioSeguridad> {
    return api.put<UsuarioSeguridad>(`/seguridad/usuarios/${id}`, payload);
  },

  inhabilitar(id: number, motivo: string): Promise<UsuarioSeguridad> {
    return api.patch<UsuarioSeguridad>(`/seguridad/usuarios/${id}/inhabilitar`, { motivo });
  },

  habilitar(id: number): Promise<UsuarioSeguridad> {
    return api.patch<UsuarioSeguridad>(`/seguridad/usuarios/${id}/habilitar`);
  },

  asignarRol(idUsuario: number, idRol: number): Promise<UsuarioSeguridad> {
    return api.post<UsuarioSeguridad>(`/seguridad/usuarios/${idUsuario}/roles`, { id_rol: idRol });
  },

  revocarRol(idUsuario: number, idRol: number): Promise<UsuarioSeguridad> {
    return api.delete<UsuarioSeguridad>(`/seguridad/usuarios/${idUsuario}/roles/${idRol}`);
  },

  asignarPermiso(idUsuario: number, idPermiso: number): Promise<UsuarioSeguridad> {
    return api.post<UsuarioSeguridad>(`/seguridad/usuarios/${idUsuario}/permisos`, { id_permiso: idPermiso });
  },

  revocarPermiso(idUsuario: number, idPermiso: number): Promise<UsuarioSeguridad> {
    return api.delete<UsuarioSeguridad>(`/seguridad/usuarios/${idUsuario}/permisos/${idPermiso}`);
  },
};
