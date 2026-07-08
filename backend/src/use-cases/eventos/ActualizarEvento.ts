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

    const coreFields: (keyof Evento)[] = [
      'titulo', 'descripcion', 'categoria', 'tipo_actividad', 'tipo_evento',
      'fecha_inicio', 'fecha_fin', 'ubicacion', 'enlace_virtual', 'cupo_maximo',
      'duracion_horas', 'tipo_duracion'
    ];
    
    const isActuallyChangingDetails = coreFields.some(key => {
      if (datos[key] === undefined) return false;
      const val1 = datos[key];
      const val2 = evento[key];
      if (!val1 && !val2) return false;
      if (key === 'fecha_inicio' || key === 'fecha_fin') {
        return new Date(val1 as string).getTime() !== new Date(val2 as string).getTime();
      }
      if (key === 'cupo_maximo' || key === 'duracion_horas') {
        return Number(val1) !== Number(val2);
      }
      return val1 !== val2;
    });

    if (isActuallyChangingDetails && ['EN_CURSO', 'EN_CURSO_SALIDA', 'FINALIZADO', 'RECHAZADO'].includes(evento.estado)) {
      throw new Error('No se puede editar un evento en ese estado');
    }

    return this.eventoRepo.update(id, datos);
  }
}
