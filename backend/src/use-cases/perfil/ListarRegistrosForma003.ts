import { Forma003Repository } from '../../domain/repositories/Forma003Repository';
import { RegistroForma003 } from '../../domain/entities/RegistroForma003';

export class ListarRegistrosForma003 {
  constructor(private readonly repo: Forma003Repository) {}

  async execute(idUsuario: number): Promise<RegistroForma003[]> {
    return this.repo.listarPorUsuario(idUsuario);
  }
}