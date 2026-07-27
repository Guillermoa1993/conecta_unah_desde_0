import { Pool } from 'pg';

// Estadísticas reales del Dashboard Administrativo, calculadas contra las
// tablas reales de la base de Render (no datos de ejemplo):
//   - tabla_grupo_3_eventos              (eventos)
//   - tabla_grupo_2_inscripciones_evento (inscripciones/asistencia)
//   - tabla_grupo_1_usuario / rol / estado_usuario
//   - tabla_grupo_1_bitacora             (actividad reciente -> "usuarios activos")
//   - tabla_grupo_4_historico_backups    (respaldos)

export interface DashboardStats {
  totalEventos: number;
  estudiantesActivos: number;
  estudiantesActivosTrend: number | null; // % vs mes anterior (null si no hay datos del mes pasado)
  eventosHoy: number;
  tasaAsistencia: number; // 0-100
  uptimeSegundos: number;
  usuariosActivosRecientes: number; // con actividad en bitácora en los últimos 30 min
  ultimoRespaldo: string | null; // ISO date o null si nunca se ha corrido uno
  eventosRecientes: {
    id: string;
    titulo: string;
    tutor: string;
    estado: string;
  }[];
}

export class PostgresDashboardRepository {
  constructor(private readonly pool: Pool) {}

  async obtenerEstadisticas(): Promise<DashboardStats> {
    const [
      totalEventosR,
      estudiantesR,
      eventosHoyR,
      asistenciaR,
      activosR,
      backupR,
      recientesR,
    ] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS total FROM tabla_grupo_3_eventos`),

      this.pool.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE u.created_at >= date_trunc('month', CURRENT_DATE))::int AS nuevos_este_mes,
          COUNT(*) FILTER (
            WHERE u.created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
              AND u.created_at <  date_trunc('month', CURRENT_DATE)
          )::int AS nuevos_mes_anterior
        FROM tabla_grupo_1_usuario u
        JOIN tabla_grupo_1_rol r            ON r.id_rol = u.id_rol
        JOIN tabla_grupo_1_estado_usuario e ON e.id_estado = u.id_estado
        WHERE r.nombre = 'ESTUDIANTE' AND e.estado = 'ACTIVO'
      `),

      this.pool.query(`
        SELECT COUNT(*)::int AS total
        FROM tabla_grupo_3_eventos
        WHERE fecha_inicio::date = CURRENT_DATE
      `),

      this.pool.query(`
        SELECT
          COUNT(*)::int AS total_inscritos,
          COUNT(*) FILTER (WHERE asistencia_entrada IS NOT NULL)::int AS con_asistencia
        FROM tabla_grupo_2_inscripciones_evento
        WHERE estado = 'INSCRITO'
      `),

      this.pool.query(`
        SELECT COUNT(DISTINCT id_usuario)::int AS total
        FROM tabla_grupo_1_bitacora
        WHERE fecha >= NOW() - INTERVAL '30 minutes'
      `),

      this.pool.query(`
        SELECT fecha_inicio
        FROM v_historico_backups
        WHERE estado = 'completado'
        ORDER BY fecha_inicio DESC
        LIMIT 1
      `).catch(() => ({ rows: [] as any[] })),

      this.pool.query(`
        SELECT e.id, e.titulo, e.estado, COALESCE(t.nombre, 'Tutor no asignado') AS tutor
        FROM tabla_grupo_3_eventos e
        LEFT JOIN tabla_grupo_1_usuario t ON t.id_usuario = e.tutor_id
        ORDER BY e.fecha_inicio DESC
        LIMIT 5
      `),
    ]);

    const est = estudiantesR.rows[0];
    let estudiantesActivosTrend: number | null = null;
    if (est.nuevos_mes_anterior > 0) {
      estudiantesActivosTrend = Math.round(
        ((est.nuevos_este_mes - est.nuevos_mes_anterior) / est.nuevos_mes_anterior) * 100,
      );
    }

    const asis = asistenciaR.rows[0];
    const tasaAsistencia = asis.total_inscritos > 0
      ? Math.round((asis.con_asistencia / asis.total_inscritos) * 100)
      : 0;

    return {
      totalEventos: totalEventosR.rows[0].total,
      estudiantesActivos: est.total,
      estudiantesActivosTrend,
      eventosHoy: eventosHoyR.rows[0].total,
      tasaAsistencia,
      uptimeSegundos: Math.floor(process.uptime()),
      usuariosActivosRecientes: activosR.rows[0].total,
      ultimoRespaldo: backupR.rows[0]?.fecha_inicio ?? null,
      eventosRecientes: recientesR.rows.map((r) => ({
        id: r.id,
        titulo: r.titulo,
        tutor: r.tutor,
        estado: r.estado,
      })),
    };
  }
}