import { Forma003Repository } from '../../domain/repositories/Forma003Repository';
import { RegistroForma003 } from '../../domain/entities/RegistroForma003';

const ARCHIVO_MAX_BYTES = 14 * 1024 * 1024;

export class ActualizarArchivoForma003 {
  constructor(private readonly repo: Forma003Repository) {}

  async execute(idRegistro: number, idUsuario: number, forma003Base64: string): Promise<RegistroForma003> {
    const registro = await this.repo.findById(idRegistro);
    if (!registro) throw new Error('Registro no encontrado.');
    if (registro.id_usuario !== idUsuario) {
      throw new Error('No tienes permiso para modificar este registro.');
    }

    if (!/^data:(application\/pdf|image\/(png|jpe?g));base64,/.test(forma003Base64)) {
      throw new Error('Forma 003 debe ser un archivo PDF, JPG o PNG.');
    }
    if (forma003Base64.length > ARCHIVO_MAX_BYTES) {
      throw new Error('Forma 003 supera el tamaño máximo permitido (10 MB).');
    }

    const actualizado = await this.repo.actualizarArchivo(idRegistro, forma003Base64);
    if (!actualizado) throw new Error('No se pudo actualizar el registro.');
    return actualizado;
  }
}