import { Request, Response, NextFunction } from 'express';
import { GestionarConstancia } from '../../use-cases/constancias/GestionarConstancia';
import { ConstanciaRepository } from '../../domain/repositories/ConstanciaRepository';

export class ConstanciaController {
  constructor(
    private readonly gestionUC: GestionarConstancia,
    private readonly constanciaRepo: ConstanciaRepository,
  ) {}

  getMias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.constanciaRepo.findByEstudiante(String(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  getPendientes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.constanciaRepo.findPendientes());
    } catch (err) { next(err); }
  };

  solicitar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const constancia = await this.gestionUC.solicitarConstancia(String(req.usuario!.id), String(req.params.eventoId));
      res.status(201).json(constancia);
    } catch (err) { next(err); }
  };

  aprobar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.gestionUC.aprobarConstancia(String(req.params.id), String(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  rechazar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.gestionUC.rechazarConstancia(String(req.params.id), String(req.usuario!.id), req.body.motivo));
    } catch (err) { next(err); }
  };
}
