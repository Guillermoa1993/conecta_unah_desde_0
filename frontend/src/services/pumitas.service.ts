import { api } from './api';

export interface Pumita {
  id_conexion: number | null;
  id_usuario: number;
  nombre: string;
  estado: 'pendiente' | 'aceptada' | 'bloqueada';
  soy_solicitante: boolean;
}

export const pumitasService = {
  listarConexiones(): Promise<Pumita[]> {
    return api.get<Pumita[]>('/pumitas/conexiones');
  },
  listarPendientes(): Promise<Pumita[]> {
    return api.get<Pumita[]>('/pumitas/pendientes');
  },
  listarSugeridos(): Promise<Pumita[]> {
    return api.get<Pumita[]>('/pumitas/sugeridos');
  },
  listarEnviadas(): Promise<Pumita[]> {
    return api.get<Pumita[]>('/pumitas/enviadas');
  },
  enviarSolicitud(id_usuario: number): Promise<void> {
    return api.post<void>('/pumitas', { id_usuario });
  },
  aceptar(id_conexion: number): Promise<void> {
    return api.patch<void>(`/pumitas/${id_conexion}/aceptar`, {});
  },
  eliminar(id_conexion: number): Promise<void> {
    return api.delete<void>(`/pumitas/${id_conexion}`);
  },
};