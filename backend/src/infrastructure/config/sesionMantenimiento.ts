import { Pool } from 'pg';

// Mecanismo de "cerrar todas las sesiones" sin tabla de sesiones activas:
// el JWT es sin estado, así que en vez de revocar tokens uno por uno,
// guardamos un timestamp global (tabla_grupo_1_parametros) y en cada
// petición comparamos ese timestamp contra el "iat" (issued at) del token.
// Si el token se emitió ANTES de ese timestamp, se considera cerrado.
//
// Se usa cuando se restaura un respaldo (mantenimiento del sistema): todos
// los usuarios conectados quedan deslogueados y deben iniciar sesión de nuevo.

const NOMBRE_PARAMETRO = 'sesion_valida_desde';
const TTL_CACHE_MS = 5000;

let cache: { valor: Date | null; expira: number } = { valor: null, expira: 0 };

export async function obtenerSesionValidaDesde(pool: Pool): Promise<Date | null> {
  const ahora = Date.now();
  if (ahora < cache.expira) return cache.valor;

  const { rows } = await pool.query(
    `SELECT valor FROM tabla_grupo_1_parametros WHERE nombre = $1`,
    [NOMBRE_PARAMETRO],
  );
  cache = { valor: rows[0] ? new Date(rows[0].valor) : null, expira: ahora + TTL_CACHE_MS };
  return cache.valor;
}

export async function invalidarTodasLasSesiones(pool: Pool): Promise<void> {
  const ahoraIso = new Date().toISOString();
  await pool.query(
    `INSERT INTO tabla_grupo_1_parametros (nombre, valor)
     VALUES ($1, $2)
     ON CONFLICT (nombre) DO UPDATE SET valor = EXCLUDED.valor`,
    [NOMBRE_PARAMETRO, ahoraIso],
  );
  cache = { valor: new Date(ahoraIso), expira: Date.now() + TTL_CACHE_MS };
}
