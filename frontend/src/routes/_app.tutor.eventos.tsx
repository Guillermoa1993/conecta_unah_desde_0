import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, Eye, X, AlertCircle } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { EVENTS, CATEGORY_LABEL, CATEGORY_COLORS, getEventInscripciones } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_app/tutor/eventos")({
  component: TutorEventosPage,
});

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

function formatDate(iso: string): string {
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

function TutorEventosPage() {
  const { user } = useRole();
  const [tab, setTab] = useState<Tab>("activos");
  const [motivoEvent, setMotivoEvent] = useState<(typeof EVENTS)[number] | null>(null);

  const tutorEvents = useMemo(() => EVENTS.filter((e) => e.tutor_id === user.id), [user.id]);

  const filteredEvents = useMemo(
    () => tutorEvents.filter((e) => TAB_ESTADOS[tab].includes(e.estado)),
    [tutorEvents, tab],
  );

  const counts = useMemo(
    () => ({
      activos: tutorEvents.filter((e) => TAB_ESTADOS.activos.includes(e.estado)).length,
      pendientes: tutorEvents.filter((e) => TAB_ESTADOS.pendientes.includes(e.estado)).length,
      cerrados: tutorEvents.filter((e) => TAB_ESTADOS.cerrados.includes(e.estado)).length,
      rechazados: tutorEvents.filter((e) => TAB_ESTADOS.rechazados.includes(e.estado)).length,
    }),
    [tutorEvents],
  );

  const rechazadosCount = counts.rechazados;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Mis Eventos</h1>
        <p className="text-sm text-muted-foreground">Gestiona y da seguimiento a tus eventos.</p>
      </div>

      {tab === "rechazados" && rechazadosCount > 0 && (
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
                ? "border-[#1e3a5f] text-[#1e3a5f]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {TAB_LABEL[t]} ({counts[t]})
          </button>
        ))}
      </div>

      {/* Event list */}
      {filteredEvents.length === 0 ? (
        <div className="py-20 text-center">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No hay eventos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const inscritos = getEventInscripciones(event.id);
            const catColor = CATEGORY_COLORS[event.categoria] || "#64748b";
            return (
              <div
                key={event.id}
                className="rounded-xl border bg-card p-4 flex items-center gap-4 shadow-soft"
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
                      to="/tutor/events/$id"
                      params={{ id: event.id }}
                      className="font-semibold text-sm hover:underline truncate"
                    >
                      {event.titulo}
                    </Link>
                    <EstatusBadge estado={event.estado} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>{CATEGORY_LABEL[event.categoria]}</span>
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
                      <AlertCircle className="size-3.5 mr-1" /> Ver motivo
                    </Button>
                  )}
                  <Button
                    asChild
                    size="sm"
                    variant={event.estado === "RECHAZADO" ? "ghost" : "outline"}
                  >
                    <Link to="/tutor/events/$id" params={{ id: event.id }}>
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
            <DialogTitle>Motivo de rechazo</DialogTitle>
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
