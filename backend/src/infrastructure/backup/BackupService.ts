import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { Pool } from 'pg';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { invalidarTodasLasSesiones } from '../config/sesionMantenimiento';

export interface BackupFile {
  nombre: string;
  fecha: Date;
  tamanoBytes: number;
}

export interface HistoricoBackupRow {
  id_backup: number;
  nombre_archivo: string;
  tipo: string;
  categoria: string;
  estado: string;
  iniciado_por: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  mensaje_error: string | null;
  tamanio: string;
  duracion: string;
  base_datos: string;
  destino_tipo: string;
  destino_nombre: string;
}

const BACKUP_DIR = path.resolve(process.env.BACKUP_DIR ?? '/app/backups');

// ── Backblaze B2 (API compatible con S3) — respaldo fuera de la máquina local ──
// Si las variables no están configuradas, el sistema sigue funcionando solo
// con el disco local (comportamiento anterior); B2 es un "plus" opcional.
// B2_ENDPOINT tiene la forma https://s3.<region>.backblazeb2.com
// (lo obtienes al crear el bucket, junto con el "keyID" y la "applicationKey").
const B2_BUCKET = process.env.B2_BUCKET_NAME;
const b2Habilitado = Boolean(
  process.env.B2_ENDPOINT && process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY && B2_BUCKET,
);

const s3Client = b2Habilitado
  ? new S3Client({
      region: process.env.B2_REGION ?? 'us-west-004',
      endpoint: process.env.B2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID as string,
        secretAccessKey: process.env.B2_APPLICATION_KEY as string,
      },
    })
  : null;

if (!b2Habilitado) {
  console.warn('⚠️  Backblaze B2 no configurado: los backups solo se guardan en disco local (BACKUP_DIR).');
}

export class BackupService {
  constructor(private readonly pool: Pool) {}

  private async ensureDir(): Promise<void> {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }

  private getCommand(commandName: string, envVar: string): string {
    const configured = process.env[envVar];
    return configured ? path.resolve(configured) : commandName;
  }

  private getPgDumpCommand(): string {
    return this.getCommand('pg_dump', 'PGDUMP_PATH');
  }

  private getPsqlCommand(): string {
    return this.getCommand('psql', 'PSQL_PATH');
  }

  /** Sube el archivo de backup a Backblaze B2. No lanza error si falla —
   *  el backup local ya se completó exitosamente; B2 es una copia extra. */
  private async subirAB2(rutaCompleta: string, nombre: string): Promise<void> {
    if (!s3Client) return;
    try {
      const contenido = await fs.readFile(rutaCompleta);
      await s3Client.send(new PutObjectCommand({ Bucket: B2_BUCKET, Key: nombre, Body: contenido }));
      console.log(`☁️  Backup ${nombre} subido a Backblaze B2 (${B2_BUCKET})`);
    } catch (err) {
      console.error(`⚠️  No se pudo subir el backup ${nombre} a B2:`, (err as Error).message);
    }
  }

  /** Descarga el archivo desde B2 hacia BACKUP_DIR. Devuelve true si lo logró. */
  private async descargarDeB2(nombre: string, rutaCompleta: string): Promise<boolean> {
    if (!s3Client) return false;
    try {
      const respuesta = await s3Client.send(new GetObjectCommand({ Bucket: B2_BUCKET, Key: nombre }));
      const bytes = await respuesta.Body?.transformToByteArray();
      if (!bytes) return false;
      await this.ensureDir();
      await fs.writeFile(rutaCompleta, Buffer.from(bytes));
      console.log(`☁️  Backup ${nombre} recuperado desde Backblaze B2`);
      return true;
    } catch (err) {
      console.error(`⚠️  No se pudo recuperar ${nombre} desde B2:`, (err as Error).message);
      return false;
    }
  }

  /** Garantiza que el archivo exista en disco local antes de descargarlo o
   *  restaurarlo, recuperándolo desde B2 si el volumen local lo perdió. */
  private resolveBackupPath(nombre: string): string {
    const rutaCompleta = path.resolve(BACKUP_DIR, nombre);
    const directorio = path.resolve(BACKUP_DIR);
    if (rutaCompleta !== directorio && !rutaCompleta.startsWith(directorio + path.sep)) {
      throw new Error('Nombre de archivo inválido');
    }
    return rutaCompleta;
  }

