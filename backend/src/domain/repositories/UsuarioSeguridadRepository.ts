import {
  UsuarioSeguridad,
  UsuarioSeguridadPublico,
  CrearUsuarioSeguridadDto,
  ActualizarUsuarioSeguridadDto,
} from '../entities/UsuarioSeguridad';

export interface FiltrosUsuarioSeguridad {
  busqueda?: string;
  estado?: number;
}

export interface UsuarioSeguridadRepository {
  findAll(filtros?: FiltrosUsuarioSeguridad): Promise<UsuarioSeguridadPublico[]>;
  findById(id: number): Promise<UsuarioSeguridadPublico | null>;
  findByCorreo(correo: string): Promise<UsuarioSeguridad | null>;
  create(data: CrearUsuarioSeguridadDto, contrasenaHash: string): Promise<UsuarioSeguridadPublico>;
  update(id: number, data: ActualizarUsuarioSeguridadDto): Promise<UsuarioSeguridadPublico | null>;
  inhabilitar(id: number, motivo: string): Promise<UsuarioSeguridadPublico | null>;
  habilitar(id: number): Promise<UsuarioSeguridadPublico | null>;
  asignarRol(idUsuario: number, idRol: number): Promise<void>;
  revocarRol(idUsuario: number, idRol: number): Promise<void>;
  asignarPermisoDirecto(idUsuario: number, idPermiso: number): Promise<void>;
  revocarPermisoDirecto(idUsuario: number, idPermiso: number): Promise<void>;
}
