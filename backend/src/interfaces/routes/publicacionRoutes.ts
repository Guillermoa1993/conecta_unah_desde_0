import { Router, Request, Response } from 'express';
import { autenticar, autorizar } from '../middlewares/authMiddleware';
import pool from '../../infrastructure/database/db';

const r = Router();

// Roles que participan en la revisión de publicaciones
const ROLES_COORDINACION = ['COORDINACION', 'ADMIN'];
const ROLES_VOAE = ['VOAE', 'ADMIN'];
const ROLES_RECHAZAR = ['COORDINACION', 'VOAE', 'ADMIN']; // cualquiera de los dos puede rechazar en su paso

function mapPublicacion(row: any) {
  const names = (row.usuario_nombre || '').split(' ');
  const initials = names.map((n: string) => n ? n[0] : '').join('').substring(0, 2).toUpperCase();

  return {
    id: row.id_publicacion,
    author: row.usuario_nombre,
    initials: initials || 'UN',
    type: 'Publicacion',
    scope: row.categoria === 'Academico' ? 'Academico' :
           row.categoria === 'Cultural' ? 'Cultural' :
           row.categoria === 'Deportivo' ? 'Deportivo' : 'Social',
    visibility: 'Público',
    time: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleDateString() : 'Reciente',
    title: row.titulo,
    desc: row.descripcion,
    tags: Array.isArray(row.tags) ? row.tags : [],
    love: 0, like: 0, dislike: 0, haha: 0, wow: 0, sad: 0, angry: 0,
    comments: [],
    userReaction: null,
    saved: false,
    hidden: false,
    images: row.imagen_url ? [row.imagen_url] : [],
    createdAt: row.fecha_creacion ? new Date(row.fecha_creacion).getTime() : Date.now(),
    profilePic: '/puma-icon.png',
    estado: row.estado,
    motivoRechazo: row.motivo_rechazo || null,
  };
}

async function notificarEstudiante(id_usuario: number, tipoNombre: string, mensaje: string, emisorId: number, id_publicacion: number) {
  await pool.query(`
    INSERT INTO tabla_grupo_1_notificaciones
      (id_usuario, id_tipo, mensaje, leida, id_emisor, referencia_tipo, referencia_id, fecha_creacion)
    VALUES (
      $1,
      (SELECT id_tipo FROM tabla_grupo_1_tipo_notificacion WHERE nombre = $2),
      $3, FALSE, $4, 'publicacion', $5, NOW()
    )
  `, [id_usuario, tipoNombre, mensaje, emisorId, id_publicacion]);
}

// ── GET / (feed general — solo lo publicado se ve realmente en el feed;
//    el front filtra además que el propio autor vea sus pendientes) ──
r.get('/', autenticar, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM tabla_grupo_2_publicaciones p
      JOIN tabla_grupo_1_usuario u ON p.id_usuario = u.id_usuario
      ORDER BY p.fecha_creacion DESC
    `);
    res.json(result.rows.map(mapPublicacion));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener publicaciones' });
  }
});

// ── POST / (Estudiante crea la solicitud) ──
r.post('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { title, desc, scope, tags, images } = req.body;
    const id_usuario = req.usuario!.id;

    if (!title || title.trim() === '') {
      res.status(400).json({ error: 'El título no puede estar vacío' });
      return;
    }

    const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : null;

    // El estado SIEMPRE se fija en 'pendiente' en el servidor.
    const result = await pool.query(`
      INSERT INTO tabla_grupo_2_publicaciones
      (id_usuario, titulo, descripcion, categoria, tags, imagen_url, fecha_creacion, estado)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'pendiente')
      RETURNING *
    `, [id_usuario, title, desc || '', scope || 'Academico', Array.isArray(tags) ? tags : [], imageUrl]);

    const newPub = result.rows[0];
    const userResult = await pool.query(
      "SELECT nombre FROM tabla_grupo_1_usuario WHERE id_usuario = $1", [id_usuario]
    );
    const userName = userResult.rows[0]?.nombre || 'Usuario';

    res.status(201).json(mapPublicacion({ ...newPub, usuario_nombre: userName }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear publicación' });
  }
});

// ── GET /pendientes (Coordinación: solicitudes recién enviadas por estudiantes) ──
r.get('/pendientes', autenticar, autorizar(...ROLES_COORDINACION), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM tabla_grupo_2_publicaciones p
      JOIN tabla_grupo_1_usuario u ON p.id_usuario = u.id_usuario
      WHERE p.estado = 'pendiente'
      ORDER BY p.fecha_creacion ASC
    `);
    res.json(result.rows.map(mapPublicacion));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las solicitudes pendientes' });
  }
});

