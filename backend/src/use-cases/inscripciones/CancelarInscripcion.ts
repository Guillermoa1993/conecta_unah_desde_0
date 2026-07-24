import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';

export class CancelarInscripcion {
  constructor(private readonly inscripcionRepo: InscripcionRepository) {}

  async execute(estudiante_id: string, evento_id: string) {
    const inscripcion = await this.inscripcionRepo.findByEstudianteYEvento(estudiante_id, evento_id);
    if (!inscripcion) throw new Error('No estás inscrito en este evento');
    if (inscripcion.estado === 'CANCELADA') throw new Error('La inscripción ya fue cancelada');

    return this.inscripcionRepo.cancelar(estudiante_id, evento_id);
  }
}
