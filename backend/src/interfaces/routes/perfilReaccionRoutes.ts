import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { PerfilReaccionController } from '../controllers/PerfilReaccionController';
import { autenticar } from '../middlewares/authMiddleware';

export function perfilReaccionRouter(ctrl: PerfilReaccionController, pool: Pool): Router {
  const r = Router();

  r.post('/', autenticar, ctrl.crear);
  r.get('/recibidas', autenticar, ctrl.recibidas);

  // ── Interacción Social: permitir o no que otros Pumitas te envíen reacciones ──
  r.get('/interaccion-social', autenticar, async (req: Request, res: Response) => {
    try {
      const { rows } = await pool.query(
        `SELECT permite_reacciones_perfil FROM tabla_grupo_1_usuario WHERE id_usuario = $1`,
        [req.usuario!.id],
      );
      const activo = rows[0]?.permite_reacciones_perfil !== false; // default true si es NULL
      res.json({ activo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al obtener la preferencia de interacción social' });
    }
  });

  r.patch('/interaccion-social', autenticar, async (req: Request, res: Response) => {
    try {
      const activo = req.body?.activo;
      if (typeof activo !== 'boolean') {
        res.status(400).json({ error: 'El campo "activo" debe ser true o false' });
        return;
      }
      await pool.query(
        `UPDATE tabla_grupo_1_usuario SET permite_reacciones_perfil = $2 WHERE id_usuario = $1`,
        [req.usuario!.id, activo],
      );
      res.json({ activo });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error al actualizar la preferencia de interacción social' });
    }
  });

  return r;
}