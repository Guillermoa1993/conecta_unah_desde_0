import { Router, Request, Response } from 'express';
import { autenticar } from '../middlewares/authMiddleware';
import pool from '../../infrastructure/database/db';
import { reloadConfig } from '../../infrastructure/config/configService';
import { resetMsalClient } from '../../infrastructure/auth/msalConfig';

const r = Router();

// Público — datos de soporte (correo y whatsapp)
r.get('/soporte', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT nombre, valor FROM tabla_grupo_1_parametros WHERE nombre IN ('CORREO_SOPORTE','WHATSAPP_SOPORTE')"
    );
    const data: Record<string, string> = {};
    result.rows.forEach((r: { nombre: string; valor: string }) => { data[r.nombre] = r.valor; });
    res.json({ correo: data['CORREO_SOPORTE'] ?? '', whatsapp: data['WHATSAPP_SOPORTE'] ?? '' });
  } catch { res.json({ correo: '', whatsapp: '' }); }
});

// Público — sin token — estado PWA
r.get('/status-pwa', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT valor FROM tabla_grupo_1_parametros WHERE nombre = 'MODO_PWA'"
    );
    res.json({ pwa: result.rows[0]?.valor === '1' });
  } catch { res.json({ pwa: false }); }
});

// Manifest dinámico — solo activo cuando MODO_PWA=1
r.get('/manifest.webmanifest', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT valor FROM tabla_grupo_1_parametros WHERE nombre = 'MODO_PWA'"
    );
    if (result.rows[0]?.valor !== '1') {
      res.status(404).json({ error: 'PWA desactivado' });
      return;
    }
    res.setHeader('Content-Type', 'application/manifest+json');
    res.json({
      name: 'Conecta Pumas UNAH',
      short_name: 'ConectaPumas',
      description: 'Plataforma oficial de conexión institucional para estudiantes y docentes de la UNAH',
      start_url: '/',
      display: 'standalone',
      background_color: '#004B87',
      theme_color: '#004B87',
      orientation: 'portrait',
      scope: '/',
      lang: 'es-HN',
      categories: ['education', 'utilities'],
      icons: [
        { src: '/puma_unah.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/puma_unah.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    });
  } catch { res.status(500).json({ error: 'Error' }); }
});

// Público — sin token — el frontend lo llama para verificar modo mantenimiento
r.get('/status', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT valor FROM tabla_grupo_1_parametros WHERE nombre = 'MODO_MANTENIMIENTO'"
    );
    res.json({ mantenimiento: result.rows[0]?.valor === '1' });
  } catch { res.json({ mantenimiento: false }); }
});

r.get('/', autenticar, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM tabla_grupo_1_parametros ORDER BY id_parametro');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Error al obtener parámetros' }); }
});

r.put('/:nombre', autenticar, async (req: Request, res: Response) => {
  try {
    const { nombre } = req.params;
    const { valor } = req.body;
    await pool.query('UPDATE tabla_grupo_1_parametros SET valor = $1 WHERE nombre = $2', [valor, nombre]);
    // Recarga config en memoria y resetea cliente MSAL si cambió algo de Azure
    await reloadConfig();
    if (['AZURE_CLIENT_ID','AZURE_CLIENT_SECRET','AZURE_TENANT_ID'].includes(nombre as string)) {
      resetMsalClient();
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: 'Error al actualizar parámetro' }); }
});

r.post('/', autenticar, async (req: Request, res: Response) => {
  try {
    const { nombre, valor } = req.body;
    const result = await pool.query(
      'INSERT INTO tabla_grupo_1_parametros (nombre, valor) VALUES ($1, $2) RETURNING *',
      [nombre, valor ?? '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Error al crear parámetro' }); }
});

export { r as parametrosRouter };
