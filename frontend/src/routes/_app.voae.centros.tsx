import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Building2, MapPin, CalendarDays, Clock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatsCard } from "@/components/app/StatsCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EVENTS, getEventInscripciones } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/voae/centros")({
  component: CentrosRegionales,
});

function CentrosRegionales() {
  const centrosMap = new Map<
    string,
    { eventos: typeof EVENTS; totalHoras: number; totalEstudiantes: number }
  >();

  for (const ev of EVENTS) {
    const cr = ev.centro_regional || "Sin centro";
    if (!centrosMap.has(cr)) {
      centrosMap.set(cr, { eventos: [], totalHoras: 0, totalEstudiantes: 0 });
    }
    const entry = centrosMap.get(cr)!;
    entry.eventos.push(ev);
    entry.totalHoras += ev.duracion_horas;
    entry.totalEstudiantes += getEventInscripciones(ev.id);
  }

  const centros = Array.from(centrosMap.entries()).map(([nombre, data]) => ({
    nombre,
    totalEventos: data.eventos.length,
    totalHoras: data.totalHoras,
    totalEstudiantes: data.totalEstudiantes,
  }));

  const totalCentros = centros.length;
  const totalEventos = EVENTS.length;
  const totalHoras = EVENTS.reduce((s, e) => s + e.duracion_horas, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <PageHeader
        title="Centros regionales"
        description="Estadísticas de eventos y horas acreditadas por centro regional"
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <StatsCard label="Total centros" value={totalCentros} icon={Building2} tone="primary" />
        <StatsCard label="Total eventos" value={totalEventos} icon={CalendarDays} tone="gold" />
        <StatsCard label="Total horas" value={`${totalHoras}h`} icon={Clock} tone="success" />
      </div>

      <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f1f5f9]" style={{ height: 48 }}>
              <TableHead className="text-[var(--puma-dark)] font-bold">Centro Regional</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">
                Eventos totales
              </TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">
                Horas acreditadas totales
              </TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">
                Estudiantes participantes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.map((c) => (
              <TableRow
                key={c.nombre}
                className="even:bg-[#f8f9fa] hover:bg-[#eff6ff]"
                style={{ height: 48 }}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{c.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-semibold">{c.totalEventos}</TableCell>
                <TableCell className="text-center font-semibold">{c.totalHoras}h</TableCell>
                <TableCell className="text-center">{c.totalEstudiantes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
