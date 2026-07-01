import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticar } from '../middlewares/authMiddleware';

export function authRouter(ctrl: AuthController): Router {
  const r = Router();
  r.post('/login', ctrl.login);
  r.post('/registro', ctrl.registrar);
  r.get('/me', autenticar, ctrl.perfil);
  return r;
}
