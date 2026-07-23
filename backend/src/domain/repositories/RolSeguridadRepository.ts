import {
  RolSeguridad,
  RolSeguridadConPermisos,
  CrearRolSeguridadDto,
  ActualizarRolSeguridadDto,
} from '../entities/RolSeguridad';

export interface RolSeguridadRepository {
  findAll(): Promise<RolSeguridadConPermisos[]>;
  findById(id: number): Promise<RolSeguridadConPermisos | null>;
  findByCodigo(codigo: string): Promise<RolSeguridad | null>;
  create(data: CrearRolSeguridadDto): Promise<RolSeguridadConPermisos>;
  update(id: number, data: ActualizarRolSeguridadDto): Promise<RolSeguridadConPermisos | null>;
  delete(id: number): Promise<boolean>;
  asignarPermiso(idRol: number, idPermiso: number): Promise<void>;
  revocarPermiso(idRol: number, idPermiso: number): Promise<void>;
  contarUsuariosAsignados(idRol: number): Promise<number>;
}
