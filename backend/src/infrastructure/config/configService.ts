import pool from '../database/db';

const cache: Record<string, string> = {};

export async function loadConfig(): Promise<void> {
  const result = await pool.query('SELECT nombre, valor FROM tabla_grupo_1_parametros');
  for (const row of result.rows) {
    cache[row.nombre] = row.valor;
  }
  console.log(`⚙️  Config cargada desde BD (${result.rows.length} parámetros)`);
}

// Lee de BD primero, luego process.env como fallback
export function cfg(key: string, fallback = ''): string {
  return cache[key] ?? process.env[key] ?? fallback;
}

// Recarga la config desde BD (útil tras guardar cambios en Parámetros)
export async function reloadConfig(): Promise<void> {
  return loadConfig();
}
