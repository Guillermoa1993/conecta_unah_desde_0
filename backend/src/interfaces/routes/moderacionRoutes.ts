import { Router } from 'express';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';
import { ModeracionController } from '../controllers/ModeracionController';

export function moderacionRouter(ctrl: ModeracionController): Router {
  const r = Router();

  // Cualquier usuario autenticado puede reportar un comentario ajeno o una publicación.
  r.post('/reportes', autenticar, ctrl.reportar);

  // Cada usuario puede consultar si tiene alguna sanción activa (para
  // mostrarle un aviso en su propia interfaz, ej. "estás suspendido hasta...").
  r.get('/mi-estado', autenticar, ctrl.miEstado);

  // Solo administradores gestionan los reportes.
  r.get('/reportes', autenticar, requireSystemAdmin, ctrl.listarPendientes);
  r.post('/reportes/:id/aprobar', autenticar, requireSystemAdmin, ctrl.aprobar);
  r.post('/reportes/:id/descartar', autenticar, requireSystemAdmin, ctrl.descartar);

  return r;
}