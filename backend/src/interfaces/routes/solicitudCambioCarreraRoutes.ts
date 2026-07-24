import { Router } from 'express';
import { SolicitudCambioCarreraController } from '../controllers/SolicitudCambioCarreraController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function solicitudCambioCarreraRouter(ctrl: SolicitudCambioCarreraController): Router {
  const r = Router();
  r.get('/mia', autenticar, autorizar('ESTUDIANTE'), ctrl.mia);
  r.get('/catalogos', autenticar, autorizar('ESTUDIANTE'), ctrl.catalogos);
  r.post('/', autenticar, autorizar('ESTUDIANTE'), ctrl.crear);
  return r;
}
