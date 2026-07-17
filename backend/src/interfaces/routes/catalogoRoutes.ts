import { Router } from 'express';
import { CatalogoController } from '../controllers/CatalogoController';

export function catalogoRouter(ctrl: CatalogoController): Router {
  const r = Router();
  r.get('/carreras', ctrl.carreras);
  r.get('/departamentos', ctrl.departamentos);
  r.get('/centros-regionales', ctrl.centrosRegionales);
  r.get('/facultades', ctrl.facultades);
  return r;
}