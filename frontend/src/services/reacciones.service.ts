import { api } from './api';
import type { ReaccionPumita, RespuestaEnviarReaccion, TipoReaccionPumita } from '../types';

export const reaccionesService = {
  enviarReaccion(idReceptor: number, tipo: TipoReaccionPumita): Promise<RespuestaEnviarReaccion> {
    return api.post<RespuestaEnviarReaccion>('/perfil/reacciones', {
      id_receptor: idReceptor,
      tipo,
    });
  },

  listarReaccionesRecibidas(): Promise<ReaccionPumita[]> {
    return api.get<ReaccionPumita[]>('/perfil/reacciones/recibidas');
  },
};