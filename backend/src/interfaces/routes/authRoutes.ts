import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { autenticar } from '../middlewares/authMiddleware';
import { cfg } from '../../infrastructure/config/configService';

export function authRouter(ctrl: AuthController): Router {
  const r = Router();
  r.post('/registro', ctrl.registrar);
  r.get('/me', autenticar, ctrl.perfil);
  r.put('/me', autenticar, ctrl.actualizarPerfil);
  r.get('/microsoft', ctrl.microsoftLogin);
  r.get('/microsoft/callback', ctrl.microsoftCallback);
  r.post('/otp/enviar', ctrl.enviarOtp);
  r.post('/otp/verificar', ctrl.verificarOtp);
  r.post('/registro-estudiante', ctrl.registrarEstudiante);
  r.post('/registro-empleado', ctrl.registrarEmpleado);
  r.post('/otp-registro/enviar', ctrl.enviarOtpRegistro);
  r.get('/verificar-correo', ctrl.verificarCorreoExistente);
  if (process.env.NODE_ENV !== 'production' || cfg('MODO_DEV') === '1') {
    r.post('/dev-login', ctrl.devLogin);
  }
  return r;
}
