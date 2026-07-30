import { Router } from 'express';
import { PermisoSeguridadController } from '../controllers/PermisoSeguridadController';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';

export function permisoSeguridadRouter(ctrl: PermisoSeguridadController): Router {
  const r = Router();

  // Lectura abierta a cualquier usuario autenticado (alimenta combobox);
  // escritura exclusiva de ADMIN y DEV.
  r.get('/',    autenticar, ctrl.getAll);
  r.get('/:id', autenticar, ctrl.getById);

  r.post('/',   autenticar, requireSystemAdmin, ctrl.create);
  r.put('/:id', autenticar, requireSystemAdmin, ctrl.update);
  r.delete('/:id', autenticar, requireSystemAdmin, ctrl.remove);

  return r;
}
