import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.message}`);

  const isKnown = [
    'no encontrado', 'no existe', 'ya está', 'ya estás', 'inválid',
    'obligatorio', 'no tienes permiso', 'lleno', 'no está disponible',
    'no puedes', 'solo se permiten', 'aún no',
  ].some((phrase) => err.message.toLowerCase().includes(phrase));

  const status = isKnown ? 400 : 500;
  res.status(status).json({ error: err.message });
}
