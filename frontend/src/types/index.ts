// ─── Usuarios ────────────────────────────────────────────────────────────────
export type RolUsuario = 'ESTUDIANTE' | 'TUTOR' | 'ADMIN' | 'VOAE';
export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  numero_cuenta?: string;
  carrera?: string;
  centro_regional?: string;
  telefono?: string;
  foto_url?: string;
  created_at: string;
}

// ─── Eventos ─────────────────────────────────────────────────────────────────
export type CategoriaEvento = 'ACADEMICO' | 'CULTURAL' | 'DEPORTIVO' | 'SOCIAL';
export type TipoActividad = 'Presencial' | 'Virtual' | 'Híbrido';
export type TipoEvento = 'HORAS_VOAE' | 'RECREACION';
export type VisibilidadEvento = 'PUBLICO' | 'PRIVADO';
export type EstadoEvento =
  | 'BORRADOR'
  | 'PENDIENTE_APROBACION'
  | 'PROGRAMADO'
  | 'EN_CURSO'
  | 'FINALIZADO'
  | 'RECHAZADO';
export type TipoDuracion = 'TOTALES' | 'DIARIAS';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  tipo_actividad: TipoActividad;
  tipo_evento: TipoEvento;
  visibilidad: VisibilidadEvento;
  estado: EstadoEvento;
  centro_regional: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  enlace_virtual?: string;
  cupo_maximo: number;
  duracion_horas: number;
  tipo_duracion: TipoDuracion;
  requiere_inscripcion: boolean;
  portada_url?: string;
  tutor_id: string;
  aprobado_por?: string;
  motivo_rechazo?: string;
  created_at: string;
  updated_at: string;
}

export interface CrearEventoPayload {
  titulo: string;
  descripcion: string;
  categoria: CategoriaEvento;
  tipo_actividad: TipoActividad;
  tipo_evento: TipoEvento;
  visibilidad: VisibilidadEvento;
  centro_regional: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  latitud?: number;
  longitud?: number;
  enlace_virtual?: string;
  cupo_maximo: number;
  duracion_horas: number;
  tipo_duracion: TipoDuracion;
  requiere_inscripcion: boolean;
  portada_url?: string;
}

export interface FiltrosEvento {
  estado?: EstadoEvento;
  tutor_id?: string;
  categoria?: CategoriaEvento;
  centro_regional?: string;
  tipo_evento?: TipoEvento;
  page?: number;
  limit?: number;
}

// ─── Inscripciones ───────────────────────────────────────────────────────────
export type EstadoInscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'ASISTIO' | 'NO_ASISTIO';

export interface Inscripcion {
  id: string;
  estudiante_id: string;
  evento_id: string;
  estado: EstadoInscripcion;
  fecha_inscripcion: string;
  updated_at: string;
  evento_titulo?: string;
  evento_fecha?: string;
  evento_horas?: number;
  estudiante_nombre?: string;
  estudiante_cuenta?: string;
}

// ─── Asistencia ──────────────────────────────────────────────────────────────
export type MetodoRegistro = 'QR' | 'MANUAL';
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDANZA';

export interface Asistencia {
  id: string;
  estudiante_id: string;
  evento_id: string;
  metodo: MetodoRegistro;
  estado: EstadoAsistencia;
  fecha_hora: string;
  registrado_por?: string;
}

// ─── Constancias ─────────────────────────────────────────────────────────────
export type EstadoConstancia = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'EMITIDA';

export interface Constancia {
  id: string;
  estudiante_id: string;
  evento_id: string;
  horas_otorgadas: number;
  estado: EstadoConstancia;
  fecha_emision?: string;
  aprobado_por?: string;
  motivo_rechazo?: string;
  pdf_url?: string;
  created_at: string;
  estudiante_nombre?: string;
  estudiante_cuenta?: string;
  evento_titulo?: string;
  aprobador_nombre?: string;
}

// ─── Notificaciones ──────────────────────────────────────────────────────────
export type TipoNotificacion =
  | 'EVENTO_APROBADO'
  | 'EVENTO_RECHAZADO'
  | 'NUEVA_INSCRIPCION'
  | 'EVENTO_CANCELADO'
  | 'CONSTANCIA_EMITIDA'
  | 'RECORDATORIO'
  | 'SISTEMA';

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: TipoNotificacion;
  leida: boolean;
  evento_id?: string;
  created_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginPayload {
  correo: string;
  contrasena: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface RegistroPayload {
  nombre: string;
  correo: string;
  contrasena: string;
  rol: RolUsuario;
  numero_cuenta?: string;
  carrera?: string;
  centro_regional?: string;
  telefono?: string;
}

// ─── Respuestas genéricas ─────────────────────────────────────────────────────
export interface ApiError {
  error: string;
}

// ════════════════════════════════════════════════════════════════════════════
// Módulo 4 · Seguridad (Usuarios / Roles / Permisos)
// Entidad DISTINTA del "Usuario" de arriba (que es el usuario de login/eventos,
// tabla_grupo_1_usuario). Esta es tabla_grupo_4_usuarios — la pantalla de
// administración "Gestión de Usuarios" bajo /admin.
// ════════════════════════════════════════════════════════════════════════════

export interface PermisoSeguridad {
  id_permiso: number;
  nombre_permiso: string;
  modulo: string;
  descripcion: string | null;
}

export interface RolSeguridad {
  id_rol: number;
  nombre_rol: string;
  codigo_rol: string;
  descripcion: string | null;
  permisos: PermisoSeguridad[];
}

export interface UsuarioSeguridad {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  correo: string;
  telefono: string | null;
  estado: number; // 1 = Activo, 0 = Inhabilitado
  motivo_inhabilitacion: string | null;
  modulos_acceso: string[];
  roles: { id_rol: number; nombre_rol: string; codigo_rol: string }[];
  permisos_directos: { id_permiso: number; nombre_permiso: string; modulo: string }[];
}

export interface CrearUsuarioSeguridadPayload {
  nombre: string;
  apellido?: string;
  correo: string;
  telefono?: string;
  modulos_acceso?: string[];
  roles?: number[];
  permisos_directos?: number[];
}

export interface ActualizarUsuarioSeguridadPayload {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  modulos_acceso?: string[];
}

export interface CrearRolSeguridadPayload {
  nombre_rol: string;
  codigo_rol: string;
  descripcion?: string;
  permisos?: number[];
}

export interface CrearPermisoSeguridadPayload {
  nombre_permiso: string;
  modulo: string;
  descripcion?: string;
}