  async asegurarLocal(nombre: string): Promise<void> {
    const ruta = this.resolveBackupPath(nombre);
    try {
      await fs.access(ruta);
    } catch {
      const recuperado = await this.descargarDeB2(nombre, ruta);
      if (!recuperado) {
        throw new Error(`El respaldo ${nombre} no existe en disco local ni en B2`);
      }
    }
  }

  /** Toma la primera base de datos y el primer destino "local" activos como
   *  destino por defecto (ya existen filas reales creadas por el grupo 4). */
  private async destinoPorDefecto(): Promise<{ idBaseDatos: number; idDestino: number }> {
    const bd = await this.pool.query(
      `SELECT id_base_datos FROM tabla_grupo_4_bases_datos_objetivo WHERE activo = true ORDER BY id_base_datos LIMIT 1`,
    );
    if (!bd.rows[0]) throw new Error('No hay ninguna base de datos configurada en tabla_grupo_4_bases_datos_objetivo');

    const destino = await this.pool.query(
      `SELECT id_destino FROM tabla_grupo_4_destinos_almacenamiento
       WHERE activo = true ORDER BY (tipo = 'local') DESC, id_destino LIMIT 1`,
    );
    if (!destino.rows[0]) throw new Error('No hay ningún destino configurado en tabla_grupo_4_destinos_almacenamiento');

    return { idBaseDatos: bd.rows[0].id_base_datos, idDestino: destino.rows[0].id_destino };
  }

