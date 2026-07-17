import { Grupo2EventoRepository } from '../../domain/repositories/Grupo2EventoRepository';

export class ListarEventosGrupo2 {
  constructor(private readonly repo: Grupo2EventoRepository) {}

  async execute(id_usuario: number): Promise<any[]> {
    if (!id_usuario) {
      throw new Error('El ID de usuario es obligatorio');
    }
    return this.repo.obtenerEventosDisponibles(id_usuario);
  }
}
