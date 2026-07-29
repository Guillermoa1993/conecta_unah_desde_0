import { api } from './api';

export interface CrearComentarioPayload {
  id_evento?: number;
  id_publicacion?: number;
  parent_id?: number;
  reply_to?: string;
  reply_to_text?: string;
  contenido: string;
}

export interface ComentarioResponse {
  id: number;
  author: string;
  authorInitials: string;
  text: string;
  time: string;
  replyTo?: string;
  parentId?: number;
  replyToText?: string;
  id_evento?: number;
  id_publicacion?: number;
  authorPic?: string;
}

export const comentarioService = {
  getComentarios(params?: { id_evento?: number; id_publicacion?: number }): Promise<ComentarioResponse[]> {
    const query = new URLSearchParams();
    if (params?.id_evento) query.set('id_evento', String(params.id_evento));
    if (params?.id_publicacion) query.set('id_publicacion', String(params.id_publicacion));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return api.get<ComentarioResponse[]>(`/comentarios${qs}`);
  },

  crearComentario(payload: CrearComentarioPayload): Promise<ComentarioResponse> {
    return api.post<ComentarioResponse>('/comentarios', payload);
  }
};