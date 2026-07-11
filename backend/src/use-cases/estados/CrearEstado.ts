import { EstadoRepository } from '../../domain/repositories/EstadoRepository';
import { CrearEstadoDto } from '../../domain/entities/Estado';

export class CrearEstado {
  constructor(private readonly repo: EstadoRepository) {}

  async execute(data: CrearEstadoDto) {
    if (!data.texto_estado && !data.foto_url) {
      throw new Error('El estado debe tener texto o una imagen');
    }
    if (data.foto_url && !data.foto_url.startsWith('data:image/')) {
      throw new Error('Formato de imagen inválido');
    }
    return this.repo.crear(data);
  }
}