import { EventoRepository } from '../../domain/repositories/EventoRepository';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

export class AprobarRechazarEvento {
  constructor(
    private readonly eventoRepo: EventoRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async aprobar(evento_id: string, aprobado_por: string, rol_aprobador?: string) {
    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');

    const estadoActual = evento.estado;
    if (estadoActual === 'PROGRAMADO') {
      return evento;
    }
    const esPendienteDepto = estadoActual === 'PENDIENTE_APROBACION_DEPTO' || estadoActual === 'PENDIENTE_APROBACION' || estadoActual === 'BORRADOR';

    const rolUpper = (rol_aprobador || '').toUpperCase();
    const esDepto = rolUpper.includes('DEPTO') || rolUpper.includes('DEPARTAMENTO') || rolUpper.includes('COORDINACION');
    const evAny = evento as any;
    const isRecreativo =
      evAny.tipo_evento === 'RECREACION' ||
      evAny.tipo_evento === 'SIN_HORAS' ||
      evAny.categoria === 'RECREACION' ||
      Number(evAny.duracion_horas || 0) === 0;

    // Si es evento Recreativo O si es aprobación por Dirección VOAE -> pasa directamente a PROGRAMADO
    if (isRecreativo || (!esPendienteDepto && !esDepto)) {
      const actualizado = await this.eventoRepo.cambiarEstado(evento_id, 'PROGRAMADO', { aprobado_por });

      try {
        await this.notificacionRepo.crear({
          usuario_id: Number(evento.tutor_id),
          mensaje: isRecreativo
            ? `Tu evento recreativo "${evento.titulo}" fue aprobado por Coordinación de Departamento y ya está publicado.`
            : `Tu evento "${evento.titulo}" fue aprobado por Dirección VOAE y ya está publicado.`,
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
            }).catch(() => null),
          ),
        );
      } catch (e) {
        console.warn("⚠️ Aviso: No se pudo enviar la notificacion por email/sistema pero el evento fue aprobado con éxito.", e);
      }

      return actualizado;
    }

    // Para eventos con horas VOAE aprobados por primera vez por Coordinación Depto -> pasa a PENDIENTE_APROBACION_VOAE
    const actualizado = await this.eventoRepo.cambiarEstado(evento_id, 'PENDIENTE_APROBACION_VOAE', { aprobado_por });
    try {
      await this.notificacionRepo.crear({
        usuario_id: Number(evento.tutor_id),
        mensaje: `Tu evento "${evento.titulo}" fue aprobado por Coordinación de Departamento y enviado a Dirección VOAE.`,
        tipo: 'EVENTO_APROBADO_DEPTO',
      });
    } catch (e) {
      console.warn("⚠️ Aviso: No se pudo enviar la notificacion pero el evento fue aprobado con éxito.", e);
    }
    return actualizado;
  }

  async rechazar(evento_id: string, aprobado_por: string, motivo_rechazo: string, rol_aprobador?: string) {
    if (!motivo_rechazo?.trim()) throw new Error('El motivo de rechazo es obligatorio');

    const evento = await this.eventoRepo.findById(evento_id);
    if (!evento) throw new Error('Evento no encontrado');

    const estadoActual = evento.estado;
    const esPendiente = estadoActual === 'PENDIENTE_APROBACION_DEPTO' || 
                        estadoActual === 'PENDIENTE_APROBACION_VOAE' || 
                        estadoActual === 'PENDIENTE_APROBACION';

    if (!esPendiente) throw new Error('El evento no está pendiente de aprobación');

    const rolUpper = (rol_aprobador || '').toUpperCase();
    const esDepto = rolUpper.includes('DEPTO') || rolUpper.includes('DEPARTAMENTO') || rolUpper.includes('COORDINACION');
    const esPendienteDepto = estadoActual === 'PENDIENTE_APROBACION_DEPTO' || estadoActual === 'PENDIENTE_APROBACION';

    const fueRechazadoPorDepto = esPendienteDepto || esDepto;
    const motivoFinal = fueRechazadoPorDepto ? `[DEPTO] ${motivo_rechazo.trim()}` : `[VOAE] ${motivo_rechazo.trim()}`;

    const actualizado = await this.eventoRepo.cambiarEstado(evento_id, 'RECHAZADO', { aprobado_por, motivo_rechazo: motivoFinal });

    await this.notificacionRepo.crear({
      usuario_id: Number(evento.tutor_id),
      mensaje: `Tu evento "${evento.titulo}" fue rechazado. Motivo: ${motivo_rechazo}`,
      tipo: 'EVENTO_RECHAZADO',
    });

    return actualizado;
  }
}