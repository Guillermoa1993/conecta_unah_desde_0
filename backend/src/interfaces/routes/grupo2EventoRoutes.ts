import { Router } from 'express';
import { Grupo2EventoController } from '../controllers/Grupo2EventoController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function grupo2EventoRouter(ctrl: Grupo2EventoController): Router {
  const r = Router();
  r.get('/', autenticar, autorizar('ESTUDIANTE'), ctrl.listar);
  r.post('/:id/inscribir', autenticar, autorizar('ESTUDIANTE'), ctrl.inscribir);
  r.post('/:id/cancelar', autenticar, autorizar('ESTUDIANTE'), ctrl.cancelar);
  r.post('/:id/asistencia', autenticar, autorizar('ESTUDIANTE'), ctrl.registrarAsistencia);
  return r;
}