  /** Ejecuta pg_dump real contra DATABASE_URL, guarda el archivo .sql en
   *  disco y deja registro real en tabla_grupo_4_historico_backups. */
  async crear(iniciadoPor: string): Promise<BackupFile> {
    await this.ensureDir();

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL no está configurada');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const nombre = `unah_conecta_${timestamp}.sql`;
    const rutaCompleta = path.join(BACKUP_DIR, nombre);
    const { idBaseDatos, idDestino } = await this.destinoPorDefecto();

    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_4_historico_backups
         (nombre_archivo, id_base_datos, id_destino, tipo, categoria, estado, ruta_archivo, iniciado_por)
       VALUES ($1, $2, $3, 'manual', 'completo', 'en_progreso', $4, $5)
       RETURNING id_backup`,
      [nombre, idBaseDatos, idDestino, rutaCompleta, iniciadoPor],
    );
    const idBackup = rows[0].id_backup;
    const inicio = Date.now();

    try {
      await new Promise<void>((resolve, reject) => {
        // --no-owner / --no-privileges: evita fallos de restauración si el
        // usuario destino no coincide exactamente con el usuario de Render.
        const comando = this.getPgDumpCommand();
        const proceso = spawn(comando, [
          databaseUrl,
          '--no-owner',
          '--no-privileges',
          '-f', rutaCompleta,
        ]);

        let stderr = '';
        proceso.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

        proceso.on('error', (err) => {
          reject(new Error(`No se pudo ejecutar ${comando}: ${err.message}. Asegúrate de tener ${comando} instalado o configura PGDUMP_PATH.`));
        });

        proceso.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`pg_dump terminó con código ${code}: ${stderr}`));
        });
      });

      const stats = await fs.stat(rutaCompleta);
      const duracionSegundos = Math.round((Date.now() - inicio) / 1000);

      await this.pool.query(
        `UPDATE tabla_grupo_4_historico_backups
         SET estado = 'exitoso', tamanio_bytes = $2, duracion_segundos = $3, fecha_fin = now()
         WHERE id_backup = $1`,
        [idBackup, stats.size, duracionSegundos],
      );

      // Copia adicional fuera de la máquina local; no bloquea ni falla el
      // backup si B2 no está disponible.
      await this.subirAB2(rutaCompleta, nombre);

      return { nombre, fecha: stats.mtime, tamanoBytes: stats.size };
    } catch (err) {
      const duracionSegundos = Math.round((Date.now() - inicio) / 1000);
      await this.pool.query(
        `UPDATE tabla_grupo_4_historico_backups
         SET estado = 'fallido', duracion_segundos = $2, mensaje_error = $3, fecha_fin = now()
         WHERE id_backup = $1`,
        [idBackup, duracionSegundos, (err as Error).message],
      );
      throw err;
    }
  }

  /** Historial real desde la vista v_historico_backups (datos reales de BD,
   *  no simulados). */
  async listar(): Promise<HistoricoBackupRow[]> {
    const { rows } = await this.pool.query(`SELECT * FROM v_historico_backups`);
    return rows;
  }

  /** Devuelve la ruta absoluta de un backup, validando que no se escape del directorio */
  rutaDe(nombre: string): string {
    return this.resolveBackupPath(nombre);
  }

  async eliminar(nombre: string): Promise<boolean> {
    try {
      await fs.unlink(this.rutaDe(nombre));
      return true;
    } catch {
      return false;
    }
  }

  /** Busca el registro de historico_backups para un archivo dado; si el
   *  archivo existe en disco pero no tiene registro (backups viejos, antes
   *  de este cambio), crea uno de forma retroactiva para poder restaurarlo. */
  private async obtenerOCrearRegistroBackup(nombreArchivo: string): Promise<number> {
    const existente = await this.pool.query(
      `SELECT id_backup FROM tabla_grupo_4_historico_backups WHERE nombre_archivo = $1
       ORDER BY id_backup DESC LIMIT 1`,
      [nombreArchivo],
    );
    if (existente.rows[0]) return existente.rows[0].id_backup;

    const ruta = this.rutaDe(nombreArchivo);
    const stats = await fs.stat(ruta);
    const { idBaseDatos, idDestino } = await this.destinoPorDefecto();

    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_4_historico_backups
         (nombre_archivo, id_base_datos, id_destino, tipo, categoria, estado, ruta_archivo, tamanio_bytes, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3, 'manual', 'completo', 'exitoso', $4, $5, $6, $6)
       RETURNING id_backup`,
      [nombreArchivo, idBaseDatos, idDestino, ruta, stats.size, stats.mtime.toISOString()],
    );
    return rows[0].id_backup;
  }

  /** Restaura la base de datos real desde un archivo .sql generado con
   *  pg_dump, y cierra todas las sesiones activas por mantenimiento. */
  async restaurar(nombreArchivo: string, solicitadoPor: string, motivo?: string): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL no está configurada');

    const ruta = this.rutaDe(nombreArchivo);
    await this.asegurarLocal(nombreArchivo);

    const idBackupOrigen = await this.obtenerOCrearRegistroBackup(nombreArchivo);
    const { idBaseDatos } = await this.destinoPorDefecto();

    const { rows } = await this.pool.query(
      `INSERT INTO tabla_grupo_4_restauraciones
         (id_backup_origen, estado, id_base_datos, solicitado_por, motivo)
       VALUES ($1, 'en_progreso', $2, $3, $4)
       RETURNING id_restauracion`,
      [idBackupOrigen, idBaseDatos, solicitadoPor, motivo ?? null],
    );
    const idRestauracion = rows[0].id_restauracion;

    try {
      await new Promise<void>((resolve, reject) => {
        const comando = this.getPsqlCommand();
        const proceso = spawn(comando, [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', ruta]);

        let stderr = '';
        proceso.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

        proceso.on('error', (err) => {
          reject(new Error(`No se pudo ejecutar ${comando}: ${err.message}. Asegúrate de tener ${comando} instalado o configura PSQL_PATH.`));
        });

        proceso.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`psql terminó con código ${code}: ${stderr}`));
        });
      });

      await this.pool.query(
        `UPDATE tabla_grupo_4_restauraciones SET estado = 'exitoso', fecha_fin = now() WHERE id_restauracion = $1`,
        [idRestauracion],
      );

      // Restauración exitosa = mantenimiento del sistema: se cierran todas
      // las sesiones activas y todos deben volver a iniciar sesión.
      await invalidarTodasLasSesiones(this.pool);
    } catch (err) {
      await this.pool.query(
        `UPDATE tabla_grupo_4_restauraciones
         SET estado = 'fallido', mensaje_error = $2, fecha_fin = now()
         WHERE id_restauracion = $1`,
        [idRestauracion, (err as Error).message],
      );
      throw err;
    }
  }
}