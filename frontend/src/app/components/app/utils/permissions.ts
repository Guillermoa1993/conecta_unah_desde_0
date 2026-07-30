/**
 * ============================================================
 * UNAH Conecta - Sistema Centralizado de Permisos
 * ============================================================
 * Este archivo centraliza todos los permisos de acceso
 * según el rol del usuario.
 *
 * Si en el futuro se agrega un nuevo rol administrador,
 * únicamente se modifica SYSTEM_ADMIN_ROLES.
 * ============================================================
 */

export const ROLES = {
  DEV: "dev",
  ADMIN: "admin",
  VOAE: "voae",
  TUTOR: "tutor",
  STUDENT: "student",
  EMPLEADO: "empleado",
  DEPARTAMENTO: "departamento",
  COORDINACION: "coordinacion",
  DIRECCION: "direccion",
} as const;

/**
 * Roles con acceso total al sistema.
 */
export const SYSTEM_ADMIN_ROLES = [
  ROLES.DEV,
  ROLES.ADMIN,
];

/**
 * Verifica si el usuario es Administrador del Sistema.
 */
export function isSystemAdmin(role?: string): boolean {
  if (!role) return false;

  return SYSTEM_ADMIN_ROLES.includes(role.toLowerCase() as any);
}

/**
 * Verifica si el usuario es desarrollador.
 */
export function isDeveloper(role?: string): boolean {
  return role?.toLowerCase() === ROLES.DEV;
}

/**
 * Verifica si el usuario es administrador.
 */
export function isAdministrator(role?: string): boolean {
  return role?.toLowerCase() === ROLES.ADMIN;
}

/**
 * Verifica si el usuario es VOAE.
 */
export function isVOAE(role?: string): boolean {
  return role?.toLowerCase() === ROLES.VOAE;
}

/**
 * Verifica si el usuario es Tutor.
 */
export function isTutor(role?: string): boolean {
  return role?.toLowerCase() === ROLES.TUTOR;
}

/**
 * Verifica si el usuario es Estudiante.
 */
export function isStudent(role?: string): boolean {
  return role?.toLowerCase() === ROLES.STUDENT;
}

/**
 * Devuelve el rol almacenado en la sesión.
 */
export function getCurrentRole(): string {
  return (sessionStorage.getItem("unah_role") ?? ROLES.STUDENT).toLowerCase();
}

/**
 * Indica si el usuario autenticado es Administrador del Sistema.
 */
export function currentUserIsSystemAdmin(): boolean {
  return isSystemAdmin(getCurrentRole());
}

/**
 * Verifica si el rol pertenece a una lista de roles permitidos.
 */
export function hasRole(role: string | undefined, allowedRoles: string[]): boolean {
  if (!role) return false;

  return allowedRoles.includes(role.toLowerCase());
}