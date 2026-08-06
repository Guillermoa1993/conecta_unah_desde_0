import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { ProgressCard } from "../../components/progress/ProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from "react-router";
import { grupo2EventosService, EventoGrupo2 } from "../../../services/grupo2-eventos.service";

const REQUISITO_HORAS = 60;

export function StudentDashboard() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<EventoGrupo2[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const datos = await grupo2EventosService.obtenerMisEventos();
        setEventos(datos);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarEventos();
  }, []);

  // Solo eventos a los que el estudiante está inscrito (mismo criterio que "Mis Eventos")
  const inscritos = eventos.filter((e) => e.INSCRITO);

  // Completados = finalizados con asistencia verificada (misma regla que calcularTotalHoras en AvailableEvents.tsx)
  const completados = inscritos.filter(
    (e) => e.ESTADO_ACTIVIDAD === "Finalizado" && e.ASISTENCIA?.estadoVerificacion === "Verificado"
  );
  const horasAcumuladas = completados.reduce((total, e) => total + (Number(e.HORAS_VOAE) || 0), 0);
  const eventosCompletados = completados.length;
  const cumplimiento = Math.min(100, Math.round((horasAcumuladas / REQUISITO_HORAS) * 100));

  // Próximos = inscritos que aún no han finalizado (Programado o En curso)
  const proximos = inscritos
    .filter((e) => e.ESTADO_ACTIVIDAD === "Programado" || e.ESTADO_ACTIVIDAD === "En curso")
    .sort((a, b) => new Date(a.FECHA).getTime() - new Date(b.FECHA).getTime());

  const asistenciaReciente = [...completados]
    .sort((a, b) => new Date(b.FECHA).getTime() - new Date(a.FECHA).getTime())
    .slice(0, 5);

  if (cargando) {
    return <p className="text-muted-foreground">Cargando dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#004B87]">Dashboard del Estudiante</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Bienvenido de nuevo, monitorea tu progreso académico
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Horas Acumuladas" value={String(horasAcumuladas)} icon={Clock} description={`De ${REQUISITO_HORAS} horas requeridas`} />
        <StatsCard title="Eventos Completados" value={String(eventosCompletados)} icon={CheckCircle2} />
        <StatsCard title="Próximos Eventos" value={String(proximos.length)} icon={Calendar} description="Programados" />
        <StatsCard title="Cumplimiento" value={`${cumplimiento}%`} icon={TrendingUp} />
      </div>

      <ProgressCard currentHours={horasAcumuladas} requiredHours={REQUISITO_HORAS} />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Próximos Eventos</CardTitle>
          <Button variant="outline" className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white" onClick={() => navigate("/student/events")}>
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proximos.length === 0 && <p className="text-sm text-muted-foreground">No tienes próximos eventos.</p>}
            {proximos.map((ev) => (
              <div key={ev.EVENTO_ID} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{ev.TITULO_EVENTO}</h4>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(ev.FECHA).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge className={ev.ESTADO_ACTIVIDAD === "En curso" ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}>
                  {ev.ESTADO_ACTIVIDAD === "En curso" ? "En curso" : "Confirmado"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Asistencia Reciente</CardTitle>
          <Button variant="outline" className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white" onClick={() => navigate("/student/history")}>
            Ver Historial
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {asistenciaReciente.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes asistencias registradas.</p>}
            {asistenciaReciente.map((ev) => (
              <div key={ev.EVENTO_ID} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{ev.TITULO_EVENTO}</h4>
                  <p className="text-sm text-muted-foreground">{new Date(ev.FECHA).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#004B87]">{ev.HORAS_VOAE} horas</span>
                  <Badge className="bg-green-500 hover:bg-green-600">Validado</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}