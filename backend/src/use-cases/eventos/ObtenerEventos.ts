import { EventoRepository, FiltrosEvento } from '../../domain/repositories/EventoRepository';

export class ObtenerEventos {
  constructor(private readonly eventoRepo: EventoRepository) {}

  async execute(filtros?: FiltrosEvento) {
    if (this.eventoRepo.expirarEventosVencidos) {
      await this.eventoRepo.expirarEventosVencidos().catch(() => null);
    }
    return this.eventoRepo.findAll(filtros);
  }
}
