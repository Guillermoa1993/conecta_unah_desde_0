import { Constancia, ConstanciaDetalle, EstadoConstancia } from '../entities/Constancia';

export interface ConstanciaRepository {
  findById(id: string): Promise<Constancia | null>;
  findByEstudiante(estudiante_id: string): Promise<ConstanciaDetalle[]>;
  findByEvento(evento_id: string): Promise<ConstanciaDetalle[]>;
  findPendientes(): Promise<ConstanciaDetalle[]>;
  create(estudiante_id: string, evento_id: string, horas: number): Promise<Constancia>;
  cambiarEstado(id: string, estado: EstadoConstancia, datos?: { aprobado_por?: string; motivo_rechazo?: string; pdf_url?: string }): Promise<Constancia | null>;
}
