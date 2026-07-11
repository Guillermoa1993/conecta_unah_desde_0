import { PumitaRepository } from '../../domain/repositories/PumitaRepository';

export class ListarSugeridos {
  constructor(private readonly repo: PumitaRepository) {}
  execute(id_usuario: number) {
    return this.repo.listarSugeridos(id_usuario);
  }
}