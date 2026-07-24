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

    // Validación razonable de rango de distancia GPS (<= 3.0 km del punto oficial del evento)
    if (lat && lng && (evento as any).EVENTO_LATITUD && (evento as any).EVENTO_LONGITUD) {
      const eLat = (evento as any).EVENTO_LATITUD;
      const eLng = (evento as any).EVENTO_LONGITUD;
      const dist = getDistanceKm(lat, lng, eLat, eLng);

      if (dist > 3.0) {
        throw new Error(`📍 Te encuentras a ${dist.toFixed(1)} km de la ubicación del evento (máximo permitido: 3.0 km). Por favor acércate al campus/lugar del evento.`);
      }
    }

    await this.repo.registrarAsistencia(id_usuario, id_evento, tipo, lat, lng);
  }
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
