import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/authMiddleware';
import pool from '../../infrastructure/database/db';

const r = Router();

// GET reaction counts and user reactions
r.get('/', autenticar, async (req: Request, res: Response) => {
  try {
    const id_usuario = req.usuario!.id;

    const [countsRes, userRes] = await Promise.all([
      pool.query(`
        SELECT id_evento, id_publicacion, tipo, COUNT(*)::int as count
        FROM tabla_grupo_2_reacciones
        GROUP BY id_evento, id_publicacion, tipo
      `),
      pool.query(`
        SELECT id_evento, id_publicacion, tipo
        FROM tabla_grupo_2_reacciones
        WHERE id_usuario = $1
      `, [id_usuario])
    ]);

    res.json({
      counts: countsRes.rows,
      userReactions: userRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reacciones' });
  }
});

// POST or DELETE a reaction (Toggle)
r.post('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { id_evento, id_publicacion, tipo } = req.body;
    const id_usuario = req.usuario!.id;

    if (!tipo) {
      // If tipo is null or empty, delete reaction (User removed their reaction)
      if (id_evento) {
        await pool.query(
          `DELETE FROM tabla_grupo_2_reacciones WHERE id_usuario = $1 AND id_evento = $2`,
          [id_usuario, Number(id_evento)]
        );
      } else if (id_publicacion) {
        await pool.query(
          `DELETE FROM tabla_grupo_2_reacciones WHERE id_usuario = $1 AND id_publicacion = $2`,
          [id_usuario, Number(id_publicacion)]
        );
      }
      res.json({ ok: true, mensaje: 'Reacción eliminada' });
      return;
    }

    // Upsert reaction
    if (id_evento) {
      // Check if reaction exists
      const existing = await pool.query(
        `SELECT id_reaccion FROM tabla_grupo_2_reacciones WHERE id_usuario = $1 AND id_evento = $2`,
        [id_usuario, Number(id_evento)]
      );

      if (existing.rows.length > 0) {
        // Update
        await pool.query(
          `UPDATE tabla_grupo_2_reacciones SET tipo = $1, fecha_creacion = NOW() WHERE id_usuario = $2 AND id_evento = $3`,
          [tipo, id_usuario, Number(id_evento)]
        );
      } else {
        // Insert
        await pool.query(
          `INSERT INTO tabla_grupo_2_reacciones (id_usuario, id_evento, tipo, fecha_creacion) VALUES ($1, $2, $3, NOW())`,
          [id_usuario, Number(id_evento), tipo]
        );
      }
    } else if (id_publicacion) {
      // Check if reaction exists
      const existing = await pool.query(
        `SELECT id_reaccion FROM tabla_grupo_2_reacciones WHERE id_usuario = $1 AND id_publicacion = $2`,
        [id_usuario, Number(id_publicacion)]
      );

      if (existing.rows.length > 0) {
        // Update
        await pool.query(
          `UPDATE tabla_grupo_2_reacciones SET tipo = $1, fecha_creacion = NOW() WHERE id_usuario = $2 AND id_publicacion = $3`,
          [tipo, id_usuario, Number(id_publicacion)]
        );
      } else {
        // Insert
        await pool.query(
          `INSERT INTO tabla_grupo_2_reacciones (id_usuario, id_publicacion, tipo, fecha_creacion) VALUES ($1, $2, $3, NOW())`,
          [id_usuario, Number(id_publicacion), tipo]
        );
      }
    }

    res.json({ ok: true, mensaje: 'Reacción registrada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar reacción' });
  }
});

export { r as reaccionPostRouter };