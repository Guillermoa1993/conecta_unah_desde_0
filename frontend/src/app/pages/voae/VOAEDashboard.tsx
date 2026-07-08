import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Clock, CheckCircle2, History, Eye } from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#003366",
  CULTURAL: "#d97706",
  DEPORTIVO: "#059669",
  SOCIAL: "#7c3aed",
};

const CATEGORY_LABELS: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
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

type VoaeTab = "aprobados" | "rechazados";

export function VOAEDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [voaeTab, setVoaeTab] = useState<VoaeTab>("aprobados");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.get<any[]>("/eventos");
        setEvents(data);
      } catch (err) {
        console.error("Error al cargar eventos en VOAE Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const pendingEvents = useMemo(
    () =>
      events
        .filter((e) => e.estado === "PENDIENTE_APROBACION")
        .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [events]
  );

  const closedEvents = useMemo(
    () =>
      events
        .filter((e) => e.estado === "FINALIZADO")
        .sort((a, b) => new Date(b.fecha_fin || "").getTime() - new Date(a.fecha_fin || "").getTime()),
    [events]
  );

  const approvedEvents = useMemo(
    () => events.filter((e) => ["PROGRAMADO", "EN_CURSO", "FINALIZADO"].includes(e.estado)),
    [events]
  );

  const rejectedEvents = useMemo(() => events.filter((e) => e.estado === "RECHAZADO"), [events]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#003366]">Panel de Gestión VOAE</h1>
        <p className="text-muted-foreground mt-1">Operaciones de validación y auditoría de eventos de estudiantes y tutores.</p>
      </div>

      {/* ── Pending approval section ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#003366]">
          <Clock className="size-5 text-amber-500 animate-pulse" /> Eventos Pendientes de Aprobación
        </h2>
        {pendingEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <CheckCircle2 className="size-10 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No hay eventos pendientes de aprobación.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingEvents.map((ev) => (
              <div key={ev.id_evento} className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{ev.titulo}</h3>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                    <span>Tutor: <strong className="text-slate-700">{ev.tutor_nombre || "N/A"}</strong></span>
                    <span>Fecha: {formatDate(ev.fecha_inicio)}</span>
                    <span>Lugar: {ev.lugar || ev.ubicacion || "N/A"}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[ev.categoria] || "#64748b" }}
                    >
                      {CATEGORY_LABELS[ev.categoria] || ev.categoria}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-[#004B87] hover:bg-[#003366] text-white">
                  <Link to={`/voae/events/${ev.id_evento}/validar`}>
                    <Eye className="size-3.5 mr-1" /> Validar propuesta
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Closed events ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-700">
          <History className="size-5 text-slate-500" /> Historial de Eventos Finalizados
        </h2>
        {closedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos finalizados recientemente.</p>
        ) : (
          <div className="space-y-3">
            {closedEvents.slice(0, 5).map((ev) => (
              <div key={ev.id_evento} className="rounded-lg border p-3 flex items-center gap-3 bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-1">
                    Organizador: {ev.tutor_nombre} · Fin: {formatDate(ev.fecha_fin)} · {ev.inscritos_count || 0} alumnos inscritos
                  </p>
                </div>
                <Button asChild size="sm" variant="outline" className="border-slate-300">
                  <Link to={`/voae/events/${ev.id_evento}/validar`}>
                    <Eye className="size-3.5 mr-1" /> Ver detalles
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Approved / Rejected tabs ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex gap-1 border-b mb-4">
          {(["aprobados", "rechazados"] as VoaeTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setVoaeTab(t)}
              className={`px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px ${
                voaeTab === t
                  ? "border-[#003366] text-[#003366]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "aprobados" ? "Aprobados / Activos" : "Rechazados"}
            </button>
          ))}
        </div>
        {voaeTab === "aprobados" ? (
          approvedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No hay eventos aprobados.</p>
          ) : (
            <div className="space-y-3">
              {approvedEvents.map((ev) => (
                <div key={ev.id_evento} className="rounded-lg border p-3 flex items-center gap-3 bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-850">{ev.titulo}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                      Tutor: {ev.tutor_nombre} {ev.aprobado_por ? `· Autorizado por ${ev.aprobado_por}` : ""} · Inicio: {formatDate(ev.fecha_inicio)}
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
          <div className="space-y-3">
            {rejectedEvents.map((ev) => (
              <div key={ev.id_evento} className="rounded-lg border p-3 flex items-center gap-3 bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{ev.titulo}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">Tutor: {ev.tutor_nombre} · Rechazado</p>
                  {ev.motivo_rechazo && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium bg-red-50 p-2 rounded border border-red-100">
                      Motivo: {ev.motivo_rechazo}
                    </p>
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
