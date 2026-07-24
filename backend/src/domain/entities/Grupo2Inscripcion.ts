export interface Grupo2Inscripcion {
  id_inscripcion: number;
  id_usuario: number;
  id_evento: number;
  estado: 'INSCRITO' | 'CANCELADO';
  inscrito_at: Date;
  cancelado_at?: Date;
  asistencia_entrada?: Date;
  asistencia_salida?: Date;
  latitud?: number;
  longitud?: number;
  estado_verificacion: string;
}
