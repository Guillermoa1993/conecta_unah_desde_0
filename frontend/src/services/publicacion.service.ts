import { api } from './api';

export interface CrearPublicacionPayload {
  title: string;
  desc: string;
  scope: string;
  tags: string[];
  images?: string[];
}

export type EstadoPublicacion = 'pendiente' | 'en_revision_voae' | 'aprobado_voae' | 'publicado' | 'rechazado';

export interface PublicacionResponse {
  id: number;
  author: string;
  initials: string;
  type: 'Publicacion';
  scope: string;
  visibility: string;
  time: string;
  title: string;
  desc: string;
  tags: string[];
  love: number;
  like: number;
  dislike: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  comments: any[];
  userReaction: any;
  saved: boolean;
  hidden: boolean;
  images: string[];
  createdAt: number;
  profilePic?: string;
  estado?: EstadoPublicacion;
  motivoRechazo?: string | null;
}

export const publicacionService = {
  getPublicaciones(): Promise<PublicacionResponse[]> {
    return api.get<PublicacionResponse[]>('/publicaciones');
  },
   
  getPorId(id: string | number): Promise<PublicacionResponse> {
    return api.get<PublicacionResponse>(`/publicaciones/${id}`);
  },

  crearPublicacion(payload: CrearPublicacionPayload): Promise<PublicacionResponse> {
    return api.post<PublicacionResponse>('/publicaciones', payload);
  },

  editarPublicacion(id: number, payload: { desc: string; tags: string[] }): Promise<PublicacionResponse> {
    return api.put<PublicacionResponse>(`/publicaciones/${id}`, payload);
  },

  // ── Coordinación ──
  getPendientesCoordinacion(): Promise<PublicacionResponse[]> {
    return api.get<PublicacionResponse[]>('/publicaciones/pendientes');
  },
  remitirAVoae(id: number): Promise<PublicacionResponse> {
    return api.patch<PublicacionResponse>(`/publicaciones/${id}/remitir-voae`, {});
  },
  getListasParaPublicar(): Promise<PublicacionResponse[]> {
    return api.get<PublicacionResponse[]>('/publicaciones/listas-publicar');
  },
  publicar(id: number): Promise<PublicacionResponse> {
    return api.patch<PublicacionResponse>(`/publicaciones/${id}/publicar`, {});
  },

  // ── VOAE ──
  getPendientesVoae(): Promise<PublicacionResponse[]> {
    return api.get<PublicacionResponse[]>('/publicaciones/pendientes-voae');
  },
  aprobarVoae(id: number): Promise<PublicacionResponse> {
    return api.patch<PublicacionResponse>(`/publicaciones/${id}/aprobar-voae`, {});
  },

  // ── Compartido (Coordinación en su paso, VOAE en el suyo) ──
  rechazar(id: number, motivo: string): Promise<PublicacionResponse> {
    return api.patch<PublicacionResponse>(`/publicaciones/${id}/rechazar`, { motivo });
  },

  // ── Denuncias y Moderación ──
  denunciar(id: number, motivo: string, detalle: string): Promise<any> {
    return api.post<any>(`/publicaciones/${id}/denunciar`, { motivo, detalle });
  },
  getDenunciadas(): Promise<any[]> {
    return api.get<any[]>('/publicaciones/denunciadas');
  },
  eliminarPublicacion(id: number): Promise<any> {
    return api.delete<any>(`/publicaciones/${id}`);
  },
  eliminarDenuncia(idDenuncia: number): Promise<any> {
    return api.delete<any>(`/publicaciones/denuncias/${idDenuncia}`);
  },
  getUsuariosMenciones(): Promise<any[]> {
    return api.get<any[]>('/publicaciones/usuarios/menciones');
  }
};