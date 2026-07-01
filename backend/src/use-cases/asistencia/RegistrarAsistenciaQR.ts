import { AsistenciaRepository } from '../../domain/repositories/AsistenciaRepository';
import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';

export class RegistrarAsistenciaQR {
  constructor(
    private readonly asistenciaRepo: AsistenciaRepository,
    private readonly inscripcionRepo: InscripcionRepository,
  ) {}

  async execute(qr_token: string, estudiante_id: string) {
    const inscripciones = await this.inscripcionRepo.findByEstudiante(estudiante_id);
    const inscripcionActiva = inscripciones.find(
      (i) => i.estado === 'CONFIRMADA' || i.estado === 'PENDIENTE',
    );

    if (!inscripcionActiva) throw new Error('No tienes una inscripción activa para este evento');

    const yaRegistrado = await this.asistenciaRepo.yaRegistrado(inscripcionActiva.evento_id, estudiante_id);
    if (yaRegistrado) throw new Error('Tu asistencia ya fue registrada');

    const asistencia = await this.asistenciaRepo.registrarPorQR(qr_token, estudiante_id);
    await this.inscripcionRepo.cambiarEstado(inscripcionActiva.id, 'ASISTIO');

    return asistencia;
  }
}
