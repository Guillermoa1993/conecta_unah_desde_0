import { Pool } from 'pg';
import { ConstanciaRepository } from '../../domain/repositories/ConstanciaRepository';
import { Constancia, ConstanciaDetalle, EstadoConstancia } from '../../domain/entities/Constancia';

export class PostgresConstanciaRepository implements ConstanciaRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string | number): Promise<Constancia | null> {
    const { rows } = await this.pool.query('SELECT * FROM tabla_grupo_3_constancias WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findByEstudiante(estudiante_id: string | number): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, SPLIT_PART(u.correo, '@', 1) AS estudiante_cuenta,
              e.titulo AS evento_titulo
       FROM tabla_grupo_3_constancias c
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = c.estudiante_id
       JOIN tabla_grupo_3_eventos e ON e.id = c.evento_id
       WHERE c.estudiante_id = $1
       ORDER BY c.created_at DESC`,
      [estudiante_id],
    );
    return rows;
  }

  async findByEvento(evento_id: string | number): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, SPLIT_PART(u.correo, '@', 1) AS estudiante_cuenta
       FROM tabla_grupo_3_constancias c
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = c.estudiante_id
       WHERE c.evento_id = $1
       ORDER BY c.created_at DESC`,
      [evento_id],
    );
    return rows;
  }

  async findPendientes(): Promise<ConstanciaDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT c.*, u.nombre AS estudiante_nombre, SPLIT_PART(u.correo, '@', 1) AS estudiante_cuenta,
              e.titulo AS evento_titulo
       FROM tabla_grupo_3_constancias c
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = c.estudiante_id
       JOIN tabla_grupo_3_eventos e ON e.id = c.evento_id
       WHERE c.estado = 'PENDIENTE'
       ORDER BY c.created_at ASC`,
    );
    return rows;
  }

  async create(estudiante_id: string | number, evento_id: string | number, horas: number): Promise<Constancia> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_3_constancias (estudiante_id, evento_id, horas_otorgadas, estado)
       VALUES ($1, $2, $3, 'PENDIENTE') RETURNING *`,
      [estudiante_id, evento_id, horas],
    );
    return rows[0];
  }

  async cambiarEstado(id: string | number, estado: EstadoConstancia, datos?: { aprobado_por?: string | number; motivo_rechazo?: string; pdf_url?: string }): Promise<Constancia | null> {
    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_3_constancias SET estado = $2, aprobado_por = $3, motivo_rechazo = $4,
              pdf_url = $5, fecha_emision = CASE WHEN $2 = 'APROBADA' THEN NOW() ELSE fecha_emision END
       WHERE id = $1 RETURNING *`,
      [id, estado, datos?.aprobado_por ?? null, datos?.motivo_rechazo ?? null, datos?.pdf_url ?? null],
    );
    return rows[0] ?? null;
  }
}
