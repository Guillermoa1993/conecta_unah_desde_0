import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Clock, CheckCircle2, Eye, Building2 } from "lucide-react";
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

export function VOAEDeptoDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>("/eventos/pendientes?fase=DEPTO");
        setEvents(data || []);
      } catch (err) {
        console.error("Error al cargar eventos de Coordinación:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const pendingDeptoEvents = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.estado === "PENDIENTE_APROBACION_DEPTO" ||
            e.estado === "PENDIENTE_APROBACION"
        )
        .sort(
          (a, b) =>
            new Date(a.fecha_inicio).getTime() -
            new Date(b.fecha_inicio).getTime()
        ),
    [events]
  );

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
        <h1 className="text-3xl font-bold text-[#003366]">
          Panel de Gestión Coordinación
        </h1>
        <p className="text-muted-foreground mt-1">
          Revisión y aprobación inicial de propuestas de eventos por facultad y carrera.
        </p>
      </div>

      {/* ── Pendientes Coordinación ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#003366]">
          <Clock className="size-5 text-amber-500 animate-pulse" /> Solicitudes Pendientes de Aprobación Coordinación
        </h2>
        {pendingDeptoEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <CheckCircle2 className="size-10 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No hay solicitudes pendientes en Coordinación.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingDeptoEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {ev.titulo}
                    </h3>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Building2 className="size-3" /> Facultad / Depto
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                    {(() => {
                      const rawLoc = ev.lugar || ev.ubicacion || "N/A";
                      const [cleanLoc] = rawLoc.split("|");
                      const solicitante =
                        ev.creador_nombre ||
                        ev.tutor_nombre ||
                        ev.solicitante ||
                        ev.organizador ||
                        "Solicitante";

                      return (
                        <>
                          <span>
                            Solicitante:{" "}
                            <strong className="text-slate-700">{solicitante}</strong>
                          </span>
                          <span>Fecha: {formatDate(ev.fecha_inicio)}</span>
                          <span>Lugar: {cleanLoc}</span>
                        </>
                      );
                    })()}
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[ev.categoria] || "#64748b",
                      }}
                    >
                      {CATEGORY_LABELS[ev.categoria] || ev.categoria}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" className="bg-[#004B87] hover:bg-[#003366] text-white">
                  <Link to={`/voae-depto/events/${ev.id}/validar`}>
                    <Eye className="size-3.5 mr-1" /> Revisar propuesta
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
