import { PumitaRepository } from '../../domain/repositories/PumitaRepository';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

export class GestionarSolicitud {
  constructor(
    private readonly repo: PumitaRepository,
    private readonly notificacionRepo: NotificacionRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  async enviar(id_solicitante: number, id_receptor: number) {
    if (id_solicitante === id_receptor) {
      throw new Error('No puedes enviarte una solicitud a ti mismo');
    }

    await this.repo.enviarSolicitud(id_solicitante, id_receptor);

    const solicitante = await this.usuarioRepo.findById(id_solicitante);
    if (solicitante) {
      await this.notificacionRepo.crear({
        usuario_id: id_receptor,
        mensaje: `${solicitante.nombre} quiere unirse a tu red`,
        tipo: 'SOLICITUD_PUMITA',
        id_emisor: id_solicitante,
        referencia_tipo: 'PUMITA_SOLICITUD',
        referencia_id: id_solicitante,
      });
    }
  }

  aceptar(id_conexion: number, id_usuario: number) {
    return this.repo.aceptarSolicitud(id_conexion, id_usuario);
  }

  eliminar(id_conexion: number, id_usuario: number) {
    return this.repo.eliminarConexion(id_conexion, id_usuario);
  }
}