import { Router } from 'express';
import { ConstanciaController } from '../controllers/ConstanciaController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function constanciaRouter(ctrl: ConstanciaController): Router {
  const r = Router();

  r.get('/mis-constancias', autenticar, autorizar('ESTUDIANTE'), ctrl.getMias);
  r.get('/pendientes', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.getPendientes);
  r.post('/evento/:eventoId', autenticar, autorizar('ESTUDIANTE'), ctrl.solicitar);
  r.patch('/:id/aprobar', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.aprobar);
  r.patch('/:id/rechazar', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.rechazar);

  return r;
}
