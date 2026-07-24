import { PumitaRepository } from '../../domain/repositories/PumitaRepository';

export class ListarConexiones {
  constructor(private readonly repo: PumitaRepository) {}
  execute(id_usuario: number) {
    return this.repo.listarConexiones(id_usuario);
  }
}