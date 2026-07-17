import { RegistroForma003, CrearForma003Dto, EstadoForma003 } from '../entities/RegistroForma003';

export interface Forma003Repository {
  crear(data: CrearForma003Dto): Promise<RegistroForma003>;
  existePeriodo(idUsuario: number, periodo: string): Promise<boolean>;
  listarPorUsuario(idUsuario: number): Promise<RegistroForma003[]>;
  findById(idRegistro: number): Promise<RegistroForma003 | null>;
  actualizarArchivo(idRegistro: number, forma003Base64: string): Promise<RegistroForma003 | null>;
  validar(
    idRegistro: number,
    idAdmin: number,
    estado: EstadoForma003,
    comentario?: string,
  ): Promise<RegistroForma003 | null>;
}