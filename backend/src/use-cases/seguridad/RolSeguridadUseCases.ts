import { RolSeguridadRepository } from '../../domain/repositories/RolSeguridadRepository';
import { PermisoSeguridadRepository } from '../../domain/repositories/PermisoSeguridadRepository';
import { CrearRolSeguridadDto, ActualizarRolSeguridadDto } from '../../domain/entities/RolSeguridad';

const CODIGO_REGEX = /^[a-z0-9_]+$/;

export class CrearRolSeguridad {
  constructor(private readonly roles: RolSeguridadRepository) {}

  async execute(data: CrearRolSeguridadDto) {
    if (!data.nombre_rol?.trim()) throw new Error('El nombre del rol es obligatorio');
    if (!data.codigo_rol?.trim()) throw new Error('El código del rol es obligatorio');
    if (!CODIGO_REGEX.test(data.codigo_rol)) {
      throw new Error('El código del rol es inválido: usa solo minúsculas, números y guion bajo');
    }

    if (await this.roles.findByCodigo(data.codigo_rol)) {
      throw new Error('Este código de rol ya está en uso');
    }

    return this.roles.create({ ...data, codigo_rol: data.codigo_rol.toLowerCase().trim() });
  }
}

export class ObtenerRolesSeguridad {
  constructor(private readonly roles: RolSeguridadRepository) {}
  execute() {
    return this.roles.findAll();
  }
}

export class ObtenerRolSeguridadPorId {
  constructor(private readonly roles: RolSeguridadRepository) {}
  async execute(id: number) {
    const rol = await this.roles.findById(id);
    if (!rol) throw new Error('Rol no encontrado');
    return rol;
  }
}

export class ActualizarRolSeguridad {
  constructor(private readonly roles: RolSeguridadRepository) {}

  async execute(id: number, data: ActualizarRolSeguridadDto) {
    if (data.nombre_rol !== undefined && !data.nombre_rol.trim()) {
      throw new Error('El nombre del rol es obligatorio');
    }
    if (data.codigo_rol !== undefined) {
      if (!data.codigo_rol.trim()) throw new Error('El código del rol es obligatorio');
      if (!CODIGO_REGEX.test(data.codigo_rol)) {
        throw new Error('El código del rol es inválido: usa solo minúsculas, números y guion bajo');
      }
      const existente = await this.roles.findByCodigo(data.codigo_rol);
      if (existente && existente.id_rol !== id) throw new Error('Este código de rol ya está en uso');
    }

    const actualizado = await this.roles.update(id, data);
    if (!actualizado) throw new Error('Rol no encontrado');
    return actualizado;
  }
}

export class EliminarRolSeguridad {
  constructor(private readonly roles: RolSeguridadRepository) {}

  async execute(id: number) {
    if (!(await this.roles.findById(id))) throw new Error('Rol no encontrado');

    const usuariosAsignados = await this.roles.contarUsuariosAsignados(id);
    if (usuariosAsignados > 0) {
      throw new Error(
        `No puedes eliminar este rol: todavía tiene ${usuariosAsignados} usuario(s) asignado(s)`,
      );
    }

    await this.roles.delete(id);
  }
}

// ── Matriz ACL: permisos por rol ────────────────────────────────────────────
export class AsignarPermisoARol {
  constructor(
    private readonly roles: RolSeguridadRepository,
    private readonly permisos: PermisoSeguridadRepository,
  ) {}

  async execute(idRol: number, idPermiso: number) {
    const rol = await this.roles.findById(idRol);
    if (!rol) throw new Error('Rol no encontrado');
    if (!(await this.permisos.findById(idPermiso))) throw new Error('Permiso no encontrado');
    if (rol.permisos.some((p) => p.id_permiso === idPermiso)) {
      throw new Error('Este permiso ya está asignado a este rol');
    }

    await this.roles.asignarPermiso(idRol, idPermiso);
    return this.roles.findById(idRol);
  }
}

export class RevocarPermisoDeRol {
  constructor(private readonly roles: RolSeguridadRepository) {}

  async execute(idRol: number, idPermiso: number) {
    const rol = await this.roles.findById(idRol);
    if (!rol) throw new Error('Rol no encontrado');
    if (!rol.permisos.some((p) => p.id_permiso === idPermiso)) {
      throw new Error('Este rol no tiene asignado ese permiso');
    }

    await this.roles.revocarPermiso(idRol, idPermiso);
    return this.roles.findById(idRol);
  }
}
