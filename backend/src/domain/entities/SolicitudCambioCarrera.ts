export type EstadoSolicitudCambioCarrera = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface CatalogoCarrera {
  id_carrera: number;
  nombre: string;
}

export interface CatalogoCentroRegional {
  id_centro_regional: number;
  nombre: string;
  codigo: string | null;
}

export interface ContextoAcademicoUsuario {
  id_usuario: number;
  id_carrera_actual: number | null;
  carrera_actual: string | null;
  id_centro_actual: number | null;
  centro_actual: string | null;
}

export interface SolicitudCambioCarrera {
  id_solicitud: number;
  id_usuario: number;
  id_carrera_actual: number | null;
  carrera_actual: string | null;
  id_carrera_solicitada: number;
  carrera_solicitada: string;
  id_centro_regional_solicitado: number | null;
  centro_regional_solicitado: string | null;
  motivo: string;
  estado: EstadoSolicitudCambioCarrera;
  comentario_revision: string | null;
  id_revisor: number | null;
  fecha_creacion: Date;
  fecha_revision: Date | null;
}
