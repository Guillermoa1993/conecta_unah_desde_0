import { Router } from 'express';
import { PerfilReaccionController } from '../controllers/PerfilReaccionController';
import { autenticar } from '../middlewares/authMiddleware';

export function perfilReaccionRouter(ctrl: PerfilReaccionController): Router {
  const r = Router();

  r.post('/', autenticar, ctrl.crear);
  r.get('/recibidas', autenticar, ctrl.recibidas);

  return r;
}