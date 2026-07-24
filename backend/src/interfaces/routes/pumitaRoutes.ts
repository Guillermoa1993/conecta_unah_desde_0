import { Router } from 'express';
import { PumitaController } from '../controllers/PumitaController';
import { autenticar } from '../middlewares/authMiddleware';

export function pumitaRouter(ctrl: PumitaController): Router {
  const r = Router();
  r.get('/conexiones', autenticar, ctrl.getConexiones);
  r.get('/pendientes', autenticar, ctrl.getPendientes);
  r.get('/sugeridos', autenticar, ctrl.getSugeridos);
  r.get('/enviadas', autenticar, ctrl.getEnviadas);
  r.post('/', autenticar, ctrl.enviar);
  r.patch('/:id/aceptar', autenticar, ctrl.aceptar);
  r.delete('/:id', autenticar, ctrl.eliminar);
  return r;
}