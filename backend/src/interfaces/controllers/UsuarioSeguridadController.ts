import { Request, Response, NextFunction } from 'express';
import {
  CrearUsuarioSeguridad,
  ObtenerUsuariosSeguridad,
  ObtenerUsuarioSeguridadPorId,
  ActualizarUsuarioSeguridad,
  InhabilitarUsuarioSeguridad,
  HabilitarUsuarioSeguridad,
  AsignarRolAUsuario,
  RevocarRolDeUsuario,
  AsignarPermisoDirectoAUsuario,
  RevocarPermisoDirectoDeUsuario,
} from '../../use-cases/seguridad/UsuarioSeguridadUseCases';

export class UsuarioSeguridadController {
  constructor(
    private readonly crearUC: CrearUsuarioSeguridad,
    private readonly obtenerTodosUC: ObtenerUsuariosSeguridad,
    private readonly obtenerUnoUC: ObtenerUsuarioSeguridadPorId,
    private readonly actualizarUC: ActualizarUsuarioSeguridad,
    private readonly inhabilitarUC: InhabilitarUsuarioSeguridad,
    private readonly habilitarUC: HabilitarUsuarioSeguridad,
    private readonly asignarRolUC: AsignarRolAUsuario,
    private readonly revocarRolUC: RevocarRolDeUsuario,
    private readonly asignarPermisoUC: AsignarPermisoDirectoAUsuario,
    private readonly revocarPermisoUC: RevocarPermisoDirectoDeUsuario,
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = {
        busqueda: req.query.busqueda as string | undefined,
        estado: req.query.estado !== undefined ? Number(req.query.estado) : undefined,
      };
      res.json(await this.obtenerTodosUC.execute(filtros));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.obtenerUnoUC.execute(Number(req.params.id)));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.crearUC.execute(req.body));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.actualizarUC.execute(Number(req.params.id), req.body));
    } catch (err) { next(err); }
  };

  inhabilitar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.inhabilitarUC.execute(Number(req.params.id), req.body.motivo));
    } catch (err) { next(err); }
  };

  habilitar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.habilitarUC.execute(Number(req.params.id)));
    } catch (err) { next(err); }
  };

  asignarRol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.asignarRolUC.execute(Number(req.params.id), Number(req.body.id_rol)));
    } catch (err) { next(err); }
  };

  revocarRol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.revocarRolUC.execute(Number(req.params.id), Number(req.params.idRol)));
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
