import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';
import { EventoRepository } from '../../domain/repositories/EventoRepository';

export class InscribirEstudiante {
  constructor(
    private readonly inscripcionRepo: InscripcionRepository,
    private readonly eventoRepo: EventoRepository,
  ) {}

  async execute(estudiante_id: string, evento_id: string) {
    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');
    if (!['PROGRAMADO', 'EN_CURSO'].includes(evento.estado)) {
      throw new Error('El evento no está disponible para inscripciones');
    }

    const yaInscrito = await this.inscripcionRepo.findByEstudianteYEvento(estudiante_id, evento_id);
    if (yaInscrito && yaInscrito.estado !== 'CANCELADA') {
      throw new Error('Ya estás inscrito en este evento');
    }

    const inscritos = await this.eventoRepo.contarInscripciones(evento_id);
    if (inscritos >= evento.cupo_maximo) throw new Error('El evento está lleno');

    return this.inscripcionRepo.create(estudiante_id, evento_id);
  }
}
