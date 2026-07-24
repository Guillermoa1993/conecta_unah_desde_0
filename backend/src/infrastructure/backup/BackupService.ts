import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface BackupFile {
  nombre: string;
  fecha: Date;
  tamanoBytes: number;
}

const BACKUP_DIR = process.env.BACKUP_DIR ?? '/app/backups';

export class BackupService {
  private async ensureDir(): Promise<void> {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }

  /** Ejecuta pg_dump real contra DATABASE_URL y guarda el archivo .sql en disco */
  async crear(): Promise<BackupFile> {
    await this.ensureDir();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL no está configurada');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombre = `unah_conecta_${timestamp}.sql`;
    const rutaCompleta = path.join(BACKUP_DIR, nombre);

    await new Promise<void>((resolve, reject) => {
      // --no-owner / --no-privileges: evita fallos de restauración si el
      // usuario destino no coincide exactamente con el usuario de Render.
      const proceso = spawn('pg_dump', [
        databaseUrl,
        '--no-owner',
        '--no-privileges',
        '-f', rutaCompleta,
      ]);

      let stderr = '';
      proceso.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      proceso.on('error', (err) => {
        reject(new Error(`No se pudo ejecutar pg_dump: ${err.message}`));
      });

      proceso.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pg_dump terminó con código ${code}: ${stderr}`));
      });
    });

    const stats = await fs.stat(rutaCompleta);
    return { nombre, fecha: stats.mtime, tamanoBytes: stats.size };
  }

  async listar(): Promise<BackupFile[]> {
    await this.ensureDir();
    const archivos = await fs.readdir(BACKUP_DIR);
    const sqlFiles = archivos.filter((f) => f.endsWith('.sql'));

    const detalles = await Promise.all(
      sqlFiles.map(async (nombre) => {
        const stats = await fs.stat(path.join(BACKUP_DIR, nombre));
        return { nombre, fecha: stats.mtime, tamanoBytes: stats.size };
      }),
    );

    return detalles.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  /** Devuelve la ruta absoluta de un backup, validando que no se escape del directorio */
  rutaDe(nombre: string): string {
    const rutaCompleta = path.join(BACKUP_DIR, nombre);
    if (!rutaCompleta.startsWith(path.resolve(BACKUP_DIR))) {
      throw new Error('Nombre de archivo inválido');
    }
    return rutaCompleta;
  }

  async eliminar(nombre: string): Promise<boolean> {
    try {
      await fs.unlink(this.rutaDe(nombre));
      return true;
    } catch {
      return false;
    }
  }
}