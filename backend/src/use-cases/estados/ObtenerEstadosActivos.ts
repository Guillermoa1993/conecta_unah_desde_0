import { EstadoRepository } from '../../domain/repositories/EstadoRepository';

export class ObtenerEstadosActivos {
  constructor(private readonly repo: EstadoRepository) {}

  execute() {
    return this.repo.obtenerActivos();
  }
}