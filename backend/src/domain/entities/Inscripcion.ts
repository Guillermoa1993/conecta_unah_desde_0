export type EstadoInscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'ASISTIO' | 'NO_ASISTIO';

export interface Inscripcion {
  id: string;
  estudiante_id: string;
  evento_id: string;
  estado: EstadoInscripcion;
  fecha_inscripcion: Date;
  updated_at: Date;
}

export interface InscripcionDetalle extends Inscripcion {
  evento_titulo?: string;
  evento_fecha?: Date;
  evento_horas?: number;
  estudiante_nombre?: string;
  estudiante_cuenta?: string;
}
