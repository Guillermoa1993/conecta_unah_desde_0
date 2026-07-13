import { Pool } from 'pg';
import { EstadoRepository } from '../../domain/repositories/EstadoRepository';
import { Estado, CrearEstadoDto } from '../../domain/entities/Estado';

export class PostgresEstadoRepository implements EstadoRepository {
  constructor(private readonly pool: Pool) {}

  async crear(data: CrearEstadoDto): Promise<Estado> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_2_estado_temporal
        (id_usuario, foto_url, texto_estado, fecha_final)
       VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')
       RETURNING *`,
      [data.id_usuario, data.foto_url ?? null, data.texto_estado ?? null],
    );
    return rows[0];
  }

  async obtenerActivos(): Promise<Estado[]> {
    const { rows } = await this.pool.query(
      `SELECT e.*, u.nombre AS nombre_usuario
       FROM tabla_grupo_2_estado_temporal e
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = e.id_usuario
       WHERE e.activo = 1 AND e.fecha_final > NOW()
       ORDER BY e.fecha_inicio DESC`,
    );
    return rows;
  }
}