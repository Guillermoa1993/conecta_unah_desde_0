export type MetodoRegistro = 'QR' | 'MANUAL';
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDANZA';

export interface Asistencia {
  id: string;
  estudiante_id: string;
  evento_id: string;
  metodo: MetodoRegistro;
  estado: EstadoAsistencia;
  fecha_hora: Date;
  registrado_por?: string;
}

export interface RegistrarAsistenciaDto {
  qr_token: string;
  estudiante_id: string;
}
