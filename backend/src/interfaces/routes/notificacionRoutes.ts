import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController';
import { autenticar } from '../middlewares/authMiddleware';

export function notificacionRouter(ctrl: NotificacionController): Router {
  const r = Router();

  r.get('/', autenticar, ctrl.getMias);

  return r;
}
