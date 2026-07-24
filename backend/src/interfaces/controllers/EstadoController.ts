import { Request, Response, NextFunction } from 'express';
import { CrearEstado } from '../../use-cases/estados/CrearEstado';
import { ObtenerEstadosActivos } from '../../use-cases/estados/ObtenerEstadosActivos';

export class EstadoController {
  constructor(
    private readonly crearUC: CrearEstado,
    private readonly obtenerActivosUC: ObtenerEstadosActivos,
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.obtenerActivosUC.execute());
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const datos = {
        id_usuario: req.usuario!.id,
        texto_estado: req.body.texto_estado,
        foto_url: req.body.foto_url,
      };
      res.status(201).json(await this.crearUC.execute(datos));
    } catch (err) { next(err); }
  };
}