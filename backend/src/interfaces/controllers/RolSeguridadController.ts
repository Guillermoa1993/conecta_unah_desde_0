import { Request, Response, NextFunction } from 'express';
import {
  CrearRolSeguridad,
  ObtenerRolesSeguridad,
  ObtenerRolSeguridadPorId,
  ActualizarRolSeguridad,
  EliminarRolSeguridad,
  AsignarPermisoARol,
  RevocarPermisoDeRol,
} from '../../use-cases/seguridad/RolSeguridadUseCases';

export class RolSeguridadController {
  constructor(
    private readonly crearUC: CrearRolSeguridad,
    private readonly obtenerTodosUC: ObtenerRolesSeguridad,
    private readonly obtenerUnoUC: ObtenerRolSeguridadPorId,
    private readonly actualizarUC: ActualizarRolSeguridad,
    private readonly eliminarUC: EliminarRolSeguridad,
    private readonly asignarPermisoUC: AsignarPermisoARol,
    private readonly revocarPermisoUC: RevocarPermisoDeRol,
  ) {}

  getAll = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.obtenerTodosUC.execute()); } catch (err) { next(err); }
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

  asignarPermiso = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(
        await this.asignarPermisoUC.execute(Number(req.params.id), Number(req.body.id_permiso)),
      );
    } catch (err) { next(err); }
  };

  revocarPermiso = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(
        await this.revocarPermisoUC.execute(Number(req.params.id), Number(req.params.idPermiso)),
      );
    } catch (err) { next(err); }
  };
}
