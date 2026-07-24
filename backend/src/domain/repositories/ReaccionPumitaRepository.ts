import { ReaccionPumita, ReaccionPumitaRecibida, TipoReaccionPumita } from '../entities/ReaccionPumita';

export interface CrearReaccionPumitaConNotificacionDatos {
  id_emisor: number;
  id_receptor: number;
  tipo: TipoReaccionPumita;
  mensaje: string;
}

export interface ReaccionPumitaRepository {
  crearConNotificacion(datos: CrearReaccionPumitaConNotificacionDatos): Promise<ReaccionPumita>;
  listarRecibidas(id_receptor: number): Promise<ReaccionPumitaRecibida[]>;
}