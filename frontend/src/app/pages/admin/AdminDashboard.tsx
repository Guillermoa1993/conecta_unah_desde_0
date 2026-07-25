import { useEffect, useState, useCallback } from "react";
import { Calendar, Users, TrendingUp, Activity, RefreshCw } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { dashboardService, DashboardStats } from "../../../services/dashboard.service";

const AUTO_REFRESH_MS = 30_000;

function formatUptime(segundos: number): string {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  if (horas === 0) return `${minutos}m`;
  return `${horas}h ${minutos}m`;
}

function formatFechaRelativa(iso: string | null): string {
  if (!iso) return "Sin respaldos aún";
  const diffMs = Date.now() - new Date(iso).getTime();
  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  if (horas < 1) return "Hace menos de 1h";
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias}d`;
}

function badgeParaEstado(estado: string) {
  if (estado === "EN_CURSO" || estado === "EN_CURSO_SALIDA") {
    return { texto: "Activo", clase: "bg-green-500" };
  }
  if (estado === "FINALIZADO") {
    return { texto: "Completado", clase: "bg-gray-500" };
  }
  if (estado === "RECHAZADO") {
    return { texto: "Rechazado", clase: "bg-red-500" };
  }
  return { texto: "Próximo", clase: "bg-blue-500" };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarStats = useCallback(async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las estadísticas");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarStats();
    const interval = setInterval(cargarStats, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [cargarStats]);

  const systemStatus = stats
    ? [
        { metric: "Tiempo activo del backend", value: formatUptime(stats.uptimeSegundos) },
        { metric: "Eventos Activos Hoy", value: String(stats.eventosHoy) },
        { metric: "Usuarios Activos (últimos 30 min)", value: String(stats.usuariosActivosRecientes) },
        { metric: "Último Respaldo", value: formatFechaRelativa(stats.ultimoRespaldo) },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-1">
            Vista general del sistema y métricas clave
          </p>
        </div>
        <button
          onClick={cargarStats}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#004B87] transition-colors"
          title="Actualizar ahora"
        >
          <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
          {cargando ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-300 bg-red-50 text-red-700 flex items-center justify-between">
          <span>No se pudo cargar la información. {error}</span>
          <button onClick={cargarStats} className="underline font-medium">Reintentar</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Eventos"
          value={stats ? stats.totalEventos : "—"}
          icon={Calendar}
        />
        <StatsCard
          title="Estudiantes Activos"
          value={stats ? stats.estudiantesActivos : "—"}
          icon={Users}
          trend={
            stats && stats.estudiantesActivosTrend !== null
              ? {
                  value: `${Math.abs(stats.estudiantesActivosTrend)}% vs mes anterior`,
                  isPositive: stats.estudiantesActivosTrend >= 0,
                }
              : undefined
          }
        />
        <StatsCard
          title="Eventos del Día"
          value={stats ? stats.eventosHoy : "—"}
          icon={Activity}
          description="En curso y próximos"
        />
        <StatsCard
          title="Tasa de Asistencia"
          value={stats ? `${stats.tasaAsistencia}%` : "—"}
          icon={TrendingUp}
          description="Asistencias registradas / inscritos"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cargando && !stats && (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              )}
              {systemStatus.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <span className="text-sm font-medium">{item.metric}</span>
                  <Badge className="bg-green-500 hover:bg-green-600">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cargando && !stats && (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              )}
              {stats && stats.eventosRecientes.length === 0 && (
                <p className="text-sm text-muted-foreground">Aún no hay eventos registrados.</p>
              )}
              {stats?.eventosRecientes.map((event) => {
                const badge = badgeParaEstado(event.estado);
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium text-[#004B87]">{event.titulo}</p>
                      <p className="text-sm text-muted-foreground">{event.tutor}</p>
                    </div>
                    <Badge className={badge.clase}>{badge.texto}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}