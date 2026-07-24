import { Forma003Repository } from '../../domain/repositories/Forma003Repository';
import { RegistroForma003, EstadoForma003 } from '../../domain/entities/RegistroForma003';

export class ValidarRegistroForma003 {
  constructor(private readonly repo: Forma003Repository) {}

  async execute(
    idRegistro: number,
    idAdmin: number,
    estado: EstadoForma003,
    comentario?: string,
  ): Promise<RegistroForma003> {
    if (!['VALIDADO', 'RECHAZADO'].includes(estado)) {
      throw new Error('Estado inválido. Debe ser VALIDADO o RECHAZADO.');
    }
    if (estado === 'RECHAZADO' && !comentario?.trim()) {
      throw new Error('Debes indicar un motivo de rechazo.');
    }

    const actualizado = await this.repo.validar(idRegistro, idAdmin, estado, comentario);
    if (!actualizado) throw new Error('Registro no encontrado.');
    return actualizado;
  }
}