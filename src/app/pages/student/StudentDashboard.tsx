import { Calendar, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { ProgressCard } from "../../components/progress/ProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from "react-router";

const upcomingEvents = [
  {
    id: "1",
    title: "Taller de Desarrollo Web con React",
    date: "2026-06-01",
    time: "10:00",
    location: "Aula 301",
    status: "confirmed",
  },
  {
    id: "2",
    title: "Conferencia de Inteligencia Artificial",
    date: "2026-06-05",
    time: "14:00",
    location: "Auditorio Principal",
    status: "pending",
  },
  {
    id: "3",
    title: "Curso de Inglés Básico",
    date: "2026-06-10",
    time: "16:00",
    location: "Sala A-12",
    status: "confirmed",
  },
];

const recentAttendance = [
  {
    id: "1",
    event: "Taller de Python",
    date: "2026-05-20",
    hours: 3,
    status: "validated",
  },
  {
    id: "2",
    event: "Seminario de Blockchain",
    date: "2026-05-15",
    hours: 2,
    status: "validated",
  },
  {
    id: "3",
    event: "Workshop de UX/UI",
    date: "2026-05-10",
    hours: 4,
    status: "pending",
  },
];

export function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Dashboard del Estudiante</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido de nuevo, monitorea tu progreso académico
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Horas Acumuladas"
          value="45"
          icon={Clock}
          description="De 60 horas requeridas"
        />
        <StatsCard
          title="Eventos Completados"
          value="12"
          icon={CheckCircle2}
          trend={{ value: "+3 este mes", isPositive: true }}
        />
        <StatsCard
          title="Próximos Eventos"
          value="3"
          icon={Calendar}
          description="Esta semana"
        />
        <StatsCard
          title="Cumplimiento"
          value="75%"
          icon={TrendingUp}
          trend={{ value: "+15% vs mes anterior", isPositive: true }}
        />
      </div>

      {/* Progress Card */}
      <ProgressCard currentHours={45} requiredHours={60} />

      {/* Upcoming Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximos Eventos</CardTitle>
          <Button
            variant="outline"
            className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white"
            onClick={() => navigate("/student/events")}
          >
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{event.title}</h4>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.location}</p>
                </div>
                <Badge
                  className={
                    event.status === "confirmed"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }
                >
                  {event.status === "confirmed" ? "Confirmado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asistencia Reciente</CardTitle>
          <Button
            variant="outline"
            className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white"
            onClick={() => navigate("/student/history")}
          >
            Ver Historial
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{record.event}</h4>
                  <p className="text-sm text-muted-foreground">{record.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#004B87]">
                    {record.hours} horas
                  </span>
                  <Badge
                    className={
                      record.status === "validated"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    }
                  >
                    {record.status === "validated" ? "Validado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
