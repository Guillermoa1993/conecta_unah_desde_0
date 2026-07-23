import { Pool } from 'pg';
import {
  CatalogoCarrera,
  CatalogoCentroRegional,
  ContextoAcademicoUsuario,
  SolicitudCambioCarrera,
} from '../../domain/entities/SolicitudCambioCarrera';
import {
  CrearSolicitudCambioCarreraDatos,
  SolicitudCambioCarreraRepository,
} from '../../domain/repositories/SolicitudCambioCarreraRepository';

const SELECT_SOLICITUD = `
  SELECT s.id_solicitud, s.id_usuario,
         s.id_carrera_actual, ca.nombre AS carrera_actual,
         s.id_carrera_solicitada, cs.nombre AS carrera_solicitada,
         s.id_centro_regional_solicitado, crs.nombre AS centro_regional_solicitado,
         s.motivo, s.estado, s.comentario_revision, s.id_revisor,
         s.fecha_creacion, s.fecha_revision
  FROM tabla_grupo_2_solicitud_cambio_carrera s
  LEFT JOIN tabla_grupo_1_carreras ca ON ca.id_carrera = s.id_carrera_actual
  INNER JOIN tabla_grupo_1_carreras cs ON cs.id_carrera = s.id_carrera_solicitada
  LEFT JOIN tabla_grupo_1_centro_regional crs
    ON crs.id_centro_regional = s.id_centro_regional_solicitado
`;

export class PostgresSolicitudCambioCarreraRepository implements SolicitudCambioCarreraRepository {
  constructor(private readonly pool: Pool) {}

  async obtenerContextoAcademico(idUsuario: number): Promise<ContextoAcademicoUsuario | null> {
    const { rows } = await this.pool.query<ContextoAcademicoUsuario>(
      `SELECT u.id_usuario,
              u.id_carrera AS id_carrera_actual,
              c.nombre AS carrera_actual,
              p.id_centro_regional AS id_centro_actual,
              cr.nombre AS centro_actual
       FROM tabla_grupo_1_usuario u
       LEFT JOIN tabla_grupo_1_carreras c ON c.id_carrera = u.id_carrera
       LEFT JOIN tabla_grupo_1_perfil p ON p.id_usuario = u.id_usuario
       LEFT JOIN tabla_grupo_1_centro_regional cr
         ON cr.id_centro_regional = p.id_centro_regional
       WHERE u.id_usuario = $1`,
      [idUsuario],
    );
    return rows[0] ?? null;
  }

  async existeCarrera(idCarrera: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM tabla_grupo_1_carreras WHERE id_carrera = $1',
      [idCarrera],
    );
    return (rowCount ?? 0) > 0;
  }

  async existeCentroRegional(idCentro: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM tabla_grupo_1_centro_regional WHERE id_centro_regional = $1',
      [idCentro],
    );
    return (rowCount ?? 0) > 0;
  }

  async obtenerPendiente(idUsuario: number): Promise<SolicitudCambioCarrera | null> {
    const { rows } = await this.pool.query<SolicitudCambioCarrera>(
      `${SELECT_SOLICITUD}
       WHERE s.id_usuario = $1 AND s.estado = 'PENDIENTE'
       ORDER BY s.fecha_creacion DESC
       LIMIT 1`,
      [idUsuario],
    );
    return rows[0] ?? null;
  }

  async crear(datos: CrearSolicitudCambioCarreraDatos): Promise<SolicitudCambioCarrera> {
    const { rows } = await this.pool.query<{ id_solicitud: number }>(
        `INSERT INTO tabla_grupo_2_solicitud_cambio_carrera
           (id_usuario, id_carrera_actual, id_carrera_solicitada,
            id_centro_regional_solicitado, motivo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id_solicitud`,
        [
          datos.id_usuario,
          datos.id_carrera_actual,
          datos.id_carrera_solicitada,
          datos.id_centro_regional_solicitado,
          datos.motivo,
        ],
    );
    const solicitud = await this.obtenerPorId(rows[0].id_solicitud);
    if (!solicitud) throw new Error('No se pudo recuperar la solicitud creada');
    return solicitud;
  }

  async obtenerPendienteOUltima(idUsuario: number): Promise<SolicitudCambioCarrera | null> {
    const { rows } = await this.pool.query<SolicitudCambioCarrera>(
      `${SELECT_SOLICITUD}
       WHERE s.id_usuario = $1
       ORDER BY CASE WHEN s.estado = 'PENDIENTE' THEN 0 ELSE 1 END,
                s.fecha_creacion DESC
       LIMIT 1`,
      [idUsuario],
    );
    return rows[0] ?? null;
  }

  async listarCarreras(): Promise<CatalogoCarrera[]> {
    const { rows } = await this.pool.query<CatalogoCarrera>(
      'SELECT id_carrera, nombre FROM tabla_grupo_1_carreras ORDER BY nombre',
    );
    return rows;
  }

  async listarCentrosRegionales(): Promise<CatalogoCentroRegional[]> {
    const { rows } = await this.pool.query<CatalogoCentroRegional>(
      `SELECT id_centro_regional, nombre, codigo
       FROM tabla_grupo_1_centro_regional
       ORDER BY nombre`,
    );
    return rows;
  }

  private async obtenerPorId(idSolicitud: number): Promise<SolicitudCambioCarrera | null> {
    const { rows } = await this.pool.query<SolicitudCambioCarrera>(
      `${SELECT_SOLICITUD} WHERE s.id_solicitud = $1`,
      [idSolicitud],
    );
    return rows[0] ?? null;
  }
}
