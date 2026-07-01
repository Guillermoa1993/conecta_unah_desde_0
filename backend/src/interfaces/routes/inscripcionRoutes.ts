import { Router } from 'express';
import { InscripcionController } from '../controllers/InscripcionController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function inscripcionRouter(ctrl: InscripcionController): Router {
  const r = Router();

  r.get('/mis-inscripciones', autenticar, autorizar('ESTUDIANTE'), ctrl.getMias);
  r.get('/evento/:eventoId', autenticar, autorizar('TUTOR', 'VOAE', 'ADMIN'), ctrl.getByEvento);
  r.post('/evento/:eventoId', autenticar, autorizar('ESTUDIANTE'), ctrl.inscribir);
  r.delete('/evento/:eventoId', autenticar, autorizar('ESTUDIANTE'), ctrl.cancelar);

  return r;
}
