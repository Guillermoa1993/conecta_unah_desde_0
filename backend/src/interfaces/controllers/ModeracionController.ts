import { Request, Response } from 'express';
import { ModeracionService } from '../../infrastructure/moderacion/ModeracionService';

export class ModeracionController {
  constructor(private readonly service: ModeracionService) {}

  reportar = async (req: Request, res: Response): Promise<void> => {
    try {
      const idComentario = req.body.id_comentario ? Number(req.body.id_comentario) : undefined;
      const idPublicacion = req.body.id_publicacion ? Number(req.body.id_publicacion) : undefined;
      const motivo = String(req.body.motivo || '').trim();
      const idUsuario = req.usuario!.id;

      if ((!idComentario && !idPublicacion) || !motivo) {
        res.status(400).json({ error: 'id_comentario o id_publicacion y motivo son requeridos' });
        return;
      }

      if (idComentario) {
        await this.service.reportarComentario(idComentario, idUsuario, motivo);
      } else {
        await this.service.reportarPublicacion(idPublicacion!, idUsuario, motivo);
      }

      res.status(201).json({ ok: true, mensaje: 'Reporte enviado. Un administrador lo revisará.' });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  listarPendientes = async (_req: Request, res: Response): Promise<void> => {
    try {
      const reportes = await this.service.listarReportesPendientes();
      res.json(reportes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener reportes' });
    }
  };

  aprobar = async (req: Request, res: Response): Promise<void> => {
    try {
      const idReporte = Number(req.params['id']);
      const idAdmin = req.usuario!.id;
      const resultado = await this.service.aprobarReporte(idReporte, idAdmin);
      res.json({ ok: true, ...resultado });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  descartar = async (req: Request, res: Response): Promise<void> => {
    try {
      const idReporte = Number(req.params['id']);
      const idAdmin = req.usuario!.id;
      await this.service.descartarReporte(idReporte, idAdmin);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  miEstado = async (req: Request, res: Response): Promise<void> => {
    try {
      const idUsuario = req.usuario!.id;
      const estado = await this.service.obtenerEstado(idUsuario);
      res.json(estado);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener estado de moderación' });
    }
  };
}