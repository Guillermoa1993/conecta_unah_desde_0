import { api } from './api';

export type EstadoSolicitudCambioCarrera = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface CarreraCambioCarrera {
  id_carrera: number;
  nombre: string;
}

export interface CentroRegionalCambioCarrera {
  id_centro_regional: number;
  nombre: string;
  codigo: string | null;
}

export interface ContextoActualCambioCarrera {
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
  fecha_creacion: string;
  fecha_revision: string | null;
}

export interface CatalogosCambioCarreraResponse {
  carreras: CarreraCambioCarrera[];
  centros_regionales: CentroRegionalCambioCarrera[];
  actual: ContextoActualCambioCarrera;
}

export interface CrearSolicitudCambioCarreraPayload {
  id_carrera_solicitada: number;
  id_centro_regional_solicitado: number;
  motivo: string;
}

export const cambioCarreraService = {
  obtenerCatalogos(): Promise<CatalogosCambioCarreraResponse> {
    return api.get('/solicitudes-cambio-carrera/catalogos');
  },
  obtenerMiSolicitud(): Promise<{ solicitud: SolicitudCambioCarrera | null }> {
    return api.get('/solicitudes-cambio-carrera/mia');
  },
  crear(payload: CrearSolicitudCambioCarreraPayload): Promise<{ solicitud: SolicitudCambioCarrera }> {
    return api.post('/solicitudes-cambio-carrera', payload);
  },
};
