import { Router } from 'express';
import { UsuarioSeguridadController } from '../controllers/UsuarioSeguridadController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function usuarioSeguridadRouter(ctrl: UsuarioSeguridadController): Router {
  const r = Router();

  // Toda la gestión de usuarios del módulo de seguridad es exclusiva de ADMIN.
  r.get('/',                    autenticar, autorizar('ADMIN'), ctrl.getAll);
  r.get('/:id',                 autenticar, autorizar('ADMIN'), ctrl.getById);
  r.post('/',                   autenticar, autorizar('ADMIN'), ctrl.create);
  r.put('/:id',                 autenticar, autorizar('ADMIN'), ctrl.update);
  r.patch('/:id/inhabilitar',   autenticar, autorizar('ADMIN'), ctrl.inhabilitar);
  r.patch('/:id/habilitar',     autenticar, autorizar('ADMIN'), ctrl.habilitar);

  r.post('/:id/roles',          autenticar, autorizar('ADMIN'), ctrl.asignarRol);
  r.delete('/:id/roles/:idRol', autenticar, autorizar('ADMIN'), ctrl.revocarRol);

  r.post('/:id/permisos',              autenticar, autorizar('ADMIN'), ctrl.asignarPermiso);
  r.delete('/:id/permisos/:idPermiso', autenticar, autorizar('ADMIN'), ctrl.revocarPermiso);

  return r;
}
