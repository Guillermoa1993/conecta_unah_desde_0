import { PumitaRepository } from '../../domain/repositories/PumitaRepository';

export class ListarSolicitudesEnviadas {
  constructor(private readonly repo: PumitaRepository) {}
  execute(id_usuario: number) {
    return this.repo.listarSolicitudesEnviadas(id_usuario);
  }
}