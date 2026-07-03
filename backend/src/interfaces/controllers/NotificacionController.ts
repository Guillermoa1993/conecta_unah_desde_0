import { Request, Response, NextFunction } from 'express';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';

export class NotificacionController {
  constructor(private readonly notificacionRepo: NotificacionRepository) {}

  getMias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.notificacionRepo.findByUsuario(req.usuario!.id);
      res.json(lista);
    } catch (err) { next(err); }
  };

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usuario_id, mensaje, tipo } = req.body as { usuario_id: number; mensaje: string; tipo: string };
      if (!usuario_id || !mensaje || !tipo) {
        res.status(400).json({ error: 'usuario_id, mensaje y tipo son requeridos' });
        return;
      }
      const notif = await this.notificacionRepo.crear({ usuario_id, mensaje, tipo });
      res.status(201).json(notif);
    } catch (err) { next(err); }
  };

  marcarLeida = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params['id'] as string);
      const ok = await this.notificacionRepo.marcarLeida(id, req.usuario!.id);
      if (!ok) { res.status(404).json({ error: 'Notificación no encontrada' }); return; }
      res.json({ ok: true });
    } catch (err) { next(err); }
  };

  marcarTodasLeidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.notificacionRepo.marcarTodasLeidas(req.usuario!.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  };
}
