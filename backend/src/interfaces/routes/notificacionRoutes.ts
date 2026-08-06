import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function notificacionRouter(ctrl: NotificacionController): Router {
  const r = Router();

  r.get('/',                    autenticar, ctrl.getMias);
  r.get('/no-leidas',           autenticar, ctrl.getNoLeidas); 
  r.post('/',                   autenticar, ctrl.crear);
  r.patch('/:id/leer',          autenticar, ctrl.marcarLeida);
  r.patch('/leer-todas',        autenticar, ctrl.marcarTodasLeidas);

  // Centro de Notificaciones (panel de admin/empleados)
  r.get('/enviadas', autenticar, autorizar('ADMIN', 'TUTOR', 'VOAE', 'VOAE_DIRECCION', 'VOAE_DEPARTAMENTO'), ctrl.getEnviadas);
r.post('/masiva', autenticar, autorizar('ADMIN', 'TUTOR', 'VOAE', 'VOAE_DIRECCION', 'VOAE_DEPARTAMENTO'), ctrl.enviarMasiva);

  return r;
}
