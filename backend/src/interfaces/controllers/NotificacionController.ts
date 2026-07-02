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
}
