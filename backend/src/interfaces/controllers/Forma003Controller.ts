import { Request, Response, NextFunction } from 'express';
import { CrearRegistroForma003 } from '../../use-cases/perfil/CrearRegistroForma003';
import { ListarRegistrosForma003 } from '../../use-cases/perfil/ListarRegistrosForma003';
import { ActualizarArchivoForma003 } from '../../use-cases/perfil/ActualizarArchivoForma003';
import { ValidarRegistroForma003 } from '../../use-cases/perfil/ValidarRegistroForma003';

export class Forma003Controller {
  constructor(
    private readonly crearUC: CrearRegistroForma003,
    private readonly listarUC: ListarRegistrosForma003,
    private readonly actualizarArchivoUC: ActualizarArchivoForma003,
    private readonly validarUC: ValidarRegistroForma003,
  ) {}

  getMios = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await this.listarUC.execute(req.usuario!.id));
    } catch (err) { next(err); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const registro = await this.crearUC.execute({
        id_usuario: req.usuario!.id,
        periodo: req.body?.periodo,
        carnet_base64: req.body?.carnet_base64,
        forma003_base64: req.body?.forma003_base64,
      });
      res.status(201).json(registro);
    } catch (err) { next(err); }
  };

  actualizarArchivo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idRegistro = Number(req.params.id);
      const registro = await this.actualizarArchivoUC.execute(
        idRegistro,
        req.usuario!.id,
        req.body?.forma003_base64,
      );
      res.json(registro);
    } catch (err) { next(err); }
  };

  validar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idRegistro = Number(req.params.id);
      const registro = await this.validarUC.execute(
        idRegistro,
        req.usuario!.id,
        req.body?.estado,
        req.body?.comentario,
      );
      res.json(registro);
    } catch (err) { next(err); }
  };
}