import { Inscripcion, InscripcionDetalle, EstadoInscripcion } from '../entities/Inscripcion';

export interface InscripcionRepository {
  findById(id: string): Promise<Inscripcion | null>;
  findByEstudiante(estudiante_id: string): Promise<InscripcionDetalle[]>;
  findByEvento(evento_id: string): Promise<InscripcionDetalle[]>;
  findByEstudianteYEvento(estudiante_id: string, evento_id: string): Promise<Inscripcion | null>;
  create(estudiante_id: string, evento_id: string): Promise<Inscripcion>;
  cambiarEstado(id: string, estado: EstadoInscripcion): Promise<Inscripcion | null>;
  cancelar(estudiante_id: string, evento_id: string): Promise<boolean>;
}
