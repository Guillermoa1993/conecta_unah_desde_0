import { ReaccionPumitaRecibida } from '../../domain/entities/ReaccionPumita';
import { ReaccionPumitaRepository } from '../../domain/repositories/ReaccionPumitaRepository';

export class ListarReaccionesRecibidas {
  constructor(private readonly reaccionRepo: ReaccionPumitaRepository) {}

  execute(id_receptor: number): Promise<ReaccionPumitaRecibida[]> {
    return this.reaccionRepo.listarRecibidas(id_receptor);
  }
}