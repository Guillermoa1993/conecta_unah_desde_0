
function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-[#003366]">{title}</h1>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

function StatsCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: any; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm flex items-center justify-between bg-white">
      <div>
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold mt-2 text-[#003366]">{value}</p>
      </div>
      <div className="p-3 bg-slate-100 rounded-lg text-[#003366]">
        <Icon className="size-6" />
      </div>
    </div>
  );
}

import { Link } from "react-router";
import { CalendarDays, Users, Star, Eye, BarChart3 } from "lucide-react";


import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  EVENTS,
  CATEGORY_LABEL,
  STATUS_LABEL,
  STATUS_TONE,
  getEventInscripciones,
  getEventAsistencias,
  ENCUESTAS,
} from "../../../lib/mock-data";
import { useRole } from "../../../lib/role-context";



export function TutorHistory() {
  const { user } = useRole();

  const myEvents = EVENTS.filter((e) => e.tutor_id === user.id);

  const totalEventos = myEvents.length;

  const totalEstudiantes = myEvents.reduce((sum, e) => sum + getEventInscripciones(e.id), 0);

  const allRatings = ENCUESTAS.map((enc) => enc.calificacion_evento);
  const promedioGeneral =
    allRatings.length > 0
      ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
      : "—";

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
          tone="primary"
        />
        <StatsCard
          label="Total de estudiantes impactados"
          value={totalEstudiantes}
          icon={Users}
          tone="success"
        />
        <StatsCard
          label="Promedio de calificación general"
          value={promedioGeneral === "—" ? "—" : `${promedioGeneral} / 5`}
          icon={Star}
          tone="gold"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-card overflow-hidden">
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
                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                  No has creado ningún evento aún.
                </TableCell>
              </TableRow>
            ) : (
              myEvents.map((e) => {
                const participantes = getEventInscripciones(e.id);
                const asistencias = getEventAsistencias(e.id);
                const eventRatings = ENCUESTAS.filter((enc) =>
                  enc.asistencia_id.startsWith(e.id),
                ).map((enc) => enc.calificacion_evento);
                const avg =
                  eventRatings.length > 0
                    ? (eventRatings.reduce((a, b) => a + b, 0) / eventRatings.length).toFixed(1)
                    : "—";
                const toneClass = STATUS_TONE[e.estado] || "bg-muted text-muted-foreground";

                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.titulo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.fecha_inicio.slice(0, 10)}
                    </TableCell>
                    <TableCell>{CATEGORY_LABEL[e.categoria]}</TableCell>
                    <TableCell className="text-center">{participantes}</TableCell>
                    <TableCell className="text-center">{asistencias}</TableCell>
                    <TableCell className="text-center">{avg === "—" ? "—" : `${avg} ★`}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${toneClass}`}
                      >
                        {STATUS_LABEL[e.estado]}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
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
