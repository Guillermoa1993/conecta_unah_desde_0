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

export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' });
    return;
  }

  try {
    const token = header.slice(7);
    const secret = cfg('JWT_SECRET', 'dev-secret-change-in-prod');
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Si se restauró un respaldo (mantenimiento) después de que este token
    // fue emitido, la sesión ya no es válida: hay que iniciar sesión de nuevo.
    const sesionValidaDesde = await obtenerSesionValidaDesde(pool);
    if (sesionValidaDesde && payload.iat * 1000 < sesionValidaDesde.getTime()) {
      res.status(401).json({ error: 'Tu sesión se cerró por mantenimiento del sistema. Inicia sesión de nuevo.' });
      return;
    }

    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function autorizar(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) { res.status(401).json({ error: 'No autenticado' }); return; }
    if (!roles.includes(req.usuario.rol)) {
      res.status(403).json({ error: 'No tienes permiso para esta acción' });
      return;
    }
    next();
  };
}
