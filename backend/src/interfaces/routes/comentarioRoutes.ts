import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/authMiddleware';
import pool from '../../infrastructure/database/db';
import { ModeracionService } from '../../infrastructure/moderacion/ModeracionService';

const r = Router();
const moderacionService = new ModeracionService(pool);

// GET all or filtered comments
r.get('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { id_evento, id_publicacion } = req.query;
    const id_usuario_actual = req.usuario!.id;

    let query = `
      SELECT c.*, u.nombre as usuario_nombre, u.id_rol, perf.foto_url as usuario_foto_url
      FROM tabla_grupo_2_comentario c
      JOIN tabla_grupo_1_usuario u ON c.id_usuario = u.id_usuario
      LEFT JOIN tabla_grupo_1_perfil perf ON u.id_usuario = perf.id_usuario
    `;
    const params: any[] = [];
    
    if (id_evento) {
      query += ` WHERE c.id_evento = $1`;
      params.push(Number(id_evento));
    } else if (id_publicacion) {
      query += ` WHERE c.id_publicacion = $1`;
      params.push(Number(id_publicacion));
    }
    
    query += ` ORDER BY c.fecha_creacion ASC`;
    
    const result = await pool.query(query, params);

    // Oculta los comentarios de usuarios con shadowban a todos menos a
    // ellos mismos (siguen viendo su propio comentario, nadie más lo ve).
    const idsShadowbanned = await moderacionService.idsUsuariosShadowbanned();
    const filas = idsShadowbanned.length
      ? result.rows.filter(
          (row) => row.id_usuario === id_usuario_actual || !idsShadowbanned.includes(row.id_usuario),
        )
      : result.rows;

    // Reacciones de todos los comentarios obtenidos, en un solo query
    const idsComentarios = filas.map(row => row.id_comentario);
    let countsByComment: Record<number, Record<string, number>> = {};
    let userReactionByComment: Record<number, string> = {};

    if (idsComentarios.length > 0) {
      const [countsRes, userRes] = await Promise.all([
        pool.query(
          `SELECT id_comentario, tipo, COUNT(*)::int as count
           FROM tabla_grupo_2_reaccion_comentario
           WHERE id_comentario = ANY($1)
           GROUP BY id_comentario, tipo`,
          [idsComentarios]
        ),
        pool.query(
          `SELECT id_comentario, tipo
           FROM tabla_grupo_2_reaccion_comentario
           WHERE id_comentario = ANY($1) AND id_usuario = $2`,
          [idsComentarios, id_usuario_actual]
        )
      ]);

      countsRes.rows.forEach(row => {
        if (!countsByComment[row.id_comentario]) countsByComment[row.id_comentario] = {};
        countsByComment[row.id_comentario][row.tipo] = row.count;
      });
      userRes.rows.forEach(row => {
        userReactionByComment[row.id_comentario] = row.tipo;
      });
    }
    
    // Map rows to frontend Comment format
    const comments = filas.map(row => {
      // Generate initials from user name
      const names = row.usuario_nombre.split(' ');
      const initials = names.map((n: string) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
      
      return {
        id: row.id_comentario,
        author: row.usuario_nombre,
        authorInitials: initials || 'UN',
        authorPic: row.usuario_foto_url || undefined,
        text: row.contenido,
        time: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleDateString() : "Reciente",
        replyTo: row.reply_to || undefined,
        parentId: row.parent_id || undefined,
        replyToText: row.reply_to_text || undefined,
        id_evento: row.id_evento || undefined,
        id_publicacion: row.id_publicacion || undefined,
        reactions: countsByComment[row.id_comentario] || {},
        userReaction: userReactionByComment[row.id_comentario] || null
      };
    });
    
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

// POST comment
r.post('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { id_evento, id_publicacion, parent_id, reply_to, reply_to_text, contenido } = req.body;
    const id_usuario = req.usuario!.id; // from JWT token

    const estadoModeracion = await moderacionService.obtenerEstado(id_usuario);
    if (estadoModeracion.bloqueado) {
      res.status(403).json({ error: 'Tu cuenta fue bloqueada permanentemente por infracciones repetidas.' });
      return;
    }
    if (estadoModeracion.suspendidoHasta) {
      res.status(403).json({
        error: `Tu cuenta está suspendida hasta ${estadoModeracion.suspendidoHasta.toLocaleString('es-HN')} por una infracción reportada.`,
      });
      return;
    }
    
    if (!contenido || contenido.trim() === '') {
      res.status(400).json({ error: 'El contenido del comentario no puede estar vacío' });
      return;
    }
    
    const result = await pool.query(
      `INSERT INTO tabla_grupo_2_comentario 
       (id_usuario, id_evento, id_publicacion, parent_id, reply_to, reply_to_text, contenido, fecha_creacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [
        id_usuario,
        id_evento ? Number(id_evento) : null,
        id_publicacion ? Number(id_publicacion) : null,
        parent_id ? Number(parent_id) : null,
        reply_to || null,
        reply_to_text || null,
        contenido
      ]
    );
    
    const newComment = result.rows[0];
    
    // Fetch the user's name to return the complete comment object
    const userResult = await pool.query(
      `SELECT u.nombre, perf.foto_url as usuario_foto_url 
       FROM tabla_grupo_1_usuario u
       LEFT JOIN tabla_grupo_1_perfil perf ON u.id_usuario = perf.id_usuario
       WHERE u.id_usuario = $1`,
      [id_usuario]
    );
    const userName = userResult.rows[0]?.nombre || 'Usuario';
    const names = userName.split(' ');
    const initials = names.map((n: string) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();
    
    res.status(201).json({
      id: newComment.id_comentario,
      author: userName,
      authorInitials: initials || 'UN',
      authorPic: userResult.rows[0]?.usuario_foto_url || undefined,
      text: newComment.contenido,
      time: "Ahora mismo",
      replyTo: newComment.reply_to || undefined,
      parentId: newComment.parent_id || undefined,
      replyToText: newComment.reply_to_text || undefined,
      id_evento: newComment.id_evento || undefined,
      id_publicacion: newComment.id_publicacion || undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar comentario' });
  }
});

export { r as comentarioRouter };