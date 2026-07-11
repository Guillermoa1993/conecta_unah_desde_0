import { Estado, CrearEstadoDto } from '../entities/Estado';

export interface EstadoRepository {
  crear(data: CrearEstadoDto): Promise<Estado>;
  obtenerActivos(): Promise<Estado[]>;
}