import { Evento, CrearEventoDto, EstadoEvento } from '../entities/Evento';

export interface FiltrosEvento {
  estado?: EstadoEvento;
  tutor_id?: string;
  categoria?: string;
  centro_regional?: string;
  tipo_evento?: string;
  page?: number;
  limit?: number;
}

export interface EventoRepository {
  findById(id: string): Promise<Evento | null>;
  findAll(filtros?: FiltrosEvento): Promise<Evento[]>;
  findByTutor(tutor_id: string): Promise<Evento[]>;
  findPendientesAprobacion(): Promise<Evento[]>;
  create(data: CrearEventoDto): Promise<Evento>;
  update(id: string, data: Partial<Evento>): Promise<Evento | null>;
  cambiarEstado(id: string, estado: EstadoEvento, datos?: { aprobado_por?: string; motivo_rechazo?: string }): Promise<Evento | null>;
  delete(id: string): Promise<boolean>;
  contarInscripciones(evento_id: string): Promise<number>;
}
