import { Pool } from 'pg';
import { Grupo2EventoRepository } from '../../domain/repositories/Grupo2EventoRepository';

export class PostgresGrupo2EventoRepository implements Grupo2EventoRepository {
  constructor(private readonly pool: Pool) {}

  async obtenerEventosDisponibles(id_usuario: number): Promise<any[]> {
    const { rows } = await this.pool.query(
      `SELECT 
         e.id AS "EVENTO_ID",
         e.titulo AS "TITULO_EVENTO",
         e.descripcion AS "DESCRIPCION",
         e.estado AS "ESTADO_GLOBAL",
         e.cupo_maximo AS "CUPO_MAXIMO",
         TO_CHAR(e.fecha_inicio, 'YYYY-MM-DD') AS "FECHA",
         TO_CHAR(e.fecha_inicio, 'HH12:MI AM') || ' - ' || TO_CHAR(e.fecha_fin, 'HH12:MI AM') AS "HORARIO",
         e.lugar AS "UBICACION",
         e.categoria AS "Categoria",
         e.imagen_url AS "AVATAR_URL",
         e.duracion_horas AS "HORAS_VOAE",
         t.nombre AS "INSTRUCTOR",
         i.id_inscripcion,
         i.estado AS "INSCRIPCION_ESTADO",
         TO_CHAR(i.asistencia_entrada, 'YYYY-MM-DD HH24:MI:SS') AS "asistencia_entrada",
         TO_CHAR(i.asistencia_salida, 'YYYY-MM-DD HH24:MI:SS') AS "asistencia_salida",
         i.latitud,
         i.longitud,
         i.estado_verificacion,
         COALESCE((
           SELECT COUNT(*)::int 
           FROM tabla_grupo_2_inscripciones_evento 
           WHERE id_evento = e.id AND estado = 'INSCRITO'
         ), 0) AS "inscritos_count"
       FROM tabla_grupo_3_eventos e
       LEFT JOIN tabla_grupo_1_usuario t ON t.id_usuario = e.tutor_id
       LEFT JOIN tabla_grupo_2_inscripciones_evento i 
         ON i.id_evento = e.id AND i.id_usuario = $1 AND i.estado = 'INSCRITO'
       WHERE e.estado IN ('PROGRAMADO', 'EN_CURSO', 'EN_CURSO_SALIDA', 'FINALIZADO')
       ORDER BY e.fecha_inicio DESC`,
      [id_usuario]
    );

    return rows.map((row) => {
      const inscrito = row.id_inscripcion !== null;
      let estadoActividad = '';
      
      if (inscrito) {
        if (row.asistencia_salida !== null) {
          estadoActividad = 'Finalizado';
        } else if (row.ESTADO_GLOBAL === 'EN_CURSO' || row.ESTADO_GLOBAL === 'EN_CURSO_SALIDA') {
          estadoActividad = 'En curso';
        } else {
          estadoActividad = 'Programado';
        }
      }

      const cuposDisponibles = Math.max(0, row.CUPO_MAXIMO - row.inscritos_count);
      const descripcionLimpia = typeof row.DESCRIPCION === 'string'
        ? row.DESCRIPCION.split('---EVENTO_METADATA---')[0].trim()
        : row.DESCRIPCION;
      const [ubicacionNombre, ubicacionLink] = typeof row.UBICACION === 'string'
        ? row.UBICACION.split('|')
        : [row.UBICACION, undefined];

      const mapped: any = {
        EVENTO_ID: row.EVENTO_ID,
        TITULO_EVENTO: row.TITULO_EVENTO,
        DESCRIPCION: descripcionLimpia,
        ESTADO_ACTIVIDAD: estadoActividad,
        INSCRITO: inscrito,
        CUPOS_DISPONIBLES: cuposDisponibles,
        FECHA: row.FECHA,
        INSTRUCTOR: row.INSTRUCTOR || 'Instructor no asignado',
        AVATAR_URL: row.AVATAR_URL,
        HORARIO: row.HORARIO,
        HORAS_VOAE: parseFloat(row.HORAS_VOAE) || 0,
        UBICACION: ubicacionNombre || undefined,
        UBICACION_LINK: ubicacionLink || undefined,
        Categoria: row.Categoria,
      };

      if (row.asistencia_entrada) {
        mapped.ASISTENCIA = {
          entrada: row.asistencia_entrada,
          salida: row.asistencia_salida || undefined,
          lat: row.latitud ? parseFloat(row.latitud) : undefined,
          lng: row.longitud ? parseFloat(row.longitud) : undefined,
          estadoVerificacion: row.estado_verificacion,
        };
      }

      return mapped;
    });
  }

  async inscribir(id_usuario: number, id_evento: number): Promise<void> {
    const { rows } = await this.pool.query(
      `SELECT id_inscripcion, estado 
       FROM tabla_grupo_2_inscripciones_evento 
       WHERE id_usuario = $1 AND id_evento = $2`,
      [id_usuario, id_evento]
    );

    if (rows.length > 0) {
      if (rows[0].estado !== 'INSCRITO') {
        await this.pool.query(
          `UPDATE tabla_grupo_2_inscripciones_evento 
           SET estado = 'INSCRITO', inscrito_at = NOW(), cancelado_at = NULL 
           WHERE id_usuario = $1 AND id_evento = $2`,
          [id_usuario, id_evento]
        );
      }
    } else {
      await this.pool.query(
        `INSERT INTO tabla_grupo_2_inscripciones_evento (id_usuario, id_evento, estado) 
         VALUES ($1, $2, 'INSCRITO')`,
        [id_usuario, id_evento]
      );
    }
  }

  async cancelarInscripcion(id_usuario: number, id_evento: number): Promise<void> {
    await this.pool.query(
      `UPDATE tabla_grupo_2_inscripciones_evento 
       SET estado = 'CANCELADO', cancelado_at = NOW() 
       WHERE id_usuario = $1 AND id_evento = $2 AND estado = 'INSCRITO'`,
      [id_usuario, id_evento]
    );
  }

  async registrarAsistencia(
    id_usuario: number,
    id_evento: number,
    tipo: 'entrada' | 'salida',
    lat: number,
    lng: number
  ): Promise<void> {
    if (tipo === 'entrada') {
      await this.pool.query(
        `UPDATE tabla_grupo_2_inscripciones_evento 
         SET asistencia_entrada = NOW(), latitud = $3, longitud = $4 
         WHERE id_usuario = $1 AND id_evento = $2 AND estado = 'INSCRITO'`,
        [id_usuario, id_evento, lat, lng]
      );
    } else {
      await this.pool.query(
        `UPDATE tabla_grupo_2_inscripciones_evento 
         SET asistencia_salida = NOW(), latitud = $3, longitud = $4 
         WHERE id_usuario = $1 AND id_evento = $2 AND estado = 'INSCRITO'`,
        [id_usuario, id_evento, lat, lng]
      );
    }
  }
}