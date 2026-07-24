import { PumitaRepository } from '../../domain/repositories/PumitaRepository';

export class ListarSolicitudesPendientes {
  constructor(private readonly repo: PumitaRepository) {}
  execute(id_usuario: number) {
    return this.repo.listarSolicitudesPendientes(id_usuario);
  }
}