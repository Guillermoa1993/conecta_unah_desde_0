import { Asistencia } from '../entities/Asistencia';

export interface AsistenciaRepository {
  findByEvento(evento_id: string): Promise<Asistencia[]>;
  findByEstudiante(estudiante_id: string): Promise<Asistencia[]>;
  registrarPorQR(qr_token: string, estudiante_id: string): Promise<Asistencia>;
  registrarManual(evento_id: string, estudiante_id: string, registrado_por: string): Promise<Asistencia>;
  yaRegistrado(evento_id: string, estudiante_id: string): Promise<boolean>;
}
