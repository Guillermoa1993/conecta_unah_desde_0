import { Pool } from 'pg';
import { Forma003Repository } from '../../domain/repositories/Forma003Repository';
import { RegistroForma003, CrearForma003Dto, EstadoForma003 } from '../../domain/entities/RegistroForma003';

export class PostgresForma003Repository implements Forma003Repository {
  constructor(private readonly pool: Pool) {}

  async crear(data: CrearForma003Dto): Promise<RegistroForma003> {
    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_2_forma003_historial
        (id_usuario, periodo, carnet_base64, forma003_base64)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.id_usuario, data.periodo, data.carnet_base64, data.forma003_base64],
    );
    return rows[0];
  }

    async existePeriodo(idUsuario: number, periodo: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT 1 FROM tabla_grupo_2_forma003_historial
       WHERE id_usuario = $1 AND periodo = $2
       LIMIT 1`,
      [idUsuario, periodo],
    );
    return rows.length > 0;
  }
  

  async listarPorUsuario(idUsuario: number): Promise<RegistroForma003[]> {
    const { rows } = await this.pool.query(
      `SELECT * FROM tabla_grupo_2_forma003_historial
       WHERE id_usuario = $1
       ORDER BY fecha_carga DESC`,
      [idUsuario],
    );
    return rows;
  }

  async findById(idRegistro: number): Promise<RegistroForma003 | null> {
    const { rows } = await this.pool.query(
      `SELECT * FROM tabla_grupo_2_forma003_historial WHERE id_registro = $1`,
      [idRegistro],
    );
    return rows[0] ?? null;
  }

  async actualizarArchivo(idRegistro: number, forma003Base64: string): Promise<RegistroForma003 | null> {
    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_2_forma003_historial
       SET forma003_base64 = $2, estado = 'PENDIENTE', id_admin_validador = NULL,
           comentario_rechazo = NULL, fecha_validacion = NULL, fecha_carga = NOW()
       WHERE id_registro = $1
       RETURNING *`,
      [idRegistro, forma003Base64],
    );
    return rows[0] ?? null;
  }

  async validar(
    idRegistro: number,
    idAdmin: number,
    estado: EstadoForma003,
    comentario?: string,
  ): Promise<RegistroForma003 | null> {
    const { rows } = await this.pool.query(
      `UPDATE tabla_grupo_2_forma003_historial
       SET estado = $2, id_admin_validador = $3, comentario_rechazo = $4, fecha_validacion = NOW()
       WHERE id_registro = $1
       RETURNING *`,
      [idRegistro, estado, idAdmin, comentario ?? null],
    );
    return rows[0] ?? null;
  }
}