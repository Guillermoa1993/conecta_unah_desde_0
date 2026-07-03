import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Users, Eye, Shield } from "lucide-react";
import { useRole } from "@/lib/role-context";
import {
  EVENTS,
  MODERADORES,
  CATEGORY_LABEL,
  CATEGORY_COLORS,
  getEventInscripciones,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/empleado/moderador/eventos")({
  component: ModeratorEventsPage,
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function EstatusBadge({ estado }: { estado: string }) {
  const colores: Record<string, string> = {
    ACTIVO: "#22c55e",
    EN_CURSO: "#3b82f6",
    EN_CURSO_SALIDA: "#004B87",
    PENDIENTE_APROBACION: "#f59e0b",
    CERRADO: "#64748b",
    RECHAZADO: "#ef4444",
  };
  return (
    <span
      className="text-[10px] font-semibold text-white px-2 py-0.5 rounded-full"
      style={{ backgroundColor: colores[estado] || "#64748b" }}
    >
      {estado === "PENDIENTE_APROBACION"
        ? "Pendiente"
        : estado === "EN_CURSO_SALIDA"
          ? "En curso (salida)"
          : estado.charAt(0) + estado.slice(1).toLowerCase()}
    </span>
  );
}

function ModeratorEventsPage() {
  const { user } = useRole();

  const myModeratorEntries = useMemo(
    () => MODERADORES.filter((m) => m.activo && m.usuario_id === user.id),
    [user.id],
  );

  const moderatedEventIds = useMemo(() => {
    const ids = new Set<string>();
    myModeratorEntries.forEach((m) => {
      EVENTS.forEach((e) => {
        if (e.tutor_id !== user.id) {
          ids.add(e.id);
        }
      });
    });
    return ids;
  }, [myModeratorEntries, user.id]);

  const moderatedEvents = useMemo(
    () => EVENTS.filter((e) => moderatedEventIds.has(e.id) && e.tutor_id !== user.id),
    [moderatedEventIds, user.id],
  );

  const permissions = useMemo(() => {
    const perms = new Set<string>();
    myModeratorEntries.forEach((m) => m.permisos.forEach((p) => perms.add(p)));
    return perms;
  }, [myModeratorEntries]);

  if (moderatedEvents.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold">Eventos donde soy moderador</h1>
          <p className="text-sm text-muted-foreground">
            No tienes eventos asignados como moderador.
          </p>
        </div>
        <div className="py-20 text-center">
          <Shield className="size-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Cuando te asignen como moderador de un evento, aparecerá aquí.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Eventos donde soy moderador</h1>
        <p className="text-sm text-muted-foreground">
          {permissions.has("ASISTENCIA") && permissions.has("FEED")
            ? "Tienes permisos de Asistencia y Feed"
            : permissions.has("ASISTENCIA")
              ? "Tienes permiso de Asistencia"
              : permissions.has("FEED")
                ? "Tienes permiso de Feed"
                : ""}
        </p>
      </div>

      <div className="space-y-3">
        {moderatedEvents.map((event) => {
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
                  <span className="font-semibold text-sm truncate">{event.titulo}</span>
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
                <Button asChild size="sm" variant="outline">
                  <Link to="/empleado/events/$id" params={{ id: event.id }}>
                    <Eye className="size-3.5 mr-1" /> Ver detalle
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
