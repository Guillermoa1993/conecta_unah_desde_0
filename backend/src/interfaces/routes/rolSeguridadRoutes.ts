import { Router } from 'express';
import { RolSeguridadController } from '../controllers/RolSeguridadController';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';

export function rolSeguridadRouter(ctrl: RolSeguridadController): Router {
  const r = Router();

  // Lectura: ADMIN/DEV gestionan, pero cualquier usuario autenticado puede
  // consultar el catálogo (lo necesitan los combobox de "Gestión de Usuarios").
  r.get('/',    autenticar, ctrl.getAll);
  r.get('/:id', autenticar, ctrl.getById);

  r.post('/',   autenticar, requireSystemAdmin, ctrl.create);
  r.put('/:id', autenticar, requireSystemAdmin, ctrl.update);
  r.delete('/:id', autenticar, requireSystemAdmin, ctrl.remove);

  r.post('/:id/permisos',              autenticar, requireSystemAdmin, ctrl.asignarPermiso);
  r.delete('/:id/permisos/:idPermiso', autenticar, requireSystemAdmin, ctrl.revocarPermiso);

  return r;
}
