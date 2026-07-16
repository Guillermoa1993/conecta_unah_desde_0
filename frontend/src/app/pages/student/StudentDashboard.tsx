import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { StatsCard } from "../../components/stats/StatsCard";
import { ProgressCard } from "../../components/progress/ProgressCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useNavigate } from "react-router";
import { api } from "../../../services/api";

interface InscripcionDetalle {
  id: string;
  estado: string; // valores reales en BD: 'INSCRITO' | 'CANCELADO' | 'ASISTIDO'
  evento_titulo: string;
  evento_fecha: string;
  evento_horas: number;
}

const REQUISITO_HORAS = 60;

export function StudentDashboard() {
  const navigate = useNavigate();
  const [inscripciones, setInscripciones] = useState<InscripcionDetalle[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarInscripciones = async () => {
      try {
        const datos = await api.get<InscripcionDetalle[]>("/inscripciones/mis-inscripciones");
        setInscripciones(datos);
      } catch (error) {
        console.error("Error al cargar inscripciones:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarInscripciones();
  }, []);

  const asistidas = inscripciones.filter((i) => i.estado === "ASISTIDO");
  const horasAcumuladas = asistidas.reduce((total, i) => total + (i.evento_horas || 0), 0);
  const eventosCompletados = asistidas.length;
  const cumplimiento = Math.min(100, Math.round((horasAcumuladas / REQUISITO_HORAS) * 100));

  const hoy = new Date();
  const proximos = inscripciones
    .filter((i) => i.estado !== "CANCELADO" && new Date(i.evento_fecha) >= hoy)
    .sort((a, b) => new Date(a.evento_fecha).getTime() - new Date(b.evento_fecha).getTime());

  const asistenciaReciente = [...asistidas]
    .sort((a, b) => new Date(b.evento_fecha).getTime() - new Date(a.evento_fecha).getTime())
    .slice(0, 5);

  if (cargando) {
    return <p className="text-muted-foreground">Cargando dashboard...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#004B87]">Dashboard del Estudiante</h1>
        <p className="text-muted-foreground mt-1">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Próximos Eventos</CardTitle>
          <Button variant="outline" className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white" onClick={() => navigate("/student/events")}>
            Ver Todos
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proximos.length === 0 && <p className="text-sm text-muted-foreground">No tienes próximos eventos.</p>}
            {proximos.map((insc) => (
              <div key={insc.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary transition-colors">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{insc.evento_titulo}</h4>
                  <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(insc.evento_fecha).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Badge className={insc.estado === "INSCRITO" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}>
                  {insc.estado === "INSCRITO" ? "Confirmado" : insc.estado}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Asistencia Reciente</CardTitle>
          <Button variant="outline" className="border-[#004B87] text-[#004B87] hover:bg-[#004B87] hover:text-white" onClick={() => navigate("/student/history")}>
            Ver Historial
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {asistenciaReciente.length === 0 && <p className="text-sm text-muted-foreground">Aún no tienes asistencias registradas.</p>}
            {asistenciaReciente.map((insc) => (
              <div key={insc.id} className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#004B87]">{insc.evento_titulo}</h4>
                  <p className="text-sm text-muted-foreground">{new Date(insc.evento_fecha).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-[#004B87]">{insc.evento_horas} horas</span>
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