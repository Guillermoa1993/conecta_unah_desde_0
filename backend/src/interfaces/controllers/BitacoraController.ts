import { Request, Response, NextFunction } from 'express';
import { BitacoraRepository } from '../../domain/repositories/BitacoraRepository';

export class BitacoraController {
  constructor(private readonly bitacoraRepo: BitacoraRepository) {}

  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 100;
      const entradas = await this.bitacoraRepo.findAll(limit);
      res.json(entradas);
    } catch (err) { next(err); }
  };

  listarPorUsuario = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id_usuario = parseInt(req.params['id_usuario'] as string);
      const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 100;
      const entradas = await this.bitacoraRepo.findByUsuario(id_usuario, limit);
      res.json(entradas);
    } catch (err) { next(err); }
  };
}