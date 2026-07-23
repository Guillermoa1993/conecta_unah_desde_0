import { Router } from 'express';
import { PermisoSeguridadController } from '../controllers/PermisoSeguridadController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function permisoSeguridadRouter(ctrl: PermisoSeguridadController): Router {
  const r = Router();

  // Lectura abierta a cualquier usuario autenticado (alimenta combobox);
  // escritura exclusiva de ADMIN.
  r.get('/',    autenticar, ctrl.getAll);
  r.get('/:id', autenticar, ctrl.getById);

  r.post('/',   autenticar, autorizar('ADMIN'), ctrl.create);
  r.put('/:id', autenticar, autorizar('ADMIN'), ctrl.update);
  r.delete('/:id', autenticar, autorizar('ADMIN'), ctrl.remove);

  return r;
}
