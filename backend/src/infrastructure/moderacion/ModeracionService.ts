import { Pool } from 'pg';

export type TipoSancion = 'suspension_72h' | 'shadowban' | 'bloqueo_permanente';

export interface ReporteModeracion {
  id_reporte: number;
  tipo_reporte: 'comentario' | 'publicacion';
  id_comentario?: number;
  id_publicacion?: number;
  contenido: string;
  titulo_publicacion?: string;
  autor: string;
  id_usuario_autor: number;
  id_usuario_reporta: number;
  usuario_reporta: string;
  motivo: string;
  estado: 'pendiente' | 'aprobado' | 'descartado';
  fecha_creacion: Date;
}

export interface EstadoModeracion {
  bloqueado: boolean;
  suspendidoHasta: Date | null;
  shadowbanned: boolean;
}

/**
 * Reglas de escalamiento (según lo definido por el equipo):
 *  1ra infracción -> suspensión 72 horas, se borra el comentario.
 *  2da infracción -> shadowban (el usuario sigue publicando pero nadie más lo ve).
 *  3ra infracción en adelante -> bloqueo permanente de la cuenta.
 */
const REGLAS: Record<number, { tipo: TipoSancion; duracionHoras: number | null }> = {
  1: { tipo: 'suspension_72h', duracionHoras: 72 },
  2: { tipo: 'shadowban', duracionHoras: null },
};
const REGLA_DEFECTO: { tipo: TipoSancion; duracionHoras: number | null } = {
  tipo: 'bloqueo_permanente',
  duracionHoras: null,
};

export class ModeracionService {
  constructor(private readonly pool: Pool) {}

