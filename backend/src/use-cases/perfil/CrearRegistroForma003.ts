import { Forma003Repository } from '../../domain/repositories/Forma003Repository';
import { RegistroForma003 } from '../../domain/entities/RegistroForma003';
import pool from '../../infrastructure/database/db';

interface CrearRegistroDto {
  id_usuario: number;
  periodo: string;
  carnet_base64: string;
  forma003_base64: string;
}

const ARCHIVO_MAX_BYTES = 14 * 1024 * 1024; // ~10MB reales tras codificar en base64

export class CrearRegistroForma003 {
  constructor(private readonly repo: Forma003Repository) {}

  async execute(datos: CrearRegistroDto): Promise<RegistroForma003> {
    if (!datos.periodo?.trim()) {
      throw new Error('El período académico es obligatorio.');
    }

    const periodoLimpio = datos.periodo.trim();

    const periodoActual = await this.obtenerPeriodoActual();
    if (periodoActual && periodoLimpio.toLowerCase() !== periodoActual.toLowerCase()) {
      throw new Error(
        `El período académico activo es "${periodoActual}". No puedes cargar un registro para "${periodoLimpio}".`
      );
    }

    const yaExiste = await this.repo.existePeriodo(datos.id_usuario, periodoLimpio);
    if (yaExiste) {
      throw new Error(`Ya tienes un registro para el período "${periodoLimpio}".`);
    }

    this.validarArchivo(datos.carnet_base64, 'Carnet');
    this.validarArchivo(datos.forma003_base64, 'Forma 003');

    return this.repo.crear({
      id_usuario: datos.id_usuario,
      periodo: periodoLimpio,
      carnet_base64: datos.carnet_base64,
      forma003_base64: datos.forma003_base64,
    });
  }

  private async obtenerPeriodoActual(): Promise<string | null> {
    const { rows } = await pool.query(
      "SELECT valor FROM tabla_grupo_1_parametros WHERE nombre = 'PERIODO_ACADEMICO_ACTUAL'"
    );
    const valor = rows[0]?.valor?.trim();
    return valor ? valor : null;
  }

  private validarArchivo(archivo: string, nombre: string) {
    if (!archivo) {
      throw new Error(`Debes cargar ${nombre}.`);
    }
    if (!/^data:(application\/pdf|image\/(png|jpe?g));base64,/.test(archivo)) {
      throw new Error(`${nombre} debe ser un archivo PDF, JPG o PNG.`);
    }
    if (archivo.length > ARCHIVO_MAX_BYTES) {
      throw new Error(`${nombre} supera el tamaño máximo permitido (10 MB).`);
    }
  }
}