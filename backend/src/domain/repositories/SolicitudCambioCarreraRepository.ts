import {
  CatalogoCarrera,
  CatalogoCentroRegional,
  ContextoAcademicoUsuario,
  SolicitudCambioCarrera,
} from '../entities/SolicitudCambioCarrera';

export interface CrearSolicitudCambioCarreraDatos {
  id_usuario: number;
  id_carrera_actual: number;
  id_carrera_solicitada: number;
  id_centro_regional_solicitado: number;
  motivo: string;
}

export interface SolicitudCambioCarreraRepository {
  obtenerContextoAcademico(idUsuario: number): Promise<ContextoAcademicoUsuario | null>;
  existeCarrera(idCarrera: number): Promise<boolean>;
  existeCentroRegional(idCentro: number): Promise<boolean>;
  obtenerPendiente(idUsuario: number): Promise<SolicitudCambioCarrera | null>;
  crear(datos: CrearSolicitudCambioCarreraDatos): Promise<SolicitudCambioCarrera>;
  obtenerPendienteOUltima(idUsuario: number): Promise<SolicitudCambioCarrera | null>;
  listarCarreras(): Promise<CatalogoCarrera[]>;
  listarCentrosRegionales(): Promise<CatalogoCentroRegional[]>;
}
