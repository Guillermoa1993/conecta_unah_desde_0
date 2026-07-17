import { Router } from 'express';
import { Forma003Controller } from '../controllers/Forma003Controller';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function forma003Router(ctrl: Forma003Controller): Router {
  const r = Router();
  r.get('/mios', autenticar, autorizar('ESTUDIANTE'), ctrl.getMios);
  r.post('/', autenticar, autorizar('ESTUDIANTE'), ctrl.create);
  r.put('/:id/archivo', autenticar, autorizar('ESTUDIANTE'), ctrl.actualizarArchivo);
  r.put('/:id/validar', autenticar, autorizar('ADMIN', 'VOAE'), ctrl.validar);
  return r;
}