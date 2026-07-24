import { api } from './api';

export interface AsistenciaGrupo2Info {
  entrada: string;
  salida?: string;
  lat: number;
  lng: number;
  estadoVerificacion: 'Pendiente de verificación' | 'Verificado';
}

export interface EventoGrupo2 {
  EVENTO_ID: number;
  TITULO_EVENTO: string;
  DESCRIPCION: string;
  ESTADO_ACTIVIDAD: 'Programado' | 'En curso' | 'Finalizado' | '';
  INSCRITO: boolean;
  CUPOS_DISPONIBLES: number;
  FECHA: string;
  INSTRUCTOR: string;
  AVATAR_URL?: string;
  HORARIO?: string;
  HORAS_VOAE?: number;
  UBICACION?: string;
  Categoria?: string;
  ASISTENCIA?: AsistenciaGrupo2Info;
}

export const grupo2EventosService = {
  obtenerMisEventos(): Promise<EventoGrupo2[]> {
    return api.get<EventoGrupo2[]>('/grupo2/mis-eventos');
  },

  inscribir(idEvento: number): Promise<{ message: string }> {
    return api.post(`/grupo2/mis-eventos/${idEvento}/inscribir`, {});
  },

  cancelar(idEvento: number): Promise<{ message: string }> {
    return api.post(`/grupo2/mis-eventos/${idEvento}/cancelar`, {});
  },

  registrarAsistencia(
    idEvento: number,
    payload: { tipo: 'entrada' | 'salida'; lat: number; lng: number },
  ): Promise<{ message: string }> {
    return api.post(`/grupo2/mis-eventos/${idEvento}/asistencia`, payload);
  },
};
