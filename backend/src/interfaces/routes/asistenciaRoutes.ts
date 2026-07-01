import { Router } from 'express';
import { AsistenciaController } from '../controllers/AsistenciaController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function asistenciaRouter(ctrl: AsistenciaController): Router {
  const r = Router();

  r.get('/evento/:eventoId', autenticar, autorizar('TUTOR', 'VOAE', 'ADMIN'), ctrl.getByEvento);
  r.post('/qr', autenticar, autorizar('ESTUDIANTE'), ctrl.registrarQR);
  r.post('/manual/evento/:eventoId', autenticar, autorizar('TUTOR', 'VOAE', 'ADMIN'), ctrl.registrarManual);

  return r;
}
