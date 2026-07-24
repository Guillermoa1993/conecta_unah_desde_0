import { CatalogoCarrera, CatalogoCentroRegional, ContextoAcademicoUsuario } from '../../domain/entities/SolicitudCambioCarrera';
import { SolicitudCambioCarreraRepository } from '../../domain/repositories/SolicitudCambioCarreraRepository';
import { SolicitudCambioCarreraError } from './CrearSolicitudCambioCarrera';

export interface CatalogosCambioCarrera {
  carreras: CatalogoCarrera[];
  centros_regionales: CatalogoCentroRegional[];
  actual: ContextoAcademicoUsuario;
}

export class ObtenerCatalogosCambioCarrera {
  constructor(private readonly repository: SolicitudCambioCarreraRepository) {}
  async execute(idUsuario: number): Promise<CatalogosCambioCarrera> {
    const [carreras, centrosRegionales, actual] = await Promise.all([
      this.repository.listarCarreras(),
      this.repository.listarCentrosRegionales(),
      this.repository.obtenerContextoAcademico(idUsuario),
    ]);
    if (!actual) throw new SolicitudCambioCarreraError(404, 'Usuario no encontrado');
    return { carreras, centros_regionales: centrosRegionales, actual };
  }
}
