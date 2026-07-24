import { Router } from 'express';
import { RolSeguridadController } from '../controllers/RolSeguridadController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function rolSeguridadRouter(ctrl: RolSeguridadController): Router {
  const r = Router();

  // Lectura: ADMIN gestiona, pero cualquier usuario autenticado puede
  // consultar el catálogo (lo necesitan los combobox de "Gestión de Usuarios").
  r.get('/',    autenticar, ctrl.getAll);
  r.get('/:id', autenticar, ctrl.getById);

  r.post('/',   autenticar, autorizar('ADMIN'), ctrl.create);
  r.put('/:id', autenticar, autorizar('ADMIN'), ctrl.update);
  r.delete('/:id', autenticar, autorizar('ADMIN'), ctrl.remove);

  r.post('/:id/permisos',              autenticar, autorizar('ADMIN'), ctrl.asignarPermiso);
  r.delete('/:id/permisos/:idPermiso', autenticar, autorizar('ADMIN'), ctrl.revocarPermiso);

  return r;
}
