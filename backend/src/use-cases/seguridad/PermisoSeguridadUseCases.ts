import { PermisoSeguridadRepository } from '../../domain/repositories/PermisoSeguridadRepository';
import { CrearPermisoSeguridadDto, ActualizarPermisoSeguridadDto } from '../../domain/entities/PermisoSeguridad';

export class CrearPermisoSeguridad {
  constructor(private readonly permisos: PermisoSeguridadRepository) {}

  async execute(data: CrearPermisoSeguridadDto) {
    if (!data.nombre_permiso?.trim()) throw new Error('El nombre del permiso es obligatorio');
    if (!data.modulo?.trim()) throw new Error('El módulo es obligatorio');

    const existentes = await this.permisos.findAll();
    if (existentes.some((p) => p.nombre_permiso === data.nombre_permiso.trim())) {
      throw new Error('Este nombre de permiso ya está en uso');
    }

    return this.permisos.create({ ...data, nombre_permiso: data.nombre_permiso.trim() });
  }
}

export class ObtenerPermisosSeguridad {
  constructor(private readonly permisos: PermisoSeguridadRepository) {}
  execute(modulo?: string) {
    return this.permisos.findAll(modulo);
  }
}

export class ObtenerPermisoSeguridadPorId {
  constructor(private readonly permisos: PermisoSeguridadRepository) {}
  async execute(id: number) {
    const permiso = await this.permisos.findById(id);
    if (!permiso) throw new Error('Permiso no encontrado');
    return permiso;
  }
}

export class ActualizarPermisoSeguridad {
  constructor(private readonly permisos: PermisoSeguridadRepository) {}

  async execute(id: number, data: ActualizarPermisoSeguridadDto) {
    if (data.nombre_permiso !== undefined && !data.nombre_permiso.trim()) {
      throw new Error('El nombre del permiso es obligatorio');
    }
    if (data.modulo !== undefined && !data.modulo.trim()) {
      throw new Error('El módulo es obligatorio');
    }

    const actualizado = await this.permisos.update(id, data);
    if (!actualizado) throw new Error('Permiso no encontrado');
    return actualizado;
  }
}

export class EliminarPermisoSeguridad {
  constructor(private readonly permisos: PermisoSeguridadRepository) {}

  async execute(id: number) {
    if (!(await this.permisos.findById(id))) throw new Error('Permiso no encontrado');
    await this.permisos.delete(id);
  }
}
