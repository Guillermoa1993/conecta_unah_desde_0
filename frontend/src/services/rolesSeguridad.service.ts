import { api } from './api';
import type { RolSeguridad, CrearRolSeguridadPayload } from '../types';

export const rolesSeguridadService = {
  getAll(): Promise<RolSeguridad[]> {
    return api.get<RolSeguridad[]>('/seguridad/roles');
  },

  getById(id: number): Promise<RolSeguridad> {
    return api.get<RolSeguridad>(`/seguridad/roles/${id}`);
  },

  crear(payload: CrearRolSeguridadPayload): Promise<RolSeguridad> {
    return api.post<RolSeguridad>('/seguridad/roles', payload);
  },

  actualizar(id: number, payload: Partial<CrearRolSeguridadPayload>): Promise<RolSeguridad> {
    return api.put<RolSeguridad>(`/seguridad/roles/${id}`, payload);
  },

  eliminar(id: number): Promise<void> {
    return api.delete<void>(`/seguridad/roles/${id}`);
  },

  asignarPermiso(idRol: number, idPermiso: number): Promise<RolSeguridad> {
    return api.post<RolSeguridad>(`/seguridad/roles/${idRol}/permisos`, { id_permiso: idPermiso });
  },

  revocarPermiso(idRol: number, idPermiso: number): Promise<RolSeguridad> {
    return api.delete<RolSeguridad>(`/seguridad/roles/${idRol}/permisos/${idPermiso}`);
  },
};
