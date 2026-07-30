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

/**
 * Roles con acceso total al sistema.
 */
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
    const secret = cfg("JWT_SECRET", "dev-secret-change-in-prod");

    const payload = jwt.verify(token, secret) as JwtPayload;

    // Verifica si la sesión sigue siendo válida
    const sesionValidaDesde = await obtenerSesionValidaDesde(pool);

    if (
      sesionValidaDesde &&
      payload.iat * 1000 < sesionValidaDesde.getTime()
    ) {
      res.status(401).json({
        error:
          "Tu sesión se cerró por mantenimiento del sistema. Inicia sesión de nuevo.",
      });
      return;
    }

    req.usuario = payload;

    next();
  } catch {
    res.status(401).json({
      error: "Token inválido o expirado",
    });
  }
}

/**
 * Middleware genérico por roles.
 */
export function autorizar(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      res.status(401).json({
        error: "No autenticado",
      });
      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({
        error: "No tienes permiso para esta acción",
      });
      return;
    }

    next();
  };
}

/**
 * Middleware exclusivo para Administradores del Sistema.
 * Solo ADMIN y DEV pueden acceder.
 */
export function requireSystemAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.usuario) {
    res.status(401).json({
      error: "No autenticado",
    });
    return;
  }

  if (!SYSTEM_ADMIN_ROLES.includes(req.usuario.rol.toLowerCase())) {
    res.status(403).json({
      error: "Acceso restringido para administradores del sistema.",
    });
    return;
  }

  next();
}

/**
 * Devuelve true si el rol pertenece a un administrador del sistema.
 */
export function isSystemAdmin(role?: string): boolean {
  if (!role) return false;

  return SYSTEM_ADMIN_ROLES.includes(role.toLowerCase());
}