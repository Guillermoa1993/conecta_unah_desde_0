import { Router } from 'express';
import { EventoController } from '../controllers/EventoController';
import { autenticar, autorizar } from '../middlewares/authMiddleware';

export function eventoRouter(ctrl: EventoController): Router {
  const r = Router();

  // Públicos (requieren solo autenticación)
  r.get('/', autenticar, ctrl.getAll);
  r.get('/mis-eventos', autenticar, autorizar('TUTOR'), ctrl.getMios);
  r.get('/pendientes', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.getPendientes);
  r.get('/:id', autenticar, ctrl.getById);

  // Tutor: crear y editar sus eventos
  r.post('/', autenticar, autorizar('TUTOR'), ctrl.create);
  r.put('/:id', autenticar, autorizar('TUTOR', 'ADMIN'), ctrl.update);

  // VOAE/Admin: aprobar o rechazar
  r.patch('/:id/aprobar', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.aprobar);
  r.patch('/:id/rechazar', autenticar, autorizar('VOAE', 'ADMIN'), ctrl.rechazar);

  return r;
}
