import { api } from './api';

export interface DashboardStats {
  totalEventos: number;
  estudiantesActivos: number;
  estudiantesActivosTrend: number | null;
  eventosHoy: number;
  tasaAsistencia: number;
  uptimeSegundos: number;
  usuariosActivosRecientes: number;
  ultimoRespaldo: string | null;
  eventosRecientes: {
    id: string;
    titulo: string;
    tutor: string;
    estado: string;
  }[];
}

export const dashboardService = {
  getStats(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/admin/dashboard/stats');
  },
};