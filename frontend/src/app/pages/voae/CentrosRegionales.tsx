import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { ArrowLeft, Building2, MapPin, CalendarDays, Clock } from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

export function CentrosRegionales() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/eventos');
      setEvents(data || []);
    } catch (err: any) {
      toast.error("Error al cargar centros regionales", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const centros = useMemo(() => {
    const map = new Map<string, { totalEventos: number; totalHoras: number; totalEstudiantes: number }>();
    
    for (const ev of events) {
      const cr = ev.centro_regional || "Ciudad Universitaria";
      if (!map.has(cr)) {
        map.set(cr, { totalEventos: 0, totalHoras: 0, totalEstudiantes: 0 });
      }
      const entry = map.get(cr)!;
      entry.totalEventos += 1;
      entry.totalHoras += Number(ev.duracion_horas || 0);
      entry.totalEstudiantes += (ev.inscritos_count || 0);
    }

    return Array.from(map.entries()).map(([nombre, data]) => ({
      nombre,
      ...data,
    }));
  }, [events]);

  const totalCentros = centros.length;
  const totalEventos = events.length;
  const totalHoras = useMemo(() => events.reduce((s, e) => s + Number(e.duracion_horas || 0), 0), [events]);

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Cargando centros regionales...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      
      <div>
        <h1 className="text-xl font-bold text-[#003366]">Centros Regionales</h1>
        <p className="text-sm text-muted-foreground">Estadísticas de eventos y horas acreditadas por centro regional.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-blue-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#004B87]">
            <Building2 className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalCentros}</p>
            <p className="text-xs text-[#717182] font-semibold">Total centros</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-yellow-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-600">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalEventos}</p>
            <p className="text-xs text-[#717182] font-semibold">Total eventos</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-green-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalHoras}h</p>
            <p className="text-xs text-[#717182] font-semibold">Total horas</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f1f5f9]">
              <TableHead className="text-[var(--puma-dark)] font-bold">Centro Regional</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">Eventos Totales</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">Horas Acreditadas Totales</TableHead>
              <TableHead className="text-[var(--puma-dark)] font-bold text-center">Estudiantes Participantes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                  No hay datos registrados aún.
                </TableCell>
              </TableRow>
            ) : (
              centros.map((c) => (
                <TableRow key={c.nombre} className="even:bg-slate-50/50 hover:bg-slate-100/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-slate-800">{c.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">{c.totalEventos}</TableCell>
                  <TableCell className="text-center font-semibold text-slate-700">{c.totalHoras}h</TableCell>
                  <TableCell className="text-center text-slate-700">{c.totalEstudiantes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
