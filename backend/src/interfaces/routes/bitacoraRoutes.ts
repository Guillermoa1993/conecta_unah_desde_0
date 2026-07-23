import { Router } from 'express';
import { BitacoraController } from '../controllers/BitacoraController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function bitacoraRouter(ctrl: BitacoraController): Router {
  const r = Router();

  r.get('/',                 autenticar, autorizar('ADMIN'), ctrl.listar);
  r.get('/usuario/:id_usuario', autenticar, autorizar('ADMIN'), ctrl.listarPorUsuario);

  return r;
}