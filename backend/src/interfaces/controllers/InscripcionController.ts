import { Request, Response, NextFunction } from 'express';
import { InscribirEstudiante } from '../../use-cases/inscripciones/InscribirEstudiante';
import { CancelarInscripcion } from '../../use-cases/inscripciones/CancelarInscripcion';
import { InscripcionRepository } from '../../domain/repositories/InscripcionRepository';

export class InscripcionController {
  constructor(
    private readonly inscribirUC: InscribirEstudiante,
    private readonly cancelarUC: CancelarInscripcion,
    private readonly inscripcionRepo: InscripcionRepository,
  ) {}

  getMias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.inscripcionRepo.findByEstudiante(req.usuario!.id));
    } catch (err) { next(err); }
  };

  getByEvento = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.inscripcionRepo.findByEvento(req.params.eventoId));
    } catch (err) { next(err); }
  };

  inscribir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inscripcion = await this.inscribirUC.execute(req.usuario!.id, req.params.eventoId);
      res.status(201).json(inscripcion);
    } catch (err) { next(err); }
  };

  cancelar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.cancelarUC.execute(req.usuario!.id, req.params.eventoId);
      res.json({ message: 'Inscripción cancelada exitosamente' });
    } catch (err) { next(err); }
  };
}
