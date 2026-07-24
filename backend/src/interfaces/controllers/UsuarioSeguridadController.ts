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
import { BitacoraRepository } from '../../domain/repositories/BitacoraRepository';

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
    private readonly bitacoraRepo?: BitacoraRepository,
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
      const nuevo = await this.crearUC.execute(req.body);
      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          ?.registrar(actorId, `Creó el usuario ${nuevo.nombre} (${nuevo.correo})`)
          .catch(() => {});
      }
      res.status(201).json(nuevo);
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.actualizarUC.execute(Number(req.params.id), req.body));
    } catch (err) { next(err); }
  };

  inhabilitar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = Number(req.params.id);
      const resultado = await this.inhabilitarUC.execute(idUsuario, req.body.motivo);
      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          ?.registrar(actorId, `Inhabilitó al usuario #${idUsuario} (motivo: ${req.body.motivo})`)
          .catch(() => {});
      }
      res.json(resultado);
    } catch (err) { next(err); }
  };

  habilitar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = Number(req.params.id);
      const resultado = await this.habilitarUC.execute(idUsuario);
      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          ?.registrar(actorId, `Habilitó al usuario #${idUsuario}`)
          .catch(() => {});
      }
      res.json(resultado);
    } catch (err) { next(err); }
  };

  asignarRol = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = Number(req.params.id);
      const idRol = Number(req.body.id_rol);
      const resultado = await this.asignarRolUC.execute(idUsuario, idRol);
      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          ?.registrar(actorId, `Cambió el rol del usuario #${idUsuario} (nuevo id_rol: ${idRol})`)
          .catch(() => {});
      }
      res.status(201).json(resultado);
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
