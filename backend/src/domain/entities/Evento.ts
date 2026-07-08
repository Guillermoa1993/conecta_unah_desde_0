export type CategoriaEvento = 'ACADEMICO' | 'CULTURAL' | 'DEPORTIVO' | 'SOCIAL';
export type TipoActividad = 'Presencial' | 'Virtual' | 'Híbrido';
export type TipoEvento = 'HORAS_VOAE' | 'RECREACION';
export type VisibilidadEvento = 'PUBLICO' | 'PRIVADO';
export type EstadoEvento =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'PROGRAMADO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'RECHAZADO';
export type TipoDuracion = 'TOTALES' | 'DIARIAS';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  tipo_actividad: TipoActividad;
  tipo_evento: TipoEvento;
  visibilidad: VisibilidadEvento;
  estado: EstadoEvento;
  centro_regional: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  enlace_virtual?: string;
  cupo_maximo: number;
  duracion_horas: number;
  tipo_duracion: TipoDuracion;
  requiere_inscripcion: boolean;
  portada_url?: string;
  tutor_id: string;
  aprobado_por?: string;
  motivo_rechazo?: string;
  created_at: Date;
  updated_at: Date;
  inscritos_count?: number;
  asistencias_count?: number;
  distribucion_horas?: { categoria: string; horas: number }[];
}

export interface CrearEventoDto {
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  tipo_actividad: TipoActividad;
  tipo_evento: TipoEvento;
  visibilidad: VisibilidadEvento;
  centro_regional: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  enlace_virtual?: string;
  cupo_maximo: number;
  duracion_horas: number;
  tipo_duracion: TipoDuracion;
  requiere_inscripcion: boolean;
  portada_url?: string;
  tutor_id: string;
}
