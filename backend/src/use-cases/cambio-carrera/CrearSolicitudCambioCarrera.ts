import { SolicitudCambioCarrera } from '../../domain/entities/SolicitudCambioCarrera';
import { SolicitudCambioCarreraRepository } from '../../domain/repositories/SolicitudCambioCarreraRepository';

export class SolicitudCambioCarreraError extends Error {
  constructor(public readonly statusCode: number, message: string) { super(message); }
}

interface CrearSolicitudEntrada {
  id_usuario: number;
  id_carrera_solicitada: unknown;
  id_centro_regional_solicitado: unknown;
  motivo: unknown;
}

export class CrearSolicitudCambioCarrera {
  constructor(private readonly repository: SolicitudCambioCarreraRepository) {}

  async execute(entrada: CrearSolicitudEntrada): Promise<SolicitudCambioCarrera> {
    const idCarreraSolicitada = this.validarId(entrada.id_carrera_solicitada, 'id_carrera_solicitada');
    const idCentroSolicitado = this.validarId(
      entrada.id_centro_regional_solicitado,
      'id_centro_regional_solicitado',
    );
    const motivo = this.validarMotivo(entrada.motivo);
    const contexto = await this.repository.obtenerContextoAcademico(entrada.id_usuario);

    if (!contexto) throw new SolicitudCambioCarreraError(404, 'Usuario no encontrado');
    if (!contexto.id_carrera_actual) throw new SolicitudCambioCarreraError(409, 'El usuario no tiene una carrera actual asignada');
    if (!contexto.id_centro_actual) throw new SolicitudCambioCarreraError(409, 'El usuario no tiene un centro regional actual asignado');
    if (contexto.id_carrera_actual === idCarreraSolicitada) {
      throw new SolicitudCambioCarreraError(409, 'La carrera solicitada debe ser distinta de la carrera actual');
    }

    const [carreraExiste, centroExiste, pendiente] = await Promise.all([
      this.repository.existeCarrera(idCarreraSolicitada),
      this.repository.existeCentroRegional(idCentroSolicitado),
      this.repository.obtenerPendiente(entrada.id_usuario),
    ]);
    if (!carreraExiste) throw new SolicitudCambioCarreraError(404, 'La carrera solicitada no existe');
    if (!centroExiste) throw new SolicitudCambioCarreraError(404, 'El centro regional solicitado no existe');
    if (pendiente) throw new SolicitudCambioCarreraError(409, 'Ya existe una solicitud de cambio de carrera pendiente');

    return this.repository.crear({
      id_usuario: entrada.id_usuario,
      id_carrera_actual: contexto.id_carrera_actual,
      id_carrera_solicitada: idCarreraSolicitada,
      id_centro_regional_solicitado: idCentroSolicitado,
      motivo,
    });
  }

  private validarId(valor: unknown, campo: string): number {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor <= 0) {
      throw new SolicitudCambioCarreraError(400, `${campo} debe ser un entero positivo`);
    }
    return valor;
  }

  private validarMotivo(valor: unknown): string {
    if (typeof valor !== 'string' || valor.trim().length < 10) {
      throw new SolicitudCambioCarreraError(400, 'El motivo es obligatorio y debe tener al menos 10 caracteres');
    }
    return valor.trim();
  }
}
