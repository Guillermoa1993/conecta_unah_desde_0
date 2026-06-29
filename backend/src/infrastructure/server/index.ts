import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from '../database/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;

// ── Middlewares ────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS tiempo');
    res.json({
      status: 'ok',
      servidor: 'UNAH Conecta Pumas API',
      base_de_datos: 'conectada',
      tiempo_bd: result.rows[0].tiempo,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      servidor: 'UNAH Conecta Pumas API',
      base_de_datos: 'sin conexión',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

// ── Rutas (agregar aquí a medida que se implementen) ───────────
// import authRoutes from '../../interfaces/routes/authRoutes';
// app.use('/api/auth', authRoutes);

// ── Error 404 ──────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Iniciar servidor ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   UNAH Conecta Pumas — Backend       ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\n  Servidor:  http://localhost:${PORT}`);
  console.log(`  Salud:     http://localhost:${PORT}/api/health`);
  console.log('\n  Arquitectura: Clean Architecture');
  console.log('  BD: PostgreSQL en Render.com\n');
});

export default app;
