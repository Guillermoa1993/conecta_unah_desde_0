import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UsuarioSeguridadRepository, FiltrosUsuarioSeguridad } from '../../domain/repositories/UsuarioSeguridadRepository';
import { RolSeguridadRepository } from '../../domain/repositories/RolSeguridadRepository';
import { PermisoSeguridadRepository } from '../../domain/repositories/PermisoSeguridadRepository';
import { CrearUsuarioSeguridadDto, ActualizarUsuarioSeguridadDto } from '../../domain/entities/UsuarioSeguridad';

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Crear ──────────────────────────────────────────────────────────────────
// El formulario de "Gestión de Usuarios" NO pide contraseña (el inicio de
// sesión institucional se gestiona fuera de este módulo). Aquí se genera una
// contraseña temporal aleatoria y se descarta en texto plano: solo se guarda
// su hash. Si más adelante el equipo agrega un flujo de invitación/reseteo
// por correo, ese es el lugar natural para reutilizar este mismo patrón.
export class CrearUsuarioSeguridad {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(data: CrearUsuarioSeguridadDto) {
    if (!data.nombre?.trim()) throw new Error('El nombre es obligatorio');
    if (!data.correo?.trim()) throw new Error('El correo es obligatorio');
    if (!CORREO_REGEX.test(data.correo)) throw new Error('El correo es inválido');

    const existente = await this.usuarios.findByCorreo(data.correo.toLowerCase().trim());
    if (existente) throw new Error('Este correo ya está registrado');

    const passwordTemporal = crypto.randomBytes(12).toString('base64url');
    const hash = await bcrypt.hash(passwordTemporal, 10);

    return this.usuarios.create({ ...data, correo: data.correo.toLowerCase().trim() }, hash);
  }
}

// ── Consultar ──────────────────────────────────────────────────────────────
export class ObtenerUsuariosSeguridad {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}
  execute(filtros?: FiltrosUsuarioSeguridad) {
    return this.usuarios.findAll(filtros);
  }
}

export class ObtenerUsuarioSeguridadPorId {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}
  async execute(id: number) {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }
}

// ── Actualizar ─────────────────────────────────────────────────────────────
export class ActualizarUsuarioSeguridad {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(id: number, data: ActualizarUsuarioSeguridadDto) {
    if (data.nombre !== undefined && !data.nombre.trim()) {
      throw new Error('El nombre es obligatorio');
    }
    const actualizado = await this.usuarios.update(id, data);
    if (!actualizado) throw new Error('Usuario no encontrado');
    return actualizado;
  }
}

// ── Inhabilitar / Habilitar (soft delete) ──────────────────────────────────
export class InhabilitarUsuarioSeguridad {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(id: number, motivo: string) {
    if (!motivo?.trim()) throw new Error('El motivo de inhabilitación es obligatorio');

    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (usuario.estado === 0) throw new Error('Este usuario ya está inhabilitado');

    return this.usuarios.inhabilitar(id, motivo.trim());
  }
}

export class HabilitarUsuarioSeguridad {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(id: number) {
    const usuario = await this.usuarios.findById(id);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (usuario.estado === 1) throw new Error('Este usuario ya está activo');

    return this.usuarios.habilitar(id);
  }
}

// ── Roles del usuario ──────────────────────────────────────────────────────
export class AsignarRolAUsuario {
  constructor(
    private readonly usuarios: UsuarioSeguridadRepository,
    private readonly roles: RolSeguridadRepository,
  ) {}

  async execute(idUsuario: number, idRol: number) {
    const usuario = await this.usuarios.findById(idUsuario);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (!(await this.roles.findById(idRol))) throw new Error('Rol no encontrado');
    if (usuario.roles.some((r) => r.id_rol === idRol)) {
      throw new Error('Este rol ya está asignado a este usuario');
    }

    await this.usuarios.asignarRol(idUsuario, idRol);
    return this.usuarios.findById(idUsuario);
  }
}

export class RevocarRolDeUsuario {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(idUsuario: number, idRol: number) {
    const usuario = await this.usuarios.findById(idUsuario);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (!usuario.roles.some((r) => r.id_rol === idRol)) {
      throw new Error('Este usuario no tiene asignado ese rol');
    }

    await this.usuarios.revocarRol(idUsuario, idRol);
    return this.usuarios.findById(idUsuario);
  }
}

// ── Permisos directos del usuario ───────────────────────────────────────────
export class AsignarPermisoDirectoAUsuario {
  constructor(
    private readonly usuarios: UsuarioSeguridadRepository,
    private readonly permisos: PermisoSeguridadRepository,
  ) {}

  async execute(idUsuario: number, idPermiso: number) {
    const usuario = await this.usuarios.findById(idUsuario);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (!(await this.permisos.findById(idPermiso))) throw new Error('Permiso no encontrado');
    if (usuario.permisos_directos.some((p) => p.id_permiso === idPermiso)) {
      throw new Error('Este permiso ya está asignado a este usuario');
    }

    await this.usuarios.asignarPermisoDirecto(idUsuario, idPermiso);
    return this.usuarios.findById(idUsuario);
  }
}

export class RevocarPermisoDirectoDeUsuario {
  constructor(private readonly usuarios: UsuarioSeguridadRepository) {}

  async execute(idUsuario: number, idPermiso: number) {
    const usuario = await this.usuarios.findById(idUsuario);
    if (!usuario) throw new Error('Usuario no encontrado');
    if (!usuario.permisos_directos.some((p) => p.id_permiso === idPermiso)) {
      throw new Error('Este usuario no tiene asignado ese permiso');
    }

    await this.usuarios.revocarPermisoDirecto(idUsuario, idPermiso);
    return this.usuarios.findById(idUsuario);
  }
}
