import { Pool } from 'pg';
import { EventoRepository, FiltrosEvento } from '../../domain/repositories/EventoRepository';
import { Evento, CrearEventoDto, EstadoEvento } from '../../domain/entities/Evento';

export class PostgresEventoRepository implements EventoRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<Evento | null> {
    const { rows } = await this.pool.query('SELECT * FROM eventos WHERE id = $1', [id]);
    return rows[0] ?? null;
  }

  async findAll(filtros: FiltrosEvento = {}): Promise<Evento[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filtros.estado) { conditions.push(`estado = $${idx++}`); values.push(filtros.estado); }
    if (filtros.tutor_id) { conditions.push(`tutor_id = $${idx++}`); values.push(filtros.tutor_id); }
    if (filtros.categoria) { conditions.push(`categoria = $${idx++}`); values.push(filtros.categoria); }
    if (filtros.centro_regional) { conditions.push(`centro_regional = $${idx++}`); values.push(filtros.centro_regional); }
    if (filtros.tipo_evento) { conditions.push(`tipo_evento = $${idx++}`); values.push(filtros.tipo_evento); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filtros.limit ?? 50;
    const offset = ((filtros.page ?? 1) - 1) * limit;

    const { rows } = await this.pool.query(
      `SELECT * FROM eventos ${where} ORDER BY fecha_inicio DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset],
    );
    return rows;
  }

  async findByTutor(tutor_id: string): Promise<Evento[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM eventos WHERE tutor_id = $1 ORDER BY created_at DESC',
      [tutor_id],
    );
    return rows;
  }

  async findPendientesAprobacion(): Promise<Evento[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM eventos WHERE estado = 'PENDIENTE_APROBACION' ORDER BY created_at ASC",
    );
    return rows;
  }

  async create(data: CrearEventoDto): Promise<Evento> {
    const { rows } = await this.pool.query(
      `INSERT INTO eventos (titulo, descripcion, categoria, tipo_actividad, tipo_evento, visibilidad,
        estado, centro_regional, fecha_inicio, fecha_fin, hora_inicio, hora_fin, ubicacion, latitud,
        longitud, enlace_virtual, cupo_maximo, duracion_horas, tipo_duracion, requiere_inscripcion,
        portada_url, tutor_id)
       VALUES ($1,$2,$3,$4,$5,$6,'PENDIENTE_APROBACION',$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [data.titulo, data.descripcion, data.categoria, data.tipo_actividad, data.tipo_evento,
       data.visibilidad, data.centro_regional, data.fecha_inicio, data.fecha_fin,
       data.hora_inicio, data.hora_fin, data.ubicacion ?? null, data.latitud ?? null,
       data.longitud ?? null, data.enlace_virtual ?? null, data.cupo_maximo, data.duracion_horas,
       data.tipo_duracion, data.requiere_inscripcion, data.portada_url ?? null, data.tutor_id],
    );
    return rows[0];
  }

  async update(id: string, data: Partial<Evento>): Promise<Evento | null> {
    const ignore = new Set(['id', 'tutor_id', 'created_at', 'updated_at']);
    const campos = Object.keys(data).filter((k) => !ignore.has(k));
    if (!campos.length) return this.findById(id);

    const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = campos.map((k) => (data as Record<string, unknown>)[k]);

    const { rows } = await this.pool.query(
      `UPDATE eventos SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0] ?? null;
  }

  async cambiarEstado(id: string, estado: EstadoEvento, datos?: { aprobado_por?: string; motivo_rechazo?: string }): Promise<Evento | null> {
    const { rows } = await this.pool.query(
      `UPDATE eventos SET estado = $2, aprobado_por = $3, motivo_rechazo = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, estado, datos?.aprobado_por ?? null, datos?.motivo_rechazo ?? null],
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM eventos WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async contarInscripciones(evento_id: string): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*) AS total FROM inscripciones WHERE evento_id = $1 AND estado != 'CANCELADA'",
      [evento_id],
    );
    return parseInt(rows[0]?.total ?? '0', 10);
  }
}
