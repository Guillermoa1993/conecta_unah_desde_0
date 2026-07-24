import { api } from './api';

export interface Estado {
  id_estado_temporal: number;
  usuario_id_usuario: number; // puedes dejarlo o quitarlo, ya no se usa para nada
  nombre_usuario: string;
  texto_estado?: string;
  foto_url?: string;
  fecha_inicio: string;
  fecha_final: string;
  activo: number;
}
export interface CrearEstadoPayload {
  texto_estado?: string;
  foto_url?: string;
}

export const estadosService = {
  obtenerActivos(): Promise<Estado[]> {
    return api.get<Estado[]>('/estados');
  },
  crear(payload: CrearEstadoPayload): Promise<Estado> {
    return api.post<Estado>('/estados', payload);
  },
};