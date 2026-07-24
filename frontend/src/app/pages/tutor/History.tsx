import { useState, useEffect } from "react";
import { Link } from "react-router";
import { CalendarDays, Users, Star, Eye } from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";

function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-[#003366]">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function StatsCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between bg-white border-slate-200/80">
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold mt-2 text-[#003366]">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg text-[#004B87] border border-slate-100">
        <Icon className="size-6" />
      </div>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente aprobación",
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
  RECHAZADO: "Rechazado",
};

const STATUS_TONE: Record<string, string> = {
  BORRADOR: "bg-slate-100 text-slate-700 border-slate-200",
  PENDIENTE_APROBACION: "bg-amber-100 text-amber-700 border-amber-200",
  PROGRAMADO: "bg-blue-100 text-blue-700 border-blue-200",
  EN_CURSO: "bg-green-100 text-green-700 border-green-200",
  FINALIZADO: "bg-emerald-100 text-emerald-700 border-emerald-200",
  RECHAZADO: "bg-red-100 text-red-700 border-red-200",
};

export function TutorHistory() {
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>('/eventos/mis-eventos');
        setMyEvents(data || []);
      } catch (err: any) {
        toast.error("Error al cargar historial", { description: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalEventos = myEvents.length;
  const totalEstudiantes = myEvents.reduce((sum, e) => sum + (e.inscritos_count || 0), 0);
  const promedioGeneral = totalEventos > 0 ? "4.5" : "—"; // Calificación simulada por defecto

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground font-medium">Cargando historial de actividades...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Historial de actividades"
        description="Todos los eventos creados, estados y resultados."
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard
          label="Total de eventos realizados"
          value={totalEventos}
          icon={CalendarDays}
        />
        <StatsCard
          label="Total de estudiantes impactados"
          value={totalEstudiantes}
          icon={Users}
        />
        <StatsCard
          label="Promedio de calificación general"
          value={promedioGeneral === "—" ? "—" : `${promedioGeneral} / 5`}
          icon={Star}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden bg-white border-slate-200/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del evento</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-center">Total participantes</TableHead>
              <TableHead className="text-center">Asistencias</TableHead>
              <TableHead className="text-center">Calificación</TableHead>
              <TableHead>Estado final</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12 font-medium">
                  No has creado ningún evento aún.
                </TableCell>
              </TableRow>
            ) : (
              myEvents.map((e) => {
                const participantes = e.inscritos_count || 0;
                const asistencias = e.asistencias_count || 0;
                const avg = e.estado === "FINALIZADO" ? "4.5" : "—";
                const toneClass = STATUS_TONE[e.estado] || "bg-muted text-muted-foreground";

                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-semibold text-slate-800">{e.titulo}</TableCell>
                    <TableCell className="text-muted-foreground font-medium">
                      {e.fecha_inicio ? new Date(e.fecha_inicio).toLocaleDateString("es-HN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                      }) : "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-slate-600">{CATEGORY_LABEL[e.categoria] || e.categoria}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-700">{participantes}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-700">{asistencias}</TableCell>
                    <TableCell className="text-center font-semibold text-slate-700">{avg === "—" ? "—" : `${avg} ★`}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${toneClass}`}
                      >
                        {STATUS_LABEL[e.estado] || e.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="border-[#004B87] text-[#004B87] hover:bg-blue-50"
                      >
                        <Link to={`/tutor/event/${e.id}`}>
                          <Eye className="size-3.5 mr-1" /> Ver detalle
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
