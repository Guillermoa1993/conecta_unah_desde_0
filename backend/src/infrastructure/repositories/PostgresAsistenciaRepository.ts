import { Pool } from 'pg';
import { AsistenciaRepository } from '../../domain/repositories/AsistenciaRepository';
import { Asistencia } from '../../domain/entities/Asistencia';

export class PostgresAsistenciaRepository implements AsistenciaRepository {
  constructor(private readonly pool: Pool) {}

  async findByEvento(evento_id: string): Promise<Asistencia[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM asistencias WHERE evento_id = $1 ORDER BY fecha_hora DESC',
      [evento_id],
    );
    return rows;
  }

  async findByEstudiante(estudiante_id: string): Promise<Asistencia[]> {
    const { rows } = await this.pool.query(
      'SELECT * FROM asistencias WHERE estudiante_id = $1 ORDER BY fecha_hora DESC',
      [estudiante_id],
    );
    return rows;
  }

  async registrarPorQR(qr_token: string, estudiante_id: string): Promise<Asistencia> {
    // El token QR contiene el evento_id en la URL: /inscribirse/{evento_id}/{token}
    const partes = qr_token.split('/');
    const evento_id = partes[partes.length - 2];

    const { rows } = await this.pool.query(
      `INSERT INTO asistencias (estudiante_id, evento_id, metodo, estado, fecha_hora)
       VALUES ($1, $2, 'QR', 'PRESENTE', NOW()) RETURNING *`,
      [estudiante_id, evento_id],
    );
    return rows[0];
  }

  async registrarManual(evento_id: string, estudiante_id: string, registrado_por: string): Promise<Asistencia> {
    const { rows } = await this.pool.query(
      `INSERT INTO asistencias (estudiante_id, evento_id, metodo, estado, registrado_por, fecha_hora)
       VALUES ($1, $2, 'MANUAL', 'PRESENTE', $3, NOW()) RETURNING *`,
      [estudiante_id, evento_id, registrado_por],
    );
    return rows[0];
  }

  async yaRegistrado(evento_id: string, estudiante_id: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      'SELECT 1 FROM asistencias WHERE evento_id = $1 AND estudiante_id = $2 LIMIT 1',
      [evento_id, estudiante_id],
    );
    return rows.length > 0;
  }
}
