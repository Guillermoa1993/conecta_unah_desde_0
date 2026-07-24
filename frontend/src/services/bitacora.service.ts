import { api } from './api';

export interface BitacoraEntry {
  id_bitacora: number;
  id_usuario: number;
  usuario?: string;
  correo?: string;
  accion: string;
  fecha: string;
}

export const bitacoraService = {
  listar(limit = 200): Promise<BitacoraEntry[]> {
    return api.get<BitacoraEntry[]>(`/seguridad/bitacora?limit=${limit}`);
  },

  listarPorUsuario(idUsuario: number, limit = 100): Promise<BitacoraEntry[]> {
    return api.get<BitacoraEntry[]>(`/seguridad/bitacora/usuario/${idUsuario}?limit=${limit}`);
  },
};
