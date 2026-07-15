export type EstadoConstancia = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EMITIDA';

export interface Constancia {
  id: string;
  estudiante_id: string;
  evento_id: string;
  horas_otorgadas: number;
  estado: EstadoConstancia;
  fecha_emision?: Date;
  aprobado_por?: string;
  motivo_rechazo?: string;
  pdf_url?: string;
  created_at: Date;
}

export interface ConstanciaDetalle extends Constancia {
  estudiante_nombre?: string;
  estudiante_cuenta?: string;
  evento_titulo?: string;
  aprobador_nombre?: string;
}
