import { Request, Response, NextFunction } from 'express';
import { EnviarReaccionPumita, PerfilReaccionError } from '../../use-cases/perfil/EnviarReaccionPumita';
import { ListarReaccionesRecibidas } from '../../use-cases/perfil/ListarReaccionesRecibidas';

export class PerfilReaccionController {
  constructor(
    private readonly enviarReaccion: EnviarReaccionPumita,
    private readonly listarRecibidas: ListarReaccionesRecibidas,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reaccion = await this.enviarReaccion.execute({
        id_emisor: req.usuario!.id,
        id_receptor: req.body?.id_receptor,
        tipo: req.body?.tipo,
      });

      res.status(201).json({
        mensaje: 'Reacción enviada',
        reaccion,
      });
    } catch (error) {
      if (error instanceof PerfilReaccionError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Error inesperado al procesar la reacción' });
    }
  };

  recibidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reacciones = await this.listarRecibidas.execute(req.usuario!.id);
      res.json(reacciones);
    } catch (error) {
      res.status(500).json({ error: 'Error inesperado al obtener reacciones' });
    }
  };
}