import { Router } from 'express';
import { EstadoController } from '../controllers/EstadoController';
import { autenticar } from '../middlewares/authMiddleware';

export function estadoRouter(ctrl: EstadoController): Router {
  const r = Router();
  r.get('/', autenticar, ctrl.getAll);
  r.post('/', autenticar, ctrl.create);
  return r;
}