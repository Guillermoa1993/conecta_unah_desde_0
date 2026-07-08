import { Pool } from 'pg';
import { EventoRepository, FiltrosEvento } from '../../domain/repositories/EventoRepository';
import { Evento, CrearEventoDto, EstadoEvento } from '../../domain/entities/Evento';

export class PostgresEventoRepository implements EventoRepository {
  constructor(private readonly pool: Pool) {}

  private mapRowToEvento(row: any): Evento {
    return {
      id: String(row.id),
      titulo: row.titulo,
      descripcion: row.descripcion,
      categoria: row.categoria,
      tipo_actividad: row.tipo_actividad,
      tipo_evento: parseFloat(row.duracion_horas) > 0 ? "HORAS_VOAE" : "RECREACION",
      visibilidad: "PUBLICO",
      estado: row.estado,
      centro_regional: "Ciudad Universitaria", // Centro por defecto ya que no existe columna física en BD
      fecha_inicio: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      hora_inicio: row.fecha_inicio ? new Date(row.fecha_inicio).toTimeString().slice(0, 5) : "08:00",
      hora_fin: row.fecha_fin ? new Date(row.fecha_fin).toTimeString().slice(0, 5) : "17:00",
      ubicacion: row.lugar || "",
      enlace_virtual: row.enlace_virtual || "",
      cupo_maximo: row.cupo_maximo || 50,
      duracion_horas: parseFloat(row.duracion_horas) || 0,
      tipo_duracion: "TOTALES",
      requiere_inscripcion: true,
      portada_url: row.imagen_url || "",
      tutor_id: String(row.tutor_id),
      aprobado_por: row.aprobado_por ? String(row.aprobado_por) : undefined,
      motivo_rechazo: row.motivo_rechazo || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async findById(id: string): Promise<Evento | null> {
    const { rows } = await this.pool.query(
      `SELECT e.*, COALESCE((SELECT COUNT(*) FROM tabla_grupo_3_inscripcion WHERE evento_id = e.id AND estado != 'CANCELADO'), 0) AS inscritos_count 
       FROM tabla_grupo_3_eventos e WHERE e.id = $1`, [id]
    );
    return rows[0] ? this.mapRowToEvento(rows[0]) : null;
  }

  async findAll(filtros: FiltrosEvento = {}): Promise<Evento[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filtros.estado) { conditions.push(`e.estado = $${idx++}`); values.push(filtros.estado); }
    if (filtros.tutor_id) { conditions.push(`e.tutor_id = $${idx++}`); values.push(filtros.tutor_id); }
    if (filtros.categoria) { conditions.push(`e.categoria = $${idx++}`); values.push(filtros.categoria); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filtros.limit ?? 50;
    const offset = ((filtros.page ?? 1) - 1) * limit;

    const { rows } = await this.pool.query(
      `SELECT e.*, COALESCE((SELECT COUNT(*) FROM tabla_grupo_3_inscripcion WHERE evento_id = e.id AND estado != 'CANCELADO'), 0) AS inscritos_count 
       FROM tabla_grupo_3_eventos e ${where} ORDER BY e.fecha_inicio DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset],
    );

    let list = rows.map(r => this.mapRowToEvento(r));

    if (filtros.tipo_evento) {
      list = list.filter(e => e.tipo_evento === filtros.tipo_evento);
    }
    return list;
  }

  async findByTutor(tutor_id: string): Promise<Evento[]> {
    const { rows } = await this.pool.query(
      `SELECT e.*, COALESCE((SELECT COUNT(*) FROM tabla_grupo_3_inscripcion WHERE evento_id = e.id AND estado != 'CANCELADO'), 0) AS inscritos_count 
       FROM tabla_grupo_3_eventos e WHERE e.tutor_id = $1 ORDER BY e.created_at DESC`,
      [tutor_id],
    );
    return rows.map(r => this.mapRowToEvento(r));
  }

  async findPendientesAprobacion(): Promise<Evento[]> {
    const { rows } = await this.pool.query(
      `SELECT e.*, COALESCE((SELECT COUNT(*) FROM tabla_grupo_3_inscripcion WHERE evento_id = e.id AND estado != 'CANCELADO'), 0) AS inscritos_count 
       FROM tabla_grupo_3_eventos e WHERE e.estado = 'PENDIENTE_APROBACION' ORDER BY e.created_at ASC`,
    );
    return rows.map(r => this.mapRowToEvento(r));
  }

  async create(data: CrearEventoDto): Promise<Evento> {
    const defaultEstado = 'BORRADOR';
    
    // Parsear fecha y hora de forma segura para evitar NaN por doble concatenación con 'T'
    const startDateTime = String(data.fecha_inicio).includes('T')
      ? new Date(data.fecha_inicio)
      : new Date(`${data.fecha_inicio}T${data.hora_inicio || '08:00'}`);

    const endDateTime = String(data.fecha_fin).includes('T')
      ? new Date(data.fecha_fin)
      : new Date(`${data.fecha_fin}T${data.hora_fin || '17:00'}`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      throw new Error("Formato de fecha u hora no válido (NaN) al intentar registrar el evento.");
    }

    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_3_eventos (
        titulo, descripcion, categoria, tipo_actividad, estado,
        fecha_inicio, fecha_fin, lugar, enlace_virtual, cupo_maximo,
        duracion_horas, imagen_url, tutor_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.titulo,
        data.descripcion,
        data.categoria,
        data.tipo_actividad,
        defaultEstado,
        startDateTime,
        endDateTime,
        data.ubicacion || null,
        data.enlace_virtual || null,
        data.cupo_maximo || 50,
        data.duracion_horas || 0,
        data.portada_url || null,
        data.tutor_id
      ],
    );
    return this.mapRowToEvento(rows[0]);
  }

  async update(id: string, data: Partial<Evento>): Promise<Evento | null> {
    const dbData: Record<string, any> = {};
    if (data.titulo !== undefined) dbData.titulo = data.titulo;
    if (data.descripcion !== undefined) dbData.descripcion = data.descripcion;
    if (data.categoria !== undefined) dbData.categoria = data.categoria;
    if (data.tipo_actividad !== undefined) dbData.tipo_actividad = data.tipo_actividad;
    if (data.estado !== undefined) dbData.estado = data.estado;
    if (data.fecha_inicio !== undefined) dbData.fecha_inicio = data.fecha_inicio;
    if (data.fecha_fin !== undefined) dbData.fecha_fin = data.fecha_fin;
    if (data.ubicacion !== undefined) dbData.lugar = data.ubicacion;
    if (data.enlace_virtual !== undefined) dbData.enlace_virtual = data.enlace_virtual;
    if (data.cupo_maximo !== undefined) dbData.cupo_maximo = data.cupo_maximo;
    if (data.duracion_horas !== undefined) dbData.duracion_horas = data.duracion_horas;
    if (data.portada_url !== undefined) dbData.imagen_url = data.portada_url;

    const campos = Object.keys(dbData);
    if (!campos.length) return this.findById(id);

    const sets = campos.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = campos.map((k) => dbData[k]);

    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_3_eventos SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values],
    );
    return rows[0] ? this.mapRowToEvento(rows[0]) : null;
  }

  async cambiarEstado(id: string, estado: EstadoEvento, datos?: { aprobado_por?: string | number; motivo_rechazo?: string }): Promise<Evento | null> {
    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_3_eventos SET estado = $2, aprobado_por = $3, motivo_rechazo = $4, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, estado, datos?.aprobado_por ?? null, datos?.motivo_rechazo ?? null],
    );
    return rows[0] ? this.mapRowToEvento(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query('DELETE FROM tabla_grupo_3_eventos WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async contarInscripciones(evento_id: string): Promise<number> {
    const { rows } = await this.pool.query(
      "SELECT COUNT(*) AS total FROM tabla_grupo_3_inscripcion WHERE evento_id = $1 AND estado != 'CANCELADA'",
      [evento_id],
    );
    return parseInt(rows[0]?.total ?? '0', 10);
  }
}
