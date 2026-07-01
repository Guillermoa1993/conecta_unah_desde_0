import { Request, Response, NextFunction } from 'express';
import { RegistrarAsistenciaQR } from '../../use-cases/asistencia/RegistrarAsistenciaQR';
import { AsistenciaRepository } from '../../domain/repositories/AsistenciaRepository';

export class AsistenciaController {
  constructor(
    private readonly qrUC: RegistrarAsistenciaQR,
    private readonly asistenciaRepo: AsistenciaRepository,
  ) {}

  getByEvento = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.asistenciaRepo.findByEvento(req.params.eventoId));
    } catch (err) { next(err); }
  };

  registrarQR = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qr_token } = req.body;
      const asistencia = await this.qrUC.execute(qr_token, req.usuario!.id);
      res.status(201).json({ message: 'Asistencia registrada', asistencia });
    } catch (err) { next(err); }
  };

  registrarManual = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asistencia = await this.asistenciaRepo.registrarManual(
        req.params.eventoId,
        req.body.estudiante_id,
        req.usuario!.id,
      );
      res.status(201).json(asistencia);
    } catch (err) { next(err); }
  };
}
