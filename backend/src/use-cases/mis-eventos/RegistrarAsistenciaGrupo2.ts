import { Grupo2EventoRepository } from '../../domain/repositories/Grupo2EventoRepository';

export class RegistrarAsistenciaGrupo2 {
  constructor(private readonly repo: Grupo2EventoRepository) {}

  async execute(
    id_usuario: number,
    id_evento: number,
    tipo: 'entrada' | 'salida',
    lat: number,
    lng: number
  ): Promise<void> {
    if (!id_usuario) throw new Error('El ID de usuario es obligatorio');
    if (!id_evento) throw new Error('El ID de evento es obligatorio');
    if (tipo !== 'entrada' && tipo !== 'salida') throw new Error('Tipo de asistencia no válido');

    const eventos = await this.repo.obtenerEventosDisponibles(id_usuario);
    const evento = eventos.find(e => e.EVENTO_ID === id_evento);

    if (!evento) {
      throw new Error('El evento no existe o no está disponible');
    }

    if (!evento.INSCRITO) {
      throw new Error('El estudiante no está inscrito en este evento');
    }

    if (evento.ESTADO_ACTIVIDAD !== 'En curso') {
      throw new Error('El marcaje de asistencia solo está disponible cuando el evento está en curso.');
    }

    if (tipo === 'entrada') {
      if (evento.ASISTENCIA?.entrada) {
        throw new Error('La asistencia de entrada ya ha sido registrada.');
      }
    } else {
      if (!evento.ASISTENCIA?.entrada) {
        throw new Error('Debe registrar la entrada antes de registrar la salida.');
      }
      if (evento.ASISTENCIA?.salida) {
        throw new Error('La asistencia de salida ya ha sido registrada.');
      }
    }

    await this.repo.registrarAsistencia(id_usuario, id_evento, tipo, lat, lng);
  }
}
