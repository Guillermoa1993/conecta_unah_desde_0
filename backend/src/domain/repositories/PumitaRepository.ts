import { Pumita } from '../entities/Pumita';

export interface PumitaRepository {
  listarConexiones(id_usuario: number): Promise<Pumita[]>;
  listarSolicitudesPendientes(id_usuario: number): Promise<Pumita[]>;
  listarSugeridos(id_usuario: number): Promise<Pumita[]>;
  listarSolicitudesEnviadas(id_usuario: number): Promise<Pumita[]>;
  enviarSolicitud(id_solicitante: number, id_receptor: number): Promise<void>;
  aceptarSolicitud(id_conexion: number, id_usuario: number): Promise<void>;
  eliminarConexion(id_conexion: number, id_usuario: number): Promise<void>;
}