// ── PATCH /:id/remitir-voae (Coordinación revisó y la considera válida -> la manda a VOAE) ──
r.patch('/:id/remitir-voae', autenticar, autorizar(...ROLES_COORDINACION), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revisor_id = req.usuario!.id;

    const actual = await pool.query(`SELECT * FROM tabla_grupo_2_publicaciones WHERE id_publicacion = $1`, [id]);
    if (actual.rows.length === 0) { res.status(404).json({ error: 'Publicación no encontrada' }); return; }
    if (actual.rows[0].estado !== 'pendiente') {
      res.status(400).json({ error: 'La solicitud ya no está pendiente de revisión de Coordinación' });
      return;
    }

    const result = await pool.query(`
      UPDATE tabla_grupo_2_publicaciones
      SET estado = 'en_revision_voae', revisado_por_coordinacion = $2, fecha_revision = NOW()
      WHERE id_publicacion = $1
      RETURNING *
    `, [id, revisor_id]);

    const pub = result.rows[0];
    const userResult = await pool.query("SELECT nombre FROM tabla_grupo_1_usuario WHERE id_usuario = $1", [pub.id_usuario]);
    res.json(mapPublicacion({ ...pub, usuario_nombre: userResult.rows[0]?.nombre || 'Usuario' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al remitir la publicación a VOAE' });
  }
});

// ── GET /pendientes-voae (VOAE: solicitudes que Coordinación ya remitió) ──
r.get('/pendientes-voae', autenticar, autorizar(...ROLES_VOAE), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM tabla_grupo_2_publicaciones p
      JOIN tabla_grupo_1_usuario u ON p.id_usuario = u.id_usuario
      WHERE p.estado = 'en_revision_voae'
      ORDER BY p.fecha_creacion ASC
    `);
    res.json(result.rows.map(mapPublicacion));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las solicitudes para VOAE' });
  }
});

// ── PATCH /:id/aprobar-voae (VOAE autoriza — máxima autoridad) ──
r.patch('/:id/aprobar-voae', autenticar, autorizar(...ROLES_VOAE), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revisor_id = req.usuario!.id;

    const actual = await pool.query(`SELECT * FROM tabla_grupo_2_publicaciones WHERE id_publicacion = $1`, [id]);
    if (actual.rows.length === 0) { res.status(404).json({ error: 'Publicación no encontrada' }); return; }
    if (actual.rows[0].estado !== 'en_revision_voae') {
      res.status(400).json({ error: 'La solicitud no está en revisión de VOAE' });
      return;
    }

    const result = await pool.query(`
      UPDATE tabla_grupo_2_publicaciones
      SET estado = 'aprobado_voae', revisado_por_voae = $2, fecha_revision = NOW()
      WHERE id_publicacion = $1
      RETURNING *
    `, [id, revisor_id]);

    const pub = result.rows[0];
    const userResult = await pool.query("SELECT nombre FROM tabla_grupo_1_usuario WHERE id_usuario = $1", [pub.id_usuario]);
    res.json(mapPublicacion({ ...pub, usuario_nombre: userResult.rows[0]?.nombre || 'Usuario' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aprobar la publicación' });
  }
});

// ── GET /listas-publicar (Coordinación: aprobadas por VOAE, listas para publicar) ──
r.get('/listas-publicar', autenticar, autorizar(...ROLES_COORDINACION), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM tabla_grupo_2_publicaciones p
      JOIN tabla_grupo_1_usuario u ON p.id_usuario = u.id_usuario
      WHERE p.estado = 'aprobado_voae'
      ORDER BY p.fecha_revision ASC
    `);
    res.json(result.rows.map(mapPublicacion));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las publicaciones listas para publicar' });
  }
});

