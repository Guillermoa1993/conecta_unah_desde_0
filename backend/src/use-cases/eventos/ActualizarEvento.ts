import { EventoRepository } from '../../domain/repositories/EventoRepository';
import { Evento } from '../../domain/entities/Evento';

export class ActualizarEvento {
  constructor(private readonly eventoRepo: EventoRepository) {}

  async execute(id: string, datos: Partial<Evento>, solicitante_id: string, solicitante_rol: string) {
    const evento = await this.eventoRepo.findById(id);
    if (!evento) throw new Error('Evento no encontrado');

    if (solicitante_rol === 'TUTOR' && evento.tutor_id !== solicitante_id) {
      throw new Error('No tienes permiso para editar este evento');
    }

    if (['EN_CURSO', 'FINALIZADO', 'RECHAZADO'].includes(evento.estado)) {
      throw new Error('No se puede editar un evento en ese estado');
    }

    return this.eventoRepo.update(id, datos);
  }
}
