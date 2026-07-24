import { EventoRepository } from '../../domain/repositories/EventoRepository';
import { CrearEventoDto } from '../../domain/entities/Evento';

export class CrearEvento {
  constructor(private readonly eventoRepo: EventoRepository) {}

  async execute(datos: CrearEventoDto) {
    if (!datos.titulo?.trim()) throw new Error('El título es obligatorio');
    if (!datos.fecha_inicio || !datos.fecha_fin) throw new Error('Las fechas son obligatorias');
    if (new Date(datos.fecha_inicio) > new Date(datos.fecha_fin)) {
      throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    if (datos.cupo_maximo < 1) throw new Error('El cupo mínimo es 1');

    return this.eventoRepo.create(datos);
  }
}
