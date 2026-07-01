import { Request, Response, NextFunction } from 'express';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';

export class NotificacionController {
  constructor(private readonly notificacionRepo: NotificacionRepository) {}

  getMias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.notificacionRepo.findByUsuario(req.usuario!.id));
    } catch (err) { next(err); }
  };

  getNoLeidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.notificacionRepo.findNoLeidas(req.usuario!.id);
      res.json({ count: lista.length, notificaciones: lista });
    } catch (err) { next(err); }
  };

  marcarLeida = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.notificacionRepo.marcarLeida(req.params.id);
      res.json({ message: 'Notificación marcada como leída' });
    } catch (err) { next(err); }
  };

  marcarTodasLeidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.notificacionRepo.marcarTodasLeidas(req.usuario!.id);
      res.json({ message: `${count} notificaciones marcadas como leídas` });
    } catch (err) { next(err); }
  };
}
