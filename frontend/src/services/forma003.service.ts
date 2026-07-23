import { api } from './api';

export type EstadoForma003 = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';

export interface RegistroForma003 {
  id_registro: number;
  id_usuario: number;
  periodo: string;
  estado: EstadoForma003;
  fecha_carga: string;
  fecha_validacion?: string | null;
  comentario_rechazo?: string | null;
}

export const forma003Service = {
  listarMios(): Promise<RegistroForma003[]> {
    return api.get('/forma003/mios');
  },

  crear(payload: { periodo: string; carnet_base64: string; forma003_base64: string }): Promise<RegistroForma003> {
    return api.post('/forma003', payload);
  },

  actualizarArchivo(idRegistro: number, forma003_base64: string): Promise<RegistroForma003> {
    return api.put(`/forma003/${idRegistro}/archivo`, { forma003_base64 });
  },
};