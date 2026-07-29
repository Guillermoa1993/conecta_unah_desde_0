import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/authMiddleware';
import pool from '../../infrastructure/database/db';

const r = Router();

// GET conteo de reacciones por comentario + reacciones del usuario actual
r.get('/', autenticar, async (req: Request, res: Response) => {
  try {
    const id_usuario = req.usuario!.id;

    const [countsRes, userRes] = await Promise.all([
      pool.query(`
        SELECT id_comentario, tipo, COUNT(*)::int as count
        FROM tabla_grupo_2_reaccion_comentario
        GROUP BY id_comentario, tipo
      `),
      pool.query(`
        SELECT id_comentario, tipo
        FROM tabla_grupo_2_reaccion_comentario
        WHERE id_usuario = $1
      `, [id_usuario])
    ]);

    res.json({
      counts: countsRes.rows,
      userReactions: userRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reacciones de comentarios' });
  }
});

// POST o DELETE de una reacción a un comentario (Toggle)
r.post('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { id_comentario, tipo } = req.body;
    const id_usuario = req.usuario!.id;

    if (!id_comentario) {
      res.status(400).json({ error: 'id_comentario es requerido' });
      return;
    }

    if (!tipo) {
      // tipo null/vacío = el usuario quitó su reacción
      await pool.query(
        `DELETE FROM tabla_grupo_2_reaccion_comentario WHERE id_usuario = $1 AND id_comentario = $2`,
        [id_usuario, Number(id_comentario)]
      );
      res.json({ ok: true, mensaje: 'Reacción eliminada' });
      return;
    }

    // Upsert de la reacción
    const existing = await pool.query(
      `SELECT id_reaccion FROM tabla_grupo_2_reaccion_comentario WHERE id_usuario = $1 AND id_comentario = $2`,
      [id_usuario, Number(id_comentario)]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE tabla_grupo_2_reaccion_comentario SET tipo = $1, fecha_creacion = NOW() WHERE id_usuario = $2 AND id_comentario = $3`,
        [tipo, id_usuario, Number(id_comentario)]
      );
    } else {
      await pool.query(
        `INSERT INTO tabla_grupo_2_reaccion_comentario (id_usuario, id_comentario, tipo, fecha_creacion) VALUES ($1, $2, $3, NOW())`,
        [id_usuario, Number(id_comentario), tipo]
      );
    }

    res.json({ ok: true, mensaje: 'Reacción registrada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar reacción de comentario' });
  }
});

export { r as reaccionComentarioRouter };