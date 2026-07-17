import { Grupo2EventoRepository } from '../../domain/repositories/Grupo2EventoRepository';

export class InscribirEventoGrupo2 {
  constructor(private readonly repo: Grupo2EventoRepository) {}

  async execute(id_usuario: number, id_evento: number): Promise<void> {
    if (!id_usuario) throw new Error('El ID de usuario es obligatorio');
    if (!id_evento) throw new Error('El ID de evento es obligatorio');

    // Obtener los eventos para validar cupos y existencia
    const eventos = await this.repo.obtenerEventosDisponibles(id_usuario);
    const evento = eventos.find(e => e.EVENTO_ID === id_evento);

    if (!evento) {
      throw new Error('El evento no existe o no está disponible para inscripción');
    }

    if (evento.INSCRITO) {
      throw new Error('El estudiante ya se encuentra inscrito en este evento');
    }

    if (evento.CUPOS_DISPONIBLES <= 0) {
      throw new Error('No hay cupos disponibles para este evento');
    }

    await this.repo.inscribir(id_usuario, id_evento);
  }
}
