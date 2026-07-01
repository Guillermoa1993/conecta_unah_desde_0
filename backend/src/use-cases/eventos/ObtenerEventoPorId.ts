import { EventoRepository } from '../../domain/repositories/EventoRepository';

export class ObtenerEventoPorId {
  constructor(private readonly eventoRepo: EventoRepository) {}

  async execute(id: string) {
    const evento = await this.eventoRepo.findById(id);
    if (!evento) throw new Error('Evento no encontrado');
    return evento;
  }
}
