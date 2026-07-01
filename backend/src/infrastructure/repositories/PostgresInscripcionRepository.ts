import { Pool } from 'pg';
import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';
import { Inscripcion, InscripcionDetalle, EstadoInscripcion } from '../../domain/entities/Inscripcion';

export class PostgresInscripcionRepository implements InscripcionRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query('SELECT * FROM inscripciones WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findByEstudiante(estudiante_id: string): Promise<InscripcionDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT i.*, e.titulo AS evento_titulo, e.fecha_inicio AS evento_fecha, e.duracion_horas AS evento_horas
       FROM inscripciones i
       JOIN eventos e ON e.id = i.evento_id
       WHERE i.estudiante_id = $1
       ORDER BY i.fecha_inscripcion DESC`,
      [estudiante_id],
    );
    return rows;
  }

  async findByEvento(evento_id: string): Promise<InscripcionDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT i.*, u.nombre AS estudiante_nombre, u.numero_cuenta AS estudiante_cuenta
       FROM inscripciones i
       JOIN usuarios u ON u.id = i.estudiante_id
       WHERE i.evento_id = $1
       ORDER BY i.fecha_inscripcion ASC`,
      [evento_id],
    );
    return rows;
  }

  async findByEstudianteYEvento(estudiante_id: string, evento_id: string): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM inscripciones WHERE estudiante_id = $1 AND evento_id = $2',
      [estudiante_id, evento_id],
    );
    return rows[0] ?? null;
  }

  async create(estudiante_id: string, evento_id: string): Promise<Inscripcion> {
    const { rows } = await this.pool.query(
      `INSERT INTO inscripciones (estudiante_id, evento_id, estado)
       VALUES ($1, $2, 'CONFIRMADA') RETURNING *`,
      [estudiante_id, evento_id],
    );
    return rows[0];
  }

  async cambiarEstado(id: string, estado: EstadoInscripcion): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query(
      'UPDATE inscripciones SET estado = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id, estado],
    );
    return rows[0] ?? null;
  }

  async cancelar(estudiante_id: string, evento_id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "UPDATE inscripciones SET estado = 'CANCELADA', updated_at = NOW() WHERE estudiante_id = $1 AND evento_id = $2",
      [estudiante_id, evento_id],
    );
    return (rowCount ?? 0) > 0;
  }
}
