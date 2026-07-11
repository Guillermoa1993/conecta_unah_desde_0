import { PumitaRepository } from '../../domain/repositories/PumitaRepository';

export class GestionarSolicitud {
  constructor(private readonly repo: PumitaRepository) {}

  enviar(id_solicitante: number, id_receptor: number) {
    if (id_solicitante === id_receptor) {
      throw new Error('No puedes enviarte una solicitud a ti mismo');
    }
    return this.repo.enviarSolicitud(id_solicitante, id_receptor);
  }

  aceptar(id_conexion: number, id_usuario: number) {
    return this.repo.aceptarSolicitud(id_conexion, id_usuario);
  }

  eliminar(id_conexion: number, id_usuario: number) {
    return this.repo.eliminarConexion(id_conexion, id_usuario);
  }
}