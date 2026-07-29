import { Request, Response, NextFunction } from 'express';
import { BackupService } from '../../infrastructure/backup/BackupService';
import { BitacoraRepository } from '../../domain/repositories/BitacoraRepository';

export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly bitacoraRepo: BitacoraRepository,
  ) {}

  private identidadDe(req: Request): string {
    // "iniciado_por"/"solicitado_por" son varchar libres en las tablas reales
    // (no FK a usuario): guardamos el id del usuario autenticado.
    return req.usuario ? `usuario_${req.usuario.id}` : 'desconocido';
  }

  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const backup = await this.backupService.crear(this.identidadDe(req));

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

      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          .registrar(actorId, `Eliminó el respaldo ${nombre}`)
          .catch(() => {});
      }

      res.json({ ok: true });
    } catch (err) { next(err); }
  };

  restaurar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nombre = req.params['nombre'] as string;
      const motivo = req.body?.motivo as string | undefined;

      await this.backupService.restaurar(nombre, this.identidadDe(req), motivo);

      const actorId = req.usuario?.id;
      if (actorId) {
        await this.bitacoraRepo
          .registrar(
            actorId,
            `Restauró la base de datos desde el respaldo ${nombre}. Se cerraron todas las sesiones activas por mantenimiento.`,
          )
          .catch(() => {});
      }

      res.json({ ok: true, mensaje: 'Restauración completada. Todas las sesiones activas se cerraron por mantenimiento.' });
    } catch (err) { next(err); }
  };
}
