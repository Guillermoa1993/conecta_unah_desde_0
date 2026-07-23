import { SolicitudCambioCarrera } from '../../domain/entities/SolicitudCambioCarrera';
import { SolicitudCambioCarreraRepository } from '../../domain/repositories/SolicitudCambioCarreraRepository';

export class ObtenerMiSolicitudCambioCarrera {
  constructor(private readonly repository: SolicitudCambioCarreraRepository) {}
  execute(idUsuario: number): Promise<SolicitudCambioCarrera | null> {
    return this.repository.obtenerPendienteOUltima(idUsuario);
  }
}
