import { Router } from 'express';
import { BitacoraController } from '../controllers/BitacoraController';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';

export function bitacoraRouter(ctrl: BitacoraController): Router {
  const r = Router();

  r.get('/',                 autenticar, requireSystemAdmin, ctrl.listar);
  r.get('/usuario/:id_usuario', autenticar, requireSystemAdmin, ctrl.listarPorUsuario);

  return r;
}