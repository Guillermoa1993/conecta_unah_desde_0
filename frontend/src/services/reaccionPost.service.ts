import { api } from './api';

export interface ReaccionPostCount {
  id_evento?: number;
  id_publicacion?: number;
  tipo: string;
  count: number;
}

export interface UserReaccionPost {
  id_evento?: number;
  id_publicacion?: number;
  tipo: string;
}

export interface ReaccionesPostResponse {
  counts: ReaccionPostCount[];
  userReactions: UserReaccionPost[];
}

export const reaccionPostService = {
  getReacciones(): Promise<ReaccionesPostResponse> {
    return api.get<ReaccionesPostResponse>('/reacciones-post');
  },

  guardarReaccion(payload: { id_evento?: number; id_publicacion?: number; tipo: string | null }): Promise<{ ok: boolean }> {
    return api.post<{ ok: boolean }>('/reacciones-post', payload);
  }
};