import { EventoRepository, FiltrosEvento } from '../../domain/repositories/EventoRepository';

export class ObtenerEventos {
  constructor(private readonly eventoRepo: EventoRepository) {}

  async execute(filtros?: FiltrosEvento) {
    return this.eventoRepo.findAll(filtros);
  }
}
