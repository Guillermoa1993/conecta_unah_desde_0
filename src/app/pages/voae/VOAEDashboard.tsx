import { Shield, CheckCircle2, AlertCircle, FileText, Clock, MapPin } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

const pendingValidations = [
  { id: "1", event: "Taller de React", student: "Ana García", hours: 3, date: "2026-05-28", time: "10:00 AM", location: "Aula 301, Edificio Principal" },
  { id: "2", event: "Curso de Python", student: "Carlos López", hours: 5, date: "2026-05-27", time: "2:00 PM", location: "Lab de Cómputo 5" },
  { id: "3", event: "Workshop ML", student: "María Rodríguez", hours: 4, date: "2026-05-26", time: "4:00 PM", location: "Sala de Conferencias B" },
];

export function VOAEDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Panel de Auditoría VOAE</h1>
        <p className="text-muted-foreground mt-1">
          Validación y supervisión de actividades académicas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Eventos Validados"
          value="342"
          icon={CheckCircle2}
          trend={{ value: "+18 este mes", isPositive: true }}
        />
        <StatsCard
          title="Pendientes de Validación"
          value="23"
          icon={AlertCircle}
          description="Requieren revisión"
        />
        <StatsCard
          title="Certificados Emitidos"
          value="289"
          icon={FileText}
          trend={{ value: "+12% este mes", isPositive: true }}
        />
        <StatsCard
          title="Tasa de Cumplimiento"
          value="87%"
          icon={Shield}
          description="Artículo 140"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Validaciones Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingValidations.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{item.event}</h4>
                  <p className="text-sm text-muted-foreground">Estudiante: {item.student}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.date} • {item.time}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 text-[#004B87]" />
                      {item.location}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.hours} horas</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    Aprobar
                  </Button>
                  <Button size="sm" variant="outline">
                    Revisar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
