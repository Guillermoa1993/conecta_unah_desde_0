import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { autenticar, requireSystemAdmin } from '../middlewares/authMiddleware';

export function backupRouter(ctrl: BackupController): Router {
  const r = Router();

  r.post('/',             autenticar, requireSystemAdmin, ctrl.crear);
  r.get('/',              autenticar, requireSystemAdmin, ctrl.listar);
  r.get('/:nombre',       autenticar, requireSystemAdmin, ctrl.descargar);
  r.delete('/:nombre',    autenticar, requireSystemAdmin, ctrl.eliminar);
  r.post('/:nombre/restaurar', autenticar, requireSystemAdmin, ctrl.restaurar);

  return r;
}
