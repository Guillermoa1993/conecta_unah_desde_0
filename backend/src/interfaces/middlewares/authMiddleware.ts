import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { cfg } from '../../infrastructure/config/configService';
import pool from '../../infrastructure/database/db';
import { obtenerSesionValidaDesde } from '../../infrastructure/config/sesionMantenimiento';

export interface JwtPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export const SYSTEM_ADMIN_ROLES = [
  "admin",
  "dev",
];

export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }

  try {
    const token = header.slice(7);
    const secret = cfg('JWT_SECRET', 'dev-secret-change-in-prod');
    const payload = jwt.verify(token, secret) as JwtPayload;

    const sesionValidaDesde = await obtenerSesionValidaDesde(pool);
    if (sesionValidaDesde && payload.iat * 1000 < sesionValidaDesde.getTime()) {
      res.status(401).json({
        error: "Tu sesión se cerró por mantenimiento del sistema. Inicia sesión de nuevo.",
      });
      return;
    }

    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

const ROLE_ALIASES: Record<string, string[]> = {
  TUTOR: ['TUTOR', 'EMPLEADO', 'DOCENTE'],
  EMPLEADO: ['EMPLEADO', 'TUTOR', 'DOCENTE'],
  VOAE: ['VOAE', 'VOAE_DIRECCION', 'VOAE_DEPARTAMENTO'],
  VOAE_DIRECCION: ['VOAE', 'VOAE_DIRECCION'],
  VOAE_DEPARTAMENTO: ['VOAE_DEPARTAMENTO', 'COORDINACION', 'DEPARTAMENTO'],
  ADMIN: ['ADMIN', 'ADMINISTRADOR'],
  ESTUDIANTE: ['ESTUDIANTE', 'STUDENT'],
};

export function autorizar(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) { res.status(401).json({ error: 'No autenticado' }); return; }

    const userRol = (req.usuario.rol || '').toUpperCase();
    const allowedRoles = roles.flatMap((r) => ROLE_ALIASES[r.toUpperCase()] ?? [r.toUpperCase()]);

    if (!allowedRoles.includes(userRol)) {
      res.status(403).json({ error: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
}

export function requireSystemAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.usuario) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }
  if (!SYSTEM_ADMIN_ROLES.includes(req.usuario.rol.toLowerCase())) {
    res.status(403).json({ error: "Acceso restringido para administradores del sistema." });
    return;
  }
  next();
}

export function isSystemAdmin(role?: string): boolean {
  if (!role) return false;
  return SYSTEM_ADMIN_ROLES.includes(role.toLowerCase());
}
