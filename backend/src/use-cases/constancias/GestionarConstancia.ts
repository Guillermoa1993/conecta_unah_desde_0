import { ConstanciaRepository } from '../../domain/repositories/ConstanciaRepository';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { EventoRepository } from '../../domain/repositories/EventoRepository';

export class GestionarConstancia {
  constructor(
    private readonly constanciaRepo: ConstanciaRepository,
    private readonly eventoRepo: EventoRepository,
    private readonly notificacionRepo: NotificacionRepository,
  ) {}

  async solicitarConstancia(estudiante_id: string, evento_id: string) {
    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');
    if (evento.tipo_evento !== 'HORAS_VOAE') throw new Error('Este evento no otorga horas VOAE');
    if (evento.estado !== 'FINALIZADO') throw new Error('El evento aún no ha finalizado');

    return this.constanciaRepo.create(estudiante_id, evento_id, evento.duracion_horas);
  }

  async aprobarConstancia(constancia_id: string, aprobado_por: string) {
    const constancia = await this.constanciaRepo.findById(constancia_id);
    if (!constancia) throw new Error('Constancia no encontrada');
    if (constancia.estado !== 'PENDIENTE') throw new Error('Solo se pueden aprobar constancias pendientes');

    const actualizada = await this.constanciaRepo.cambiarEstado(constancia_id, 'APROBADA', { aprobado_por });

    await this.notificacionRepo.crear({
      usuario_id: Number(constancia.estudiante_id),
      mensaje: 'Tu constancia de horas VOAE fue aprobada y está lista para descarga.',
      tipo: 'CONSTANCIA_EMITIDA',
    });

    return actualizada;
  }

  async rechazarConstancia(constancia_id: string, aprobado_por: string, motivo: string) {
    if (!motivo?.trim()) throw new Error('El motivo de rechazo es obligatorio');

    const constancia = await this.constanciaRepo.findById(constancia_id);
    if (!constancia) throw new Error('Constancia no encontrada');

    return this.constanciaRepo.cambiarEstado(constancia_id, 'RECHAZADA', {
      aprobado_por,
      motivo_rechazo: motivo,
    });
  }
}
