import { NextFunction, Request, Response } from 'express';
import { CrearSolicitudCambioCarrera, SolicitudCambioCarreraError } from '../../use-cases/cambio-carrera/CrearSolicitudCambioCarrera';
import { ObtenerMiSolicitudCambioCarrera } from '../../use-cases/cambio-carrera/ObtenerMiSolicitudCambioCarrera';
import { ObtenerCatalogosCambioCarrera } from '../../use-cases/cambio-carrera/ObtenerCatalogosCambioCarrera';

export class SolicitudCambioCarreraController {
  constructor(
    private readonly crearSolicitud: CrearSolicitudCambioCarrera,
    private readonly obtenerMiSolicitud: ObtenerMiSolicitudCambioCarrera,
    private readonly obtenerCatalogos: ObtenerCatalogosCambioCarrera,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const solicitud = await this.crearSolicitud.execute({
        id_usuario: req.usuario!.id,
        id_carrera_solicitada: req.body?.id_carrera_solicitada,
        id_centro_regional_solicitado: req.body?.id_centro_regional_solicitado,
        motivo: req.body?.motivo,
      });
      res.status(201).json({ solicitud });
    } catch (error) { this.manejarError(error, res, next); }
  };

  mia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const solicitud = await this.obtenerMiSolicitud.execute(req.usuario!.id);
      res.json({ solicitud });
    } catch (error) { this.manejarError(error, res, next); }
  };

  catalogos = async (req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.obtenerCatalogos.execute(req.usuario!.id)); }
    catch (error) { this.manejarError(error, res, next); }
  };

  private manejarError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof SolicitudCambioCarreraError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error('[SolicitudCambioCarrera]', error instanceof Error ? error.message : 'Error desconocido');
    res.status(500).json({ error: 'No se pudo procesar la solicitud de cambio de carrera' });
  }
}
