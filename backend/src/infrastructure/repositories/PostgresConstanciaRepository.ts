import { Pool } from 'pg';
import { ConstanciaRepository } from '../../domain/repositories/ConstanciaRepository';
import { Constancia, ConstanciaDetalle, EstadoConstancia } from '../../domain/entities/Constancia';

export class PostgresConstanciaRepository implements ConstanciaRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Constancia | null> {
    const { rows } = await this.pool.query('SELECT * FROM constancias WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findByEstudiante(estudiante_id: string): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, u.numero_cuenta AS estudiante_cuenta,
              e.titulo AS evento_titulo
       FROM constancias c
       JOIN usuarios u ON u.id = c.estudiante_id
       JOIN eventos e ON e.id = c.evento_id
       WHERE c.estudiante_id = $1
       ORDER BY c.created_at DESC`,
      [estudiante_id],
    );
    return rows;
  }

  async findByEvento(evento_id: string): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, u.numero_cuenta AS estudiante_cuenta
       FROM constancias c
       JOIN usuarios u ON u.id = c.estudiante_id
       WHERE c.evento_id = $1
       ORDER BY c.created_at DESC`,
      [evento_id],
    );
    return rows;
  }

  async findPendientes(): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, u.numero_cuenta AS estudiante_cuenta,
              e.titulo AS evento_titulo
       FROM constancias c
       JOIN usuarios u ON u.id = c.estudiante_id
       JOIN eventos e ON e.id = c.evento_id
       WHERE c.estado = 'PENDIENTE'
       ORDER BY c.created_at ASC`,
    );
    return rows;
  }

  async create(estudiante_id: string, evento_id: string, horas: number): Promise<Constancia> {
    const { rows } = await this.pool.query(
      `INSERT INTO constancias (estudiante_id, evento_id, horas_otorgadas, estado)
       VALUES ($1, $2, $3, 'PENDIENTE') RETURNING *`,
      [estudiante_id, evento_id, horas],
    );
    return rows[0];
  }

  async cambiarEstado(id: string, estado: EstadoConstancia, datos?: { aprobado_por?: string; motivo_rechazo?: string; pdf_url?: string }): Promise<Constancia | null> {
    const { rows } = await this.pool.query(
      `UPDATE constancias SET estado = $2, aprobado_por = $3, motivo_rechazo = $4,
              pdf_url = $5, fecha_emision = CASE WHEN $2 = 'APROBADA' THEN NOW() ELSE fecha_emision END
       WHERE id = $1 RETURNING *`,
      [id, estado, datos?.aprobado_por ?? null, datos?.motivo_rechazo ?? null, datos?.pdf_url ?? null],
    );
    return rows[0] ?? null;
  }
}
