import { Request, Response, NextFunction } from 'express';
import { PostgresDashboardRepository } from '../../infrastructure/repositories/PostgresDashboardRepository';

export class DashboardController {
  constructor(private readonly repo: PostgresDashboardRepository) {}

  obtenerEstadisticas = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.repo.obtenerEstadisticas();
      res.json(stats);
    } catch (err) { next(err); }
  };
}