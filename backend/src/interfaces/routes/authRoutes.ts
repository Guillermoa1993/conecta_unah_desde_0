import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticar } from '../middlewares/authMiddleware';

export function authRouter(ctrl: AuthController): Router {
  const r = Router();
  r.post('/registro', ctrl.registrar);
  r.get('/me', autenticar, ctrl.perfil);
  r.get('/microsoft', ctrl.microsoftLogin);
  r.get('/microsoft/callback', ctrl.microsoftCallback);
  r.post('/otp/enviar', ctrl.enviarOtp);
  r.post('/otp/verificar', ctrl.verificarOtp);
  return r;
}
