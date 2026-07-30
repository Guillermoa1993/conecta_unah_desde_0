import { Router } from 'express';
import { UsuarioSeguridadController } from '../controllers/UsuarioSeguridadController';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';

export function usuarioSeguridadRouter(ctrl: UsuarioSeguridadController): Router {
  const r = Router();

  // Toda la gestión de usuarios del módulo de seguridad es exclusiva de ADMIN y DEV.
  r.get('/',                    autenticar, requireSystemAdmin, ctrl.getAll);
  r.get('/:id',                 autenticar, requireSystemAdmin, ctrl.getById);
  r.post('/',                   autenticar, requireSystemAdmin, ctrl.create);
  r.put('/:id',                 autenticar, requireSystemAdmin, ctrl.update);
  r.patch('/:id/inhabilitar',   autenticar, requireSystemAdmin, ctrl.inhabilitar);
  r.patch('/:id/habilitar',     autenticar, requireSystemAdmin, ctrl.habilitar);

  r.post('/:id/roles',          autenticar, requireSystemAdmin, ctrl.asignarRol);
  r.delete('/:id/roles/:idRol', autenticar, requireSystemAdmin, ctrl.revocarRol);

  r.post('/:id/permisos',              autenticar, requireSystemAdmin, ctrl.asignarPermiso);
  r.delete('/:id/permisos/:idPermiso', autenticar, requireSystemAdmin, ctrl.revocarPermiso);

  return r;
}
