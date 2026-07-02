import { Request, Response, NextFunction } from 'express';
import { CrearEvento } from '../../use-cases/eventos/CrearEvento';
import { ObtenerEventos } from '../../use-cases/eventos/ObtenerEventos';
import { ObtenerEventoPorId } from '../../use-cases/eventos/ObtenerEventoPorId';
import { ActualizarEvento } from '../../use-cases/eventos/ActualizarEvento';
import { AprobarRechazarEvento } from '../../use-cases/eventos/AprobarRechazarEvento';
import { EventoRepository } from '../../domain/repositories/EventoRepository';

export class EventoController {
  constructor(
    private readonly crearUC: CrearEvento,
    private readonly obtenerTodosUC: ObtenerEventos,
    private readonly obtenerUnoUC: ObtenerEventoPorId,
    private readonly actualizarUC: ActualizarEvento,
    private readonly aprobarUC: AprobarRechazarEvento,
    private readonly eventoRepo: EventoRepository,
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = {
        estado: req.query.estado as string | undefined,
        tutor_id: req.query.tutor_id as string | undefined,
        categoria: req.query.categoria as string | undefined,
        centro_regional: req.query.centro_regional as string | undefined,
        tipo_evento: req.query.tipo_evento as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };
      res.json(await this.obtenerTodosUC.execute(filtros));
    } catch (err) { next(err); }
  };

  getMios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = { tutor_id: String(req.usuario!.id) };
      res.json(await this.obtenerTodosUC.execute(filtros));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.obtenerUnoUC.execute(String(req.params.id)));
    } catch (err) { next(err); }
  };

  getPendientes = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.eventoRepo.findPendientesAprobacion());
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const datos = { ...req.body, tutor_id: String(req.usuario!.id) };
      res.status(201).json(await this.crearUC.execute(datos));
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.actualizarUC.execute(String(req.params.id), req.body, String(req.usuario!.id), req.usuario!.rol));
    } catch (err) { next(err); }
  };

  aprobar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.aprobarUC.aprobar(String(req.params.id), String(req.usuario!.id)));
    } catch (err) { next(err); }
  };

  rechazar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.aprobarUC.rechazar(String(req.params.id), String(req.usuario!.id), req.body.motivo));
    } catch (err) { next(err); }
  };
}
