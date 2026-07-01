import { Calendar, Users, TrendingUp, Activity } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const systemStatus = [
  { metric: "Uptime del Sistema", value: "99.9%", status: "success" },
  { metric: "Eventos Activos Hoy", value: "12", status: "success" },
  { metric: "Usuarios Conectados", value: "347", status: "success" },
  { metric: "Respaldos Automáticos", value: "Activos", status: "success" },
];

const recentEvents = [
  { id: 1, name: "Taller de React", tutor: "Dr. Juan Pérez", status: "active" },
  { id: 2, name: "Curso de Python", tutor: "Dra. María González", status: "completed" },
  { id: 3, name: "Workshop de ML", tutor: "Mtro. Carlos Ramírez", status: "upcoming" },
];

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Dashboard Administrativo</h1>
        <p className="text-muted-foreground mt-1">
          Vista general del sistema y métricas clave
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Eventos"
          value="156"
          icon={Calendar}
          trend={{ value: "+12% este mes", isPositive: true }}
        />
        <StatsCard
          title="Estudiantes Activos"
          value="1,247"
          icon={Users}
          trend={{ value: "+8% este mes", isPositive: true }}
        />
        <StatsCard
          title="Eventos del Día"
          value="12"
          icon={Activity}
          description="En curso y próximos"
        />
        <StatsCard
          title="Tasa de Asistencia"
          value="89%"
          icon={TrendingUp}
          trend={{ value: "+3% vs mes anterior", isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <p className="font-medium text-[#004B87]">{event.name}</p>
                    <p className="text-sm text-muted-foreground">{event.tutor}</p>
                  </div>
                  <Badge
                    className={
                      event.status === "active"
                        ? "bg-green-500"
                        : event.status === "completed"
                        ? "bg-gray-500"
                        : "bg-blue-500"
                    }
                  >
                    {event.status === "active"
                      ? "Activo"
                      : event.status === "completed"
                      ? "Completado"
                      : "Próximo"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
