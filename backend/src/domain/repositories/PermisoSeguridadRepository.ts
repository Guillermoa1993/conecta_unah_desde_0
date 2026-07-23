import {
  PermisoSeguridad,
  CrearPermisoSeguridadDto,
  ActualizarPermisoSeguridadDto,
} from '../entities/PermisoSeguridad';

export interface PermisoSeguridadRepository {
  findAll(modulo?: string): Promise<PermisoSeguridad[]>;
  findById(id: number): Promise<PermisoSeguridad | null>;
  create(data: CrearPermisoSeguridadDto): Promise<PermisoSeguridad>;
  update(id: number, data: ActualizarPermisoSeguridadDto): Promise<PermisoSeguridad | null>;
  delete(id: number): Promise<boolean>;
}
