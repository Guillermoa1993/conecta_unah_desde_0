import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function dashboardRouter(ctrl: DashboardController): Router {
  const r = Router();

  r.get('/stats', autenticar, autorizar('ADMIN'), ctrl.obtenerEstadisticas);

  return r;
}