// ── GET /:id (una sola publicación — para la vista de detalle compartible) ──
r.get('/:id', autenticar, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre
      FROM tabla_grupo_2_publicaciones p
      JOIN tabla_grupo_1_usuario u ON p.id_usuario = u.id_usuario
      WHERE p.id_publicacion = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Publicación no encontrada' });
      return;
    }
    res.json(mapPublicacion(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la publicación' });
  }
});

// ── PATCH /:id/publicar (Coordinación da "Aceptar" final -> visible en el feed) ──
r.patch('/:id/publicar', autenticar, autorizar(...ROLES_COORDINACION), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revisor_id = req.usuario!.id;

    const actual = await pool.query(`SELECT * FROM tabla_grupo_2_publicaciones WHERE id_publicacion = $1`, [id]);
    if (actual.rows.length === 0) { res.status(404).json({ error: 'Publicación no encontrada' }); return; }
    if (actual.rows[0].estado !== 'aprobado_voae') {
      res.status(400).json({ error: 'La publicación todavía no ha sido aprobada por VOAE' });
      return;
    }

    const result = await pool.query(`
      UPDATE tabla_grupo_2_publicaciones
      SET estado = 'publicado', revisado_por_coordinacion = $2, fecha_revision = NOW()
      WHERE id_publicacion = $1
      RETURNING *
    `, [id, revisor_id]);

    const pub = result.rows[0];

    await notificarEstudiante(
      pub.id_usuario, 'PUBLICACION_PUBLICADA',
      `Tu publicación "${pub.titulo}" fue aprobada por VOAE y ya está publicada en el feed.`,
      revisor_id, pub.id_publicacion
    );

    const userResult = await pool.query("SELECT nombre FROM tabla_grupo_1_usuario WHERE id_usuario = $1", [pub.id_usuario]);
    res.json(mapPublicacion({ ...pub, usuario_nombre: userResult.rows[0]?.nombre || 'Usuario' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al publicar la publicación' });
  }
});

// ── PATCH /:id/rechazar (Coordinación o VOAE rechazan, según en qué paso esté) ──
r.patch('/:id/rechazar', autenticar, autorizar(...ROLES_RECHAZAR), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const revisor_id = req.usuario!.id;
    const rolQueRechaza = req.usuario!.rol;

    if (!motivo || motivo.trim() === '') {
      res.status(400).json({ error: 'El motivo de rechazo es obligatorio' });
      return;
    }

    const actual = await pool.query(`SELECT * FROM tabla_grupo_2_publicaciones WHERE id_publicacion = $1`, [id]);
    if (actual.rows.length === 0) { res.status(404).json({ error: 'Publicación no encontrada' }); return; }

    const estadoActual = actual.rows[0].estado;
    // Coordinación solo puede rechazar en el paso 'pendiente'; VOAE solo en 'en_revision_voae'
    const puedeRechazar =
      (estadoActual === 'pendiente' && (rolQueRechaza === 'COORDINACION' || rolQueRechaza === 'ADMIN')) ||
      (estadoActual === 'en_revision_voae' && (rolQueRechaza === 'VOAE' || rolQueRechaza === 'ADMIN'));

    if (!puedeRechazar) {
      res.status(400).json({ error: 'Esta solicitud no está en un paso que puedas rechazar' });
      return;
    }

    const result = await pool.query(`
      UPDATE tabla_grupo_2_publicaciones
      SET estado = 'rechazado', rechazado_por = $2, motivo_rechazo = $3, fecha_revision = NOW()
      WHERE id_publicacion = $1
      RETURNING *
    `, [id, revisor_id, motivo]);

    const pub = result.rows[0];

    await notificarEstudiante(
      pub.id_usuario, 'PUBLICACION_RECHAZADA',
      `Tu publicación "${pub.titulo}" no fue aprobada. Motivo: ${motivo}`,
      revisor_id, pub.id_publicacion
    );

    const userResult = await pool.query("SELECT nombre FROM tabla_grupo_1_usuario WHERE id_usuario = $1", [pub.id_usuario]);
    res.json(mapPublicacion({ ...pub, usuario_nombre: userResult.rows[0]?.nombre || 'Usuario' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al rechazar la publicación' });
  }
});

export { r as publicacionRouter };