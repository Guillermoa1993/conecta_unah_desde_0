import { api } from './api';

export type TipoSancion = 'suspension_72h' | 'shadowban' | 'bloqueo_permanente';

export interface ReporteModeracion {
  id_reporte: number;
  tipo_reporte: 'comentario' | 'publicacion';
  id_comentario?: number;
  id_publicacion?: number;
  contenido: string;
  titulo_publicacion?: string;
  autor: string;
  id_usuario_autor: number;
  id_usuario_reporta: number;
  usuario_reporta: string;
  motivo: string;
  estado: 'pendiente' | 'aprobado' | 'descartado';
  fecha_creacion: string;
}

export interface EstadoModeracion {
  bloqueado: boolean;
  suspendidoHasta: string | null;
  shadowbanned: boolean;
}

export const moderacionService = {
  reportarComentario(idComentario: number, motivo: string): Promise<{ ok: boolean; mensaje: string }> {
    return api.post('/moderacion/reportes', { id_comentario: idComentario, motivo });
  },

  reportarPublicacion(idPublicacion: number, motivo: string): Promise<{ ok: boolean; mensaje: string }> {
    return api.post('/moderacion/reportes', { id_publicacion: idPublicacion, motivo });
  },

  listarReportesPendientes(): Promise<ReporteModeracion[]> {
    return api.get<ReporteModeracion[]>('/moderacion/reportes');
  },

  aprobarReporte(idReporte: number): Promise<{ ok: boolean; tipoSancion: TipoSancion; nivel: number }> {
    return api.post(`/moderacion/reportes/${idReporte}/aprobar`, {});
  },

  descartarReporte(idReporte: number): Promise<{ ok: boolean }> {
    return api.post(`/moderacion/reportes/${idReporte}/descartar`, {});
  },

  miEstado(): Promise<EstadoModeracion> {
    return api.get<EstadoModeracion>('/moderacion/mi-estado');
  },
};