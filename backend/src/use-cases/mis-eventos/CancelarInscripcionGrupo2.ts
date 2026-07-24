import { Grupo2EventoRepository } from '../../domain/repositories/Grupo2EventoRepository';

export class CancelarInscripcionGrupo2 {
  constructor(private readonly repo: Grupo2EventoRepository) {}

  async execute(id_usuario: number, id_evento: number): Promise<void> {
    if (!id_usuario) throw new Error('El ID de usuario es obligatorio');
    if (!id_evento) throw new Error('El ID de evento es obligatorio');

    const eventos = await this.repo.obtenerEventosDisponibles(id_usuario);
    const evento = eventos.find(e => e.EVENTO_ID === id_evento);

    if (!evento) {
      throw new Error('El evento no existe o no está disponible');
    }

    if (!evento.INSCRITO) {
      throw new Error('El estudiante no está inscrito en este evento');
    }

    await this.repo.cancelarInscripcion(id_usuario, id_evento);
  }
}
