import { Request, Response, NextFunction } from 'express';
import { ListarEventosGrupo2 } from '../../use-cases/mis-eventos/ListarEventosGrupo2';
import { InscribirEventoGrupo2 } from '../../use-cases/mis-eventos/InscribirEventoGrupo2';
import { CancelarInscripcionGrupo2 } from '../../use-cases/mis-eventos/CancelarInscripcionGrupo2';
import { RegistrarAsistenciaGrupo2 } from '../../use-cases/mis-eventos/RegistrarAsistenciaGrupo2';

export class Grupo2EventoController {
  constructor(
    private readonly listarUC: ListarEventosGrupo2,
    private readonly inscribirUC: InscribirEventoGrupo2,
    private readonly cancelarUC: CancelarInscripcionGrupo2,
    private readonly registrarAsistenciaUC: RegistrarAsistenciaGrupo2
  ) {}

  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;
      const eventos = await this.listarUC.execute(idUsuario);
      res.json(eventos);
    } catch (err) {
      next(err);
    }
  };

  inscribir = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;
      const idEvento = parseInt(String(req.params.id), 10);
      await this.inscribirUC.execute(idUsuario, idEvento);
      res.json({ message: 'Inscripción realizada con éxito' });
    } catch (err) {
      next(err);
    }
  };

  cancelar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;
      const idEvento = parseInt(String(req.params.id), 10);
      await this.cancelarUC.execute(idUsuario, idEvento);
      res.json({ message: 'Inscripción cancelada con éxito' });
    } catch (err) {
      next(err);
    }
  };

  registrarAsistencia = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idUsuario = req.usuario!.id;
      const idEvento = parseInt(String(req.params.id), 10);
      const { tipo, lat, lng } = req.body;
      await this.registrarAsistenciaUC.execute(idUsuario, idEvento, tipo, lat, lng);
      res.json({ message: `Asistencia de ${tipo} registrada correctamente` });
    } catch (err) {
      next(err);
    }
  };
}
