import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarDays, PlusCircle, CheckCircle2, Eye, History, Clock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useRole } from "@/lib/role-context";
import { EVENTS, CATEGORY_LABEL, CATEGORY_COLORS, getEventInscripciones } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/gestion/")({
  component: GestionIndex,
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

function GestionIndex() {
  const { role } = useRole();
  if (role === "empleado") return <EmpleadoGestion />;
  return <VoaeGestion />;
}

/* ───────── EMPLEADO GESTION ───────── */
function EmpleadoGestion() {
  const navigate = useNavigate();

  const empleadoEvents = useMemo(() => EVENTS.filter((e) => e.tutor_id === "EMP-0034"), []);

  const counts = useMemo(
    () => ({
      activos: empleadoEvents.filter((e) => e.estado === "PROGRAMADO" || e.estado === "EN_CURSO")
        .length,
      pendientes: empleadoEvents.filter((e) => e.estado === "PENDIENTE_APROBACION").length,
      cerrados: empleadoEvents.filter((e) => e.estado === "FINALIZADO" || e.estado === "RECHAZADO")
        .length,
    }),
    [empleadoEvents],
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Panel de gestión" description="Resumen de tus eventos" />

      <div className="grid sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate({ to: "/empleado/eventos" })}
          className="rounded-xl border bg-card p-5 text-left hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-[#1e3a5f]">{counts.activos}</p>
              <p className="text-sm text-muted-foreground mt-1">Activos</p>
            </div>
            <div className="size-10 rounded-lg bg-green-100 grid place-items-center">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate({ to: "/empleado/eventos" })}
          className="rounded-xl border bg-card p-5 text-left hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-amber-500">{counts.pendientes}</p>
              <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
            </div>
            <div className="size-10 rounded-lg bg-amber-100 grid place-items-center">
              <Clock className="size-5 text-amber-500" />
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate({ to: "/empleado/eventos" })}
          className="rounded-xl border bg-card p-5 text-left hover:shadow-lg transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-500">{counts.cerrados}</p>
              <p className="text-sm text-muted-foreground mt-1">Finalizados</p>
            </div>
            <div className="size-10 rounded-lg bg-slate-100 grid place-items-center">
              <History className="size-5 text-slate-500" />
            </div>
          </div>
        </button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold mb-2">Acceso rápido</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crea un nuevo evento para que los estudiantes puedan inscribirse.
        </p>
        <Button asChild style={{ backgroundColor: "#1e3a5f" }} className="text-white">
          <Link to="/empleado/create">
            <PlusCircle className="size-4 mr-1" /> Crear nuevo evento
          </Link>
        </Button>
      </div>
    </div>
  );
}

/* ───────── VOAE GESTION ───────── */
type VoaeTab = "aprobados" | "rechazados";

function VoaeGestion() {
  const [voaeTab, setVoaeTab] = useState<VoaeTab>("aprobados");

  const pendingEvents = useMemo(
    () =>
      EVENTS.filter((e) => e.estado === "PENDIENTE_APROBACION").sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [],
  );

  const closedEvents = useMemo(
    () =>
      EVENTS.filter((e) => e.estado === "FINALIZADO" || e.estado === "EN_CURSO").sort(
        (a, b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime(),
      ),
    [],
  );

  const approvedEvents = useMemo(
    () => EVENTS.filter((e) => ["PROGRAMADO", "EN_CURSO", "FINALIZADO"].includes(e.estado)),
    [],
  );

  const rejectedEvents = useMemo(() => EVENTS.filter((e) => e.estado === "RECHAZADO"), []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Panel de gestión VOAE"
        description="Operaciones de validación y auditoría"
      />

      {/* ── Pending approval section ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="size-4 text-amber-500" /> Eventos por aprobar
        </h2>
        {pendingEvents.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center">
            <CheckCircle2 className="size-10 mx-auto text-green-400 mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay eventos pendientes de aprobación.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingEvents.map((ev) => (
              <div key={ev.id} className="rounded-xl border bg-card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to="/voae/events/$id"
                    params={{ id: ev.id }}
                    className="font-semibold text-sm hover:underline"
                  >
                    {ev.titulo}
                  </Link>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap">
                    <span>Tutor: {ev.tutor_nombre}</span>
                    <span>Inicia: {formatDate(ev.fecha_inicio)}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[ev.categoria] }}
                    >
                      {CATEGORY_LABEL[ev.categoria]}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/voae/events/$id" params={{ id: ev.id }}>
                    <Eye className="size-3.5 mr-1" /> Ver evento
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Closed events ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <History className="size-4 text-slate-500" /> Eventos finalizados
        </h2>
        <div className="space-y-2">
          {closedEvents.slice(0, 5).map((ev) => {
            const inscritos = getEventInscripciones(ev.id);
            return (
              <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ev.tutor_nombre} · {formatDate(ev.fecha_inicio)} · {inscritos} asistencias
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/voae/events/$id/validacion" params={{ id: ev.id }}>
                    <Eye className="size-3.5 mr-1" /> Ver validación
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Approved / Rejected tabs ── */}
      <section>
        <div className="flex gap-1 border-b mb-3">
          {(["aprobados", "rechazados"] as VoaeTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setVoaeTab(t)}
              className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
                voaeTab === t
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "aprobados" ? "Aprobados" : "Rechazados"}
            </button>
          ))}
        </div>
        {voaeTab === "aprobados" ? (
          approvedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay eventos aprobados.</p>
          ) : (
            <div className="space-y-2">
              {approvedEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{ev.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {ev.tutor_nombre} · {ev.aprobado_por ? `Aprobado por ${ev.aprobado_por}` : ""}{" "}
                      · {formatDate(ev.created_at)}
                    </p>
                  </div>
                  <EstatusBadge estado={ev.estado} />
                </div>
              ))}
            </div>
          )
        ) : rejectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No hay eventos rechazados.</p>
        ) : (
          <div className="space-y-2">
            {rejectedEvents.map((ev) => (
              <div key={ev.id} className="rounded-xl border bg-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">{ev.tutor_nombre} · Rechazado</p>
                  {ev.motivo_rechazo && (
                    <p className="text-[11px] text-red-500 mt-1">Motivo: {ev.motivo_rechazo}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
