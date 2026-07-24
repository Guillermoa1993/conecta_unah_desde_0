import { EventoRepository } from '../../domain/repositories/EventoRepository';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

export class AprobarRechazarEvento {
  constructor(
    private readonly eventoRepo: EventoRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async aprobar(evento_id: string, aprobado_por: string) {
    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');
    if (evento.estado !== 'PENDIENTE_APROBACION') throw new Error('El evento no está pendiente de aprobación');

    const actualizado = await this.eventoRepo.cambiarEstado(evento_id, 'PROGRAMADO', { aprobado_por });

    await this.notificacionRepo.crear({
      usuario_id: Number(evento.tutor_id),
      mensaje: `Tu evento "${evento.titulo}" fue aprobado y ya está publicado.`,
      tipo: 'EVENTO_APROBADO',
    });

    // Avisar a todos los estudiantes que hay un evento nuevo disponible
    const estudiantes = await this.usuarioRepo.findAll({ rol: 'ESTUDIANTE' });
    await Promise.all(
      estudiantes.map((estudiante) =>
        this.notificacionRepo.crear({
          usuario_id: estudiante.id_usuario,
          mensaje: `Nuevo evento disponible: "${evento.titulo}"`,
          tipo: 'EVENTO_DISPONIBLE',
          referencia_tipo: 'EVENTO',
          referencia_id: Number(evento.id),
        }),
      ),
    );

    return actualizado;
  }

  async rechazar(evento_id: string, aprobado_por: string, motivo_rechazo: string) {
    if (!motivo_rechazo?.trim()) throw new Error('El motivo de rechazo es obligatorio');

    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');
    if (evento.estado !== 'PENDIENTE_APROBACION') throw new Error('El evento no está pendiente de aprobación');

    const actualizado = await this.eventoRepo.cambiarEstado(evento_id, 'RECHAZADO', { aprobado_por, motivo_rechazo });

    await this.notificacionRepo.crear({
      usuario_id: Number(evento.tutor_id),
      mensaje: `Tu evento "${evento.titulo}" fue rechazado. Motivo: ${motivo_rechazo}`,
      tipo: 'EVENTO_RECHAZADO',
    });

    return actualizado;
  }
}