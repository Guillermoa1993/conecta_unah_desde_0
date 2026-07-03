import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController';
import { autenticar } from '../middlewares/authMiddleware';

export function notificacionRouter(ctrl: NotificacionController): Router {
  const r = Router();

  r.get('/',                    autenticar, ctrl.getMias);
  r.post('/',                   autenticar, ctrl.crear);
  r.patch('/:id/leer',          autenticar, ctrl.marcarLeida);
  r.patch('/leer-todas',        autenticar, ctrl.marcarTodasLeidas);

  return r;
}
