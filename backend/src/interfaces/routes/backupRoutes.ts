import { Router } from 'express';
import { BackupController } from '../controllers/BackupController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function backupRouter(ctrl: BackupController): Router {
  const r = Router();

  r.post('/',             autenticar, autorizar('ADMIN'), ctrl.crear);
  r.get('/',              autenticar, autorizar('ADMIN'), ctrl.listar);
  r.get('/:nombre',       autenticar, autorizar('ADMIN'), ctrl.descargar);
  r.delete('/:nombre',    autenticar, autorizar('ADMIN'), ctrl.eliminar);

  return r;
}
