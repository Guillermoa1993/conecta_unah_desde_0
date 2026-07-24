import { api } from './api';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export interface BackupFile {
  nombre: string;
  fecha: string;
  tamanoBytes: number;
}

export interface HistoricoBackupRow {
  id_backup: number;
  nombre_archivo: string;
  tipo: 'automatico' | 'manual';
  categoria: 'completo' | 'diferencial' | 'incremental';
  estado: 'exitoso' | 'fallido' | 'en_progreso';
  iniciado_por: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  mensaje_error: string | null;
  tamanio: string;
  duracion: string;
  base_datos: string;
  destino_tipo: 'local' | 'azure' | 'sftp';
  destino_nombre: string;
}

function getToken(): string | null {
  return localStorage.getItem('unah_token');
}

export const backupsService = {
  crear(): Promise<BackupFile> {
    return api.post<BackupFile>('/seguridad/backups', {});
  },

  listar(): Promise<HistoricoBackupRow[]> {
    return api.get<HistoricoBackupRow[]>('/seguridad/backups');
  },

  eliminar(nombre: string): Promise<{ ok: boolean }> {
    return api.delete<{ ok: boolean }>(`/seguridad/backups/${encodeURIComponent(nombre)}`);
  },

  restaurar(nombre: string, motivo?: string): Promise<{ ok: boolean; mensaje: string }> {
    return api.post<{ ok: boolean; mensaje: string }>(
      `/seguridad/backups/${encodeURIComponent(nombre)}/restaurar`,
      { motivo },
    );
  },

  /** Descarga real vía blob (no se puede usar api.get porque no es JSON). */
  async descargar(nombre: string): Promise<void> {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/seguridad/backups/${encodeURIComponent(nombre)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`No se pudo descargar el respaldo (HTTP ${res.status})`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
