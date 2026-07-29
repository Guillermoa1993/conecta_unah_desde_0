import { Router } from 'express';
import { InscripcionController } from '../controllers/InscripcionController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function inscripcionRouter(ctrl: InscripcionController): Router {
  const r = Router();

  r.get('/mis-inscripciones', autenticar, ctrl.getMias);
  r.get('/evento/:eventoId', autenticar, ctrl.getByEvento);
  r.post('/evento/:eventoId', autenticar, ctrl.inscribir);
  r.delete('/evento/:eventoId', autenticar, ctrl.cancelar);
  r.put('/:id/estado', autenticar, ctrl.cambiarEstado);

  return r;
}
