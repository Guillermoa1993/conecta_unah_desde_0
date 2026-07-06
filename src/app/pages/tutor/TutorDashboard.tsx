import { Calendar, Users, TrendingUp, Clock, MapPin } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from "react-router";

const activeEvents = [
  {
    id: "1",
    title: "Taller de Desarrollo Web con React",
    date: "2026-06-01",
    time: "10:00 AM",
    location: "Aula 301, Edificio Principal",
    registered: 25,
    capacity: 30,
    status: "upcoming",
  },
  {
    id: "2",
    title: "Curso de Python Avanzado",
    date: "2026-06-05",
    time: "2:00 PM",
    location: "Lab de Cómputo 5",
    registered: 30,
    capacity: 30,
    status: "full",
  },
  {
    id: "3",
    title: "Workshop de Machine Learning",
    date: "2026-06-10",
    time: "4:00 PM",
    location: "Sala de Conferencias B",
    registered: 12,
    capacity: 25,
    status: "upcoming",
  },
];

const recentActivity = [
  {
    id: "1",
    student: "Ana García",
    event: "Taller de React",
    action: "Registró asistencia",
    time: "Hace 5 minutos",
  },
  {
    id: "2",
    student: "Carlos López",
    event: "Curso de Python",
    action: "Completó encuesta",
    time: "Hace 15 minutos",
  },
  {
    id: "3",
    student: "María Rodríguez",
    event: "Workshop ML",
    action: "Se inscribió",
    time: "Hace 1 hora",
  },
  {
    id: "4",
    student: "Luis Martínez",
    event: "Taller de React",
    action: "Registró asistencia",
    time: "Hace 2 horas",
  },
];

export function TutorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#004B87]">Dashboard del Tutor</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus eventos y monitorea la participación
          </p>
        </div>
        <Button
          onClick={() => navigate("/tutor/create-event")}
          className="bg-[#FFD100] text-[#003366] hover:bg-[#FFD100]/90"
        >
          <Calendar className="mr-2 h-5 w-5" />
          Crear Nuevo Evento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Eventos Activos"
          value="8"
          icon={Calendar}
          description="Este mes"
        />
        <StatsCard
          title="Total Estudiantes"
          value="156"
          icon={Users}
          trend={{ value: "+12% vs mes anterior", isPositive: true }}
        />
        <StatsCard
          title="Horas Impartidas"
          value="48"
          icon={Clock}
          description="Este semestre"
        />
        <StatsCard
          title="Promedio Asistencia"
          value="92%"
          icon={TrendingUp}
          trend={{ value: "+5% vs mes anterior", isPositive: true }}
        />
      </div>

      {/* Active Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Eventos Activos</CardTitle>
          <Button variant="outline" onClick={() => navigate("/tutor/reports")}>
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => navigate(`/tutor/event/${event.id}`)}
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{event.title}</h4>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {event.registered} / {event.capacity} inscritos
                    </span>
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#004B87]"
                        style={{
                          width: `${(event.registered / event.capacity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Badge
                  className={
                    event.status === "full"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }
                >
                  {event.status === "full" ? "Lleno" : "Disponible"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <p className="font-medium text-[#004B87]">{activity.student}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.action} en {activity.event}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
