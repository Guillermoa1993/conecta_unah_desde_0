import { Pool } from 'pg';
import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';
import { Inscripcion, InscripcionDetalle, EstadoInscripcion } from '../../domain/entities/Inscripcion';

export class PostgresInscripcionRepository implements InscripcionRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string | number): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query('SELECT * FROM tabla_grupo_3_inscripcion WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findByEstudiante(estudiante_id: string | number): Promise<InscripcionDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT i.*, e.titulo AS evento_titulo, e.fecha_inicio AS evento_fecha, e.duracion_horas AS evento_horas
       FROM tabla_grupo_3_inscripcion i
       JOIN tabla_grupo_3_eventos e ON e.id = i.evento_id
       WHERE i.estudiante_id = $1
       ORDER BY i.inscrito_at DESC`,
      [estudiante_id],
    );
    return rows;
  }

  async findByEvento(evento_id: string | number): Promise<InscripcionDetalle[]> {
    const { rows } = await this.pool.query(
      `SELECT i.*, u.nombre AS estudiante_nombre, SPLIT_PART(u.correo, '@', 1) AS estudiante_cuenta
       FROM tabla_grupo_3_inscripcion i
       JOIN tabla_grupo_1_usuario u ON u.id_usuario = i.estudiante_id
       WHERE i.evento_id = $1
       ORDER BY i.inscrito_at ASC`,
      [evento_id],
    );
    return rows;
  }

  async findByEstudianteYEvento(estudiante_id: string | number, evento_id: string | number): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM tabla_grupo_3_inscripcion WHERE estudiante_id = $1 AND evento_id = $2',
      [estudiante_id, evento_id],
    );
    return rows[0] ?? null;
  }

  async create(estudiante_id: string | number, evento_id: string | number): Promise<Inscripcion> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_3_inscripcion (estudiante_id, evento_id, estado)
       VALUES ($1, $2, 'INSCRITO') RETURNING *`,
      [estudiante_id, evento_id],
    );
    return rows[0];
  }

  async cambiarEstado(id: string | number, estado: EstadoInscripcion): Promise<Inscripcion | null> {
    const { rows } = await this.pool.query(
      "UPDATE tabla_grupo_3_inscripcion SET estado = $2, inscrito_at = CASE WHEN $2 = 'INSCRITO' THEN NOW() ELSE inscrito_at END WHERE id = $1 RETURNING *",
      [id, estado],
    );
    return rows[0] ?? null;
  }

  async cancelar(estudiante_id: string | number, evento_id: string | number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "UPDATE tabla_grupo_3_inscripcion SET estado = 'CANCELADO', cancelado_at = NOW() WHERE estudiante_id = $1 AND evento_id = $2",
      [estudiante_id, evento_id],
    );
    return (rowCount ?? 0) > 0;
  }
}
