import { BitacoraEntry } from '../entities/BitacoraEntry';

export interface BitacoraRepository {
  findAll(limit?: number): Promise<BitacoraEntry[]>;
  findByUsuario(id_usuario: number, limit?: number): Promise<BitacoraEntry[]>;
  registrar(id_usuario: number, accion: string): Promise<BitacoraEntry>;
}