  private async registrarBitacora(idUsuario: number, accion: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_1_bitacora (id_usuario, accion) VALUES ($1, $2)`,
      [idUsuario, accion],
    );
  }

  private async notificarAdmins(mensaje: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO tabla_grupo_1_notificaciones
         (id_usuario, id_tipo, mensaje, leida, fecha_creacion)
       SELECT u.id_usuario, t.id_tipo, $1, FALSE, NOW()
       FROM tabla_grupo_1_usuario u
       JOIN tabla_grupo_1_rol r ON u.id_rol = r.id_rol
       CROSS JOIN tabla_grupo_1_tipo_notificacion t
       WHERE LOWER(r.nombre) = 'admin' AND t.nombre = 'SISTEMA'`,
      [mensaje],
    );
  }

  async reportarComentario(idComentario: number, idUsuarioReporta: number, motivo: string): Promise<void> {
    const comentario = await this.pool.query(
      `SELECT id_usuario FROM tabla_grupo_2_comentario WHERE id_comentario = $1`,
      [idComentario],
    );
    if (comentario.rows.length === 0) {
      throw new Error('El comentario no existe');
    }
    if (comentario.rows[0].id_usuario === idUsuarioReporta) {
      throw new Error('No puedes reportar tu propio comentario');
    }

    await this.pool.query(
      `INSERT INTO tabla_grupo_4_reporte_comentario (id_comentario, id_usuario_reporta, motivo)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_comentario, id_usuario_reporta) DO NOTHING`,
      [idComentario, idUsuarioReporta, motivo],
    );

    await this.notificarAdmins(`Nuevo reporte de comentario: ${motivo}`);
  }

  async reportarPublicacion(idPublicacion: number, idUsuarioReporta: number, motivo: string): Promise<void> {
    const publicacion = await this.pool.query(
      `SELECT id_usuario, titulo FROM tabla_grupo_2_publicaciones WHERE id_publicacion = $1`,
      [idPublicacion],
    );
    if (publicacion.rows.length === 0) {
      throw new Error('La publicación no existe');
    }
    if (publicacion.rows[0].id_usuario === idUsuarioReporta) {
      throw new Error('No puedes reportar tu propia publicación');
    }

    await this.pool.query(
      `INSERT INTO tabla_grupo_4_reporte_publicacion (id_publicacion, id_usuario_reporta, motivo)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_publicacion, id_usuario_reporta) DO NOTHING`,
      [idPublicacion, idUsuarioReporta, motivo],
    );

    await this.notificarAdmins(`Nuevo reporte de publicación: ${publicacion.rows[0].titulo}`);
  }

  /** Lista los reportes pendientes de revisión, para el panel de admin. */
  async listarReportesPendientes(): Promise<ReporteModeracion[]> {
    const { rows } = await this.pool.query(
      `SELECT id_reporte, 'comentario' AS tipo_reporte,
              r.id_comentario, NULL AS id_publicacion,
              c.contenido, NULL AS titulo_publicacion,
              uc.nombre AS autor, uc.id_usuario AS id_usuario_autor,
              r.id_usuario_reporta, ur.nombre AS usuario_reporta,
              r.motivo, r.estado, r.fecha_creacion
       FROM tabla_grupo_4_reporte_comentario r
       JOIN tabla_grupo_2_comentario c ON c.id_comentario = r.id_comentario
       JOIN tabla_grupo_1_usuario uc ON uc.id_usuario = c.id_usuario
       JOIN tabla_grupo_1_usuario ur ON ur.id_usuario = r.id_usuario_reporta
       WHERE r.estado = 'pendiente'
       UNION ALL
       SELECT id_reporte, 'publicacion' AS tipo_reporte,
              NULL AS id_comentario, r.id_publicacion,
              p.descripcion AS contenido, p.titulo AS titulo_publicacion,
              up.nombre AS autor, up.id_usuario AS id_usuario_autor,
              r.id_usuario_reporta, ur.nombre AS usuario_reporta,
              r.motivo, r.estado, r.fecha_creacion
       FROM tabla_grupo_4_reporte_publicacion r
       JOIN tabla_grupo_2_publicaciones p ON p.id_publicacion = r.id_publicacion
       JOIN tabla_grupo_1_usuario up ON up.id_usuario = p.id_usuario
       JOIN tabla_grupo_1_usuario ur ON ur.id_usuario = r.id_usuario_reporta
       WHERE r.estado = 'pendiente'
       ORDER BY fecha_creacion ASC`,
    );
    return rows;
  }

  /**
   * Un admin aprueba el reporte: borra el comentario y aplica la sanción
   * que corresponda según el historial del usuario (1ra, 2da, 3ra vez...).
   */
  async aprobarReporte(idReporte: number, idAdmin: number): Promise<{ tipoSancion: TipoSancion; nivel: number }> {
    const reporteRes = await this.pool.query(
      `SELECT * FROM (
         SELECT r.id_reporte, 'comentario' AS tipo_reporte,
                c.id_usuario AS id_usuario_autor, c.id_comentario, NULL::int AS id_publicacion,
                c.contenido, NULL::text AS titulo_publicacion, r.motivo, r.estado
         FROM tabla_grupo_4_reporte_comentario r
         JOIN tabla_grupo_2_comentario c ON c.id_comentario = r.id_comentario
         WHERE r.id_reporte = $1 AND r.estado = 'pendiente'
       UNION ALL
         SELECT r.id_reporte, 'publicacion' AS tipo_reporte,
                p.id_usuario AS id_usuario_autor, NULL::int AS id_comentario, p.id_publicacion,
                p.descripcion AS contenido, p.titulo AS titulo_publicacion, r.motivo, r.estado
         FROM tabla_grupo_4_reporte_publicacion r
         JOIN tabla_grupo_2_publicaciones p ON p.id_publicacion = r.id_publicacion
         WHERE r.id_reporte = $1 AND r.estado = 'pendiente'
       ) AS reporte_unificado`,
      [idReporte],
    );
    if (reporteRes.rows.length === 0) {
      throw new Error('El reporte no existe o ya fue resuelto');
    }
    const reporte = reporteRes.rows[0];
    const idUsuario = reporte.id_usuario_autor;

    // Nivel = cuántas sanciones previas tiene ya + esta.
    const conteoRes = await this.pool.query(
      `SELECT COUNT(*)::int AS total FROM tabla_grupo_4_sancion_usuario WHERE id_usuario = $1`,
      [idUsuario],
    );
    const nivel = conteoRes.rows[0].total + 1;
    const regla = REGLAS[nivel] ?? REGLA_DEFECTO;
    const fechaFin = regla.duracionHoras
      ? new Date(Date.now() + regla.duracionHoras * 60 * 60 * 1000)
      : null;

    await this.pool.query('BEGIN');
    try {
      if (reporte.tipo_reporte === 'comentario') {
        await this.pool.query(
          `INSERT INTO tabla_grupo_4_sancion_usuario
             (id_usuario, id_comentario, id_reporte, tipo_sancion, nivel, motivo, id_admin_aplico, fecha_fin)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [idUsuario, reporte.id_comentario, idReporte, regla.tipo, nivel, reporte.motivo, idAdmin, fechaFin],
        );

        await this.pool.query(
          `UPDATE tabla_grupo_4_reporte_comentario
           SET estado = 'aprobado', id_admin_resuelve = $2, fecha_resolucion = NOW()
           WHERE id_reporte = $1`,
          [idReporte, idAdmin],
        );

        await this.pool.query(`DELETE FROM tabla_grupo_2_comentario WHERE id_comentario = $1`, [reporte.id_comentario]);
      } else {
        await this.pool.query(
          `INSERT INTO tabla_grupo_4_sancion_usuario
             (id_usuario, id_comentario, id_reporte, tipo_sancion, nivel, motivo, id_admin_aplico, fecha_fin)
           VALUES ($1, NULL, $2, $3, $4, $5, $6, $7)`,
          [idUsuario, idReporte, regla.tipo, nivel, reporte.motivo, idAdmin, fechaFin],
        );

        await this.pool.query(
          `UPDATE tabla_grupo_4_reporte_publicacion
           SET estado = 'aprobado', id_admin_resuelve = $2, fecha_resolucion = NOW()
           WHERE id_reporte = $1`,
          [idReporte, idAdmin],
        );

        await this.pool.query(
          `UPDATE tabla_grupo_2_publicaciones
           SET estado = 'rechazado', motivo_rechazo = $2, rechazado_por = $3, fecha_revision = NOW()
           WHERE id_publicacion = $1`,
          [reporte.id_publicacion, reporte.motivo, idAdmin],
        );
      }

      await this.pool.query('COMMIT');
    } catch (err) {
      await this.pool.query('ROLLBACK');
      throw err;
    }

    const descripciones: Record<TipoSancion, string> = {
      suspension_72h: 'suspendida 72 horas (1ra infracción)',
      shadowban: 'shadowban aplicado (2da infracción)',
      bloqueo_permanente: 'bloqueada permanentemente (3ra infracción o más)',
    };
    const textoEntidad = reporte.tipo_reporte === 'comentario'
      ? `Comentario reportado y eliminado: "${String(reporte.contenido).slice(0, 120)}"`
      : `Publicación reportada y rechazada: "${String(reporte.titulo_publicacion ?? reporte.contenido).slice(0, 120)}"`;

    await this.registrarBitacora(
      idUsuario,
      `Cuenta ${descripciones[regla.tipo]} por ${textoEntidad}`,
    );
    await this.registrarBitacora(
      idAdmin,
      `Aprobó reporte #${idReporte} y aplicó sanción "${regla.tipo}" al usuario #${idUsuario}`,
    );

    if (reporte.tipo_reporte === 'publicacion') {
      await this.pool.query(
        `INSERT INTO tabla_grupo_1_notificaciones
           (id_usuario, id_tipo, mensaje, leida, id_emisor, referencia_tipo, referencia_id, fecha_creacion)
         VALUES (
           $1,
           (SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = 'SISTEMA'),
           $2,
           FALSE,
           $3,
           'publicacion',
           $4,
           NOW()
         )`,
        [idUsuario, `Tu publicación "${reporte.titulo_publicacion ?? 'reportada'}" fue rechazada tras revisión administrativa.`, idAdmin, reporte.id_publicacion],
      );
    }

    return { tipoSancion: regla.tipo, nivel };
  }

  /** Un admin descarta un reporte sin sancionar (comentario no era una infracción). */
  async descartarReporte(idReporte: number, idAdmin: number): Promise<void> {
    const res = await this.pool.query(
      `WITH update_comment AS (
         UPDATE tabla_grupo_4_reporte_comentario
         SET estado = 'descartado', id_admin_resuelve = $2, fecha_resolucion = NOW()
         WHERE id_reporte = $1 AND estado = 'pendiente'
         RETURNING id_reporte
       ), update_publicacion AS (
         UPDATE tabla_grupo_4_reporte_publicacion
         SET estado = 'descartado', id_admin_resuelve = $2, fecha_resolucion = NOW()
         WHERE id_reporte = $1 AND estado = 'pendiente'
         RETURNING id_reporte
       )
       SELECT id_reporte FROM update_comment UNION ALL SELECT id_reporte FROM update_publicacion`,
      [idReporte, idAdmin],
    );
    if (res.rows.length === 0) {
      throw new Error('El reporte no existe o ya fue resuelto');
    }
    await this.registrarBitacora(idAdmin, `Descartó el reporte #${idReporte} (no era una infracción)`);
  }

  /** Estado de moderación vigente de un usuario: ¿puede comentar? ¿está shadowbanned? */
  async obtenerEstado(idUsuario: number): Promise<EstadoModeracion> {
    const { rows } = await this.pool.query(
      `SELECT tipo_sancion, fecha_fin
       FROM tabla_grupo_4_sancion_usuario
       WHERE id_usuario = $1
         AND activa = TRUE
         AND (fecha_fin IS NULL OR fecha_fin > NOW())
       ORDER BY fecha_inicio DESC`,
      [idUsuario],
    );

    let bloqueado = false;
    let suspendidoHasta: Date | null = null;
    let shadowbanned = false;

    for (const row of rows) {
      if (row.tipo_sancion === 'bloqueo_permanente') bloqueado = true;
      if (row.tipo_sancion === 'suspension_72h') suspendidoHasta = row.fecha_fin;
      if (row.tipo_sancion === 'shadowban') shadowbanned = true;
    }

    return { bloqueado, suspendidoHasta, shadowbanned };
  }

  /** IDs de usuarios actualmente shadowbanned, para filtrar sus comentarios a los demás. */
  async idsUsuariosShadowbanned(): Promise<number[]> {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT id_usuario FROM tabla_grupo_4_sancion_usuario
       WHERE tipo_sancion = 'shadowban' AND activa = TRUE`,
    );
    return rows.map((r) => r.id_usuario);
  }
}