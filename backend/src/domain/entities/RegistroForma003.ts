export type EstadoForma003 = 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO';

export interface RegistroForma003 {
  id_registro: number;
  id_usuario: number;
  periodo: string;
  carnet_base64: string;
  forma003_base64: string;
  estado: EstadoForma003;
  id_admin_validador?: number | null;
  comentario_rechazo?: string | null;
  fecha_carga: Date;
  fecha_validacion?: Date | null;
}

export interface CrearForma003Dto {
  id_usuario: number;
  periodo: string;
  carnet_base64: string;
  forma003_base64: string;
}