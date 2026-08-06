import { Request, Response, NextFunction } from 'express';
import { NotificacionRepository } from '../../domain/repositories/NotificacionRepository';
import { UsuarioRepository } from '../../domain/repositories/UsuarioRepository';

const GRUPOS_A_ROLES: Record<string, string[] | undefined> = {
  Todos: undefined, // sin filtro de rol = todos los usuarios
  Estudiantes: ['ESTUDIANTE'],
  Tutores: ['EMPLEADO'],
  'Personal VOAE': ['VOAE_DIRECCION', 'VOAE_DEPARTAMENTO'],
};

export class NotificacionController {
  constructor(
    private readonly notificacionRepo: NotificacionRepository,
    private readonly usuarioRepo: UsuarioRepository,
  ) {}

  getMias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.notificacionRepo.findByUsuario(req.usuario!.id);
      res.json(lista);
    } catch (err) { next(err); }
  };
  
  getNoLeidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const todas = await this.notificacionRepo.findByUsuario(req.usuario!.id);
      const noLeidas = todas.filter((n) => !n.leida);
      res.json({ count: noLeidas.length, notificaciones: noLeidas });
    } catch (err) { next(err); }
  };


  crear = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usuario_id, mensaje, tipo } = req.body as { usuario_id: number; mensaje: string; tipo: string };
      if (!usuario_id || !mensaje || !tipo) {
        res.status(400).json({ error: 'usuario_id, mensaje y tipo son requeridos' });
        return;
      }
      const notif = await this.notificacionRepo.crear({ usuario_id, mensaje, tipo });
      res.status(201).json(notif);
    } catch (err) { next(err); }
  };

  marcarLeida = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params['id'] as string);
      const ok = await this.notificacionRepo.marcarLeida(id, req.usuario!.id);
      if (!ok) { res.status(404).json({ error: 'Notificación no encontrada' }); return; }
      res.json({ ok: true });
    } catch (err) { next(err); }
  };

  marcarTodasLeidas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.notificacionRepo.marcarTodasLeidas(req.usuario!.id);
      res.json({ ok: true });
    } catch (err) { next(err); }
  };

  // Panel de admin/empleados — Centro de Notificaciones: envío masivo
  enviarMasiva = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { titulo, mensaje, tipo, destinatario_grupo } = req.body as {
        titulo: string; mensaje: string; tipo: string; destinatario_grupo: string;
      };
      if (!titulo?.trim() || !mensaje?.trim() || !tipo || !destinatario_grupo) {
        res.status(400).json({ error: 'titulo, mensaje, tipo y destinatario_grupo son requeridos' });
        return;
      }
      const roles = GRUPOS_A_ROLES[destinatario_grupo];
      if (destinatario_grupo !== 'Todos' && !roles) {
        res.status(400).json({ error: `Grupo de destinatarios desconocido: ${destinatario_grupo}` });
        return;
      }

      const destinatarios = roles
        ? (await Promise.all(roles.map((rol) => this.usuarioRepo.findAll({ rol })))).flat()
        : await this.usuarioRepo.findAll();

      const usuario_ids = destinatarios.map((u) => u.id_usuario);
      const resultado = await this.notificacionRepo.crearMasiva({
        usuario_ids,
        titulo,
        mensaje,
        tipo,
        destinatario_grupo,
        id_emisor: req.usuario!.id,
      });

      res.status(201).json({
        titulo,
        mensaje,
        tipo,
        destinatario_grupo,
        fecha_creacion: resultado.fecha_creacion,
        total_destinatarios: resultado.total,
        total_leidas: 0,
      });
    } catch (err) { next(err); }
  };

  // Panel de admin/empleados — historial de envíos masivos hechos por el usuario actual
  getEnviadas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lista = await this.notificacionRepo.findEnviadasPorEmisor(req.usuario!.id);
      res.json(lista);
    } catch (err) { next(err); }
  };
}
