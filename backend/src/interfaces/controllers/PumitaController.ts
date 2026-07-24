import { Request, Response, NextFunction } from 'express';
import { ListarConexiones } from '../../use-cases/pumitas/ListarConexiones';
import { ListarSolicitudesPendientes } from '../../use-cases/pumitas/ListarSolicitudesPendientes';
import { ListarSugeridos } from '../../use-cases/pumitas/ListarSugeridos';
import { ListarSolicitudesEnviadas } from '../../use-cases/pumitas/ListarSolicitudesEnviadas';
import { GestionarSolicitud } from '../../use-cases/pumitas/GestionarSolicitud';

export class PumitaController {
  constructor(
    private readonly listarConexionesUC: ListarConexiones,
    private readonly listarPendientesUC: ListarSolicitudesPendientes,
    private readonly listarSugeridosUC: ListarSugeridos,
    private readonly listarEnviadasUC: ListarSolicitudesEnviadas,
    private readonly gestionarUC: GestionarSolicitud,
  ) {}

  getConexiones = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.listarConexionesUC.execute(Number(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  getPendientes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.listarPendientesUC.execute(Number(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  getSugeridos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.listarSugeridosUC.execute(Number(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  getEnviadas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.listarEnviadasUC.execute(Number(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  enviar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.gestionarUC.enviar(Number(req.usuario!.id), Number(req.body.id_usuario));
      res.status(201).json({ ok: true });
    } catch (err) { next(err); }
  };

  aceptar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.gestionarUC.aceptar(Number(req.params.id), Number(req.usuario!.id));
      res.json({ ok: true });
    } catch (err) { next(err); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.gestionarUC.eliminar(Number(req.params.id), Number(req.usuario!.id));
      res.json({ ok: true });
    } catch (err) { next(err); }
  };
}