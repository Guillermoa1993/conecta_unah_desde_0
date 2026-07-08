import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { CalendarDays, Users, Eye, X, AlertCircle } from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { toast } from "sonner";

type Tab = "activos" | "pendientes" | "cerrados" | "rechazados";

const TAB_ESTADOS: Record<Tab, string[]> = {
  activos: ["PROGRAMADO", "EN_CURSO"],
  pendientes: ["PENDIENTE_APROBACION"],
  cerrados: ["FINALIZADO"],
  rechazados: ["RECHAZADO"],
};

const TAB_LABEL: Record<Tab, string> = {
  activos: "Activos",
  pendientes: "Pendiente de aprobación",
  cerrados: "Finalizados",
  rechazados: "Rechazados",
};

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EstatusBadge({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    PROGRAMADO: "#22c55e",
    EN_CURSO: "#3b82f6",
    PENDIENTE_APROBACION: "#f59e0b",
    FINALIZADO: "#64748b",
    RECHAZADO: "#ef4444",
  };
  return (
    <span
      className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
      style={{ backgroundColor: colores[estado] || "#64748b" }}
    >
      {estado === "PENDIENTE_APROBACION"
        ? "Pendiente"
        : estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

export function TutorEventos() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("activos");
  const [motivoEvent, setMotivoEvent] = useState<any | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/eventos/mis-eventos');
      setEvents(data);
    } catch (err: any) {
      toast.error("Error al cargar los eventos", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(
    () => events.filter((e) => TAB_ESTADOS[tab].includes(e.estado)),
    [events, tab],
  );

  const counts = useMemo(
    () => ({
      activos: events.filter((e) => TAB_ESTADOS.activos.includes(e.estado)).length,
      pendientes: events.filter((e) => TAB_ESTADOS.pendientes.includes(e.estado)).length,
      cerrados: events.filter((e) => TAB_ESTADOS.cerrados.includes(e.estado)).length,
      rechazados: events.filter((e) => TAB_ESTADOS.rechazados.includes(e.estado)).length,
    }),
    [events],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[#003366]">Mis Eventos</h1>
          <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus eventos.</p>
        </div>
        <Button asChild style={{ backgroundColor: "#004B87" }}>
          <Link to="/tutor/create-event">Crear Evento</Link>
        </Button>
      </div>

      {tab === "rechazados" && counts.rechazados > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex items-start gap-2">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>Los eventos rechazados pueden ser editados y reenviados a revisión.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(Object.keys(TAB_ESTADOS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t
                ? "border-[#004B87] text-[#004B87] font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Event list */}
      {loading ? (
        <div className="py-20 text-center text-sm text-muted-foreground">Cargando eventos...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-20 text-center">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No hay eventos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const inscritos = event.inscritos_count ?? 0;
            const catColor = CATEGORY_COLORS[event.categoria] || "#64748b";
            return (
              <div
                key={event.id}
                className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-sm"
              >
                <div
                  className="size-12 rounded-lg grid place-items-center shrink-0"
                  style={{ backgroundColor: catColor + "20" }}
                >
                  <CalendarDays className="size-5" style={{ color: catColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/tutor/event/${event.id}`}
                      className="font-semibold text-sm hover:underline truncate text-[#003366]"
                    >
                      {event.titulo}
                    </Link>
                    <EstatusBadge estado={event.estado} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>{CATEGORY_LABEL[event.categoria] || event.categoria}</span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3" />
                      {formatDate(event.fecha_inicio)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3" />
                      {inscritos} inscritos
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {event.estado === "RECHAZADO" && (
                    <Button size="sm" variant="outline" onClick={() => setMotivoEvent(event)}>
                      <AlertCircle className="size-3.5 mr-1 text-red-500" /> Ver motivo
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant={event.estado === "RECHAZADO" ? "ghost" : "outline"}
                  >
                    <Link to={`/tutor/event/${event.id}`}>
                      <Eye className="size-3.5 mr-1" /> Ver detalle
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivo modal */}
      <Dialog
        open={!!motivoEvent}
        onOpenChange={(v) => {
          if (!v) setMotivoEvent(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#003366]">Motivo de rechazo</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
            {motivoEvent?.motivo_rechazo
              ? motivoEvent.motivo_rechazo
              : "El VOAE no especificó un motivo."}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setMotivoEvent(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
