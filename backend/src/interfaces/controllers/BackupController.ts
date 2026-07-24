import { Request, Response, NextFunction } from 'express';
import { BackupService } from '../../infrastructure/backup/BackupService';
import { BitacoraRepository } from '../../domain/repositories/BitacoraRepository';

export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly bitacoraRepo: BitacoraRepository,
  ) {}

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const backup = await this.backupService.crear();

      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          .registrar(actorId, `Generó un respaldo de la base de datos (${backup.nombre})`)
          .catch(() => {});
      }

      res.status(201).json(backup);
    } catch (err) { next(err); }
  };

  listar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const backups = await this.backupService.listar();
      res.json(backups);
    } catch (err) { next(err); }
  };

  descargar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nombre = req.params['nombre'] as string;
      const ruta = this.backupService.rutaDe(nombre);

      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          .registrar(actorId, `Descargó el respaldo ${nombre}`)
          .catch(() => {});
      }

      res.download(ruta, nombre, (err) => {
        if (err && !res.headersSent) next(err);
      });
    } catch (err) { next(err); }
  };

  eliminar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nombre = req.params['nombre'] as string;
      const ok = await this.backupService.eliminar(nombre);
      if (!ok) { res.status(404).json({ error: 'Respaldo no encontrado' }); return; }
      res.json({ ok: true });
    } catch (err) { next(err); }
  };
}