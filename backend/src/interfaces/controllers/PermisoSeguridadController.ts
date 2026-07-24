import { Request, Response, NextFunction } from 'express';
import {
  CrearPermisoSeguridad,
  ObtenerPermisosSeguridad,
  ObtenerPermisoSeguridadPorId,
  ActualizarPermisoSeguridad,
  EliminarPermisoSeguridad,
} from '../../use-cases/seguridad/PermisoSeguridadUseCases';

export class PermisoSeguridadController {
  constructor(
    private readonly crearUC: CrearPermisoSeguridad,
    private readonly obtenerTodosUC: ObtenerPermisosSeguridad,
    private readonly obtenerUnoUC: ObtenerPermisoSeguridadPorId,
    private readonly actualizarUC: ActualizarPermisoSeguridad,
    private readonly eliminarUC: EliminarPermisoSeguridad,
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.obtenerTodosUC.execute(req.query.modulo as string | undefined)); }
    catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.obtenerUnoUC.execute(Number(req.params.id))); } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json(await this.crearUC.execute(req.body)); } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.actualizarUC.execute(Number(req.params.id), req.body)); } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.eliminarUC.execute(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  };
}
