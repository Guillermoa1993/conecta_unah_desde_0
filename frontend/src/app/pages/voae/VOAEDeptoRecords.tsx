import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { CheckCircle2, History, ArrowLeft } from "lucide-react";
import { api } from "../../../services/api";

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

export function VOAEDeptoRecords() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>("/eventos?limit=200");
        setEvents(data || []);
      } catch (err) {
        console.error("Error al cargar historial de Coordinación:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const historyEvents = useMemo(
    () =>
      events
        .filter((e) =>
          [
            "PENDIENTE_APROBACION_VOAE",
            "PROGRAMADO",
            "EN_CURSO",
            "FINALIZADO",
            "RECHAZADO",
          ].includes(String(e.estado).trim().toUpperCase())
        )
        .sort(
          (a, b) =>
            new Date(b.created_at || b.fecha_inicio).getTime() -
            new Date(a.created_at || a.fecha_inicio).getTime()
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
      <Link
        to="/voae-depto"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#004B87] transition font-medium"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-[#003366]">
          Histórico de Eventos Coordinación
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro histórico de propuestas evaluadas por la Coordinación de Departamento.
        </p>
      </div>

      <section className="bg-white rounded-xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#003366]">
          <History className="size-5 text-slate-500" /> Eventos Evaluados
        </h2>
        {historyEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <CheckCircle2 className="size-10 mx-auto text-slate-400 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">
              No hay historial de eventos en Coordinación.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyEvents.map((ev) => (
              <div
                key={ev.id}
                className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {ev.titulo}
                    </h3>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{
                        backgroundColor:
                          ev.estado === "RECHAZADO"
                            ? "#ef4444"
                            : ev.estado === "PENDIENTE_APROBACION_VOAE"
                            ? "#0284c7"
                            : "#22c55e",
                      }}
                    >
                      {ev.estado === "RECHAZADO"
                        ? "Rechazado"
                        : ev.estado === "PENDIENTE_APROBACION_VOAE"
                        ? "Enviado a VOAE"
                        : "Aprobado"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                    <span>
                      Solicitante:{" "}
                      <strong className="text-slate-700">
                        {ev.creador_nombre || ev.tutor_nombre || "Solicitante"}
                      </strong>
                    </span>
                    <span>Fecha: {formatDate(ev.fecha_inicio)}</span>
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
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
