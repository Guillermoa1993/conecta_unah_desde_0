import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Clock, CheckCircle2, XCircle, Eye, Building2, ChevronLeft, ChevronRight } from "lucide-react";
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

type TabType = "aprobados" | "rechazados";

export function VOAEDeptoDashboard() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("aprobados");

  // Paginación
  const ITEMS_PER_PAGE = 5;
  const [pagePending, setPagePending] = useState(1);
  const [pageApproved, setPageApproved] = useState(1);
  const [pageRejected, setPageRejected] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Carga eventos del backend
        const data = await api.get<any[]>("/eventos?limit=200");
        setAllEvents(data || []);
      } catch (err) {
        console.error("Error al cargar eventos en Coordinación Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 1. Pendientes de Coordinación
  const pendingDeptoEvents = useMemo(
    () =>
      allEvents
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
    [allEvents]
  );

  // 2. Aprobados por Coordinación (enviados a VOAE, programados, en curso, finalizados)
  const approvedDeptoEvents = useMemo(
    () =>
      allEvents
        .filter((e) =>
          [
            "PENDIENTE_APROBACION_VOAE",
            "PROGRAMADO",
            "EN_CURSO",
            "EN_CURSO_SALIDA",
            "FINALIZADO",
          ].includes(String(e.estado).trim().toUpperCase())
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.fecha_inicio).getTime() -
            new Date(a.updated_at || a.fecha_inicio).getTime()
        ),
    [allEvents]
  );

  // 3. Rechazados por Coordinación
  const rejectedDeptoEvents = useMemo(
    () =>
      allEvents
        .filter(
          (e) => String(e.estado).trim().toUpperCase() === "RECHAZADO"
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.fecha_inicio).getTime() -
            new Date(a.updated_at || a.fecha_inicio).getTime()
        ),
    [allEvents]
  );

  // Paginación de pendientes
  const totalPagesPending = Math.ceil(pendingDeptoEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedPending = pendingDeptoEvents.slice(
    (pagePending - 1) * ITEMS_PER_PAGE,
    pagePending * ITEMS_PER_PAGE
  );

  // Paginación de aprobados
  const totalPagesApproved = Math.ceil(approvedDeptoEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedApproved = approvedDeptoEvents.slice(
    (pageApproved - 1) * ITEMS_PER_PAGE,
    pageApproved * ITEMS_PER_PAGE
  );

  // Paginación de rechazados
  const totalPagesRejected = Math.ceil(rejectedDeptoEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedRejected = rejectedDeptoEvents.slice(
    (pageRejected - 1) * ITEMS_PER_PAGE,
    pageRejected * ITEMS_PER_PAGE
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

      {/* ── 1. Pendientes Coordinación ── */}
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
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedPending.map((ev) => (
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
                  <Button asChild size="sm" className="bg-[#004B87] hover:bg-[#003366] text-white font-semibold">
                    <Link to={`/voae-depto/events/${ev.id}/validar`}>
                      <Eye className="size-3.5 mr-1" /> Revisar propuesta
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* Paginación de Pendientes */}
            {totalPagesPending > 1 && (
              <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                <span>
                  Mostrando {(pagePending - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(pagePending * ITEMS_PER_PAGE, pendingDeptoEvents.length)} de{" "}
                  {pendingDeptoEvents.length} registros
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagePending === 1}
                    onClick={() => setPagePending((p) => p - 1)}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="size-4 mr-1" /> Anterior
                  </Button>
                  <span className="font-semibold text-slate-700">
                    {pagePending} / {totalPagesPending}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagePending === totalPagesPending}
                    onClick={() => setPagePending((p) => p + 1)}
                    className="h-8 px-2"
                  >
                    Siguiente <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 2. Histórico de Aprobados y Rechazados por Coordinación ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        {/* Selector de pestañas: Aprobados / Rechazados */}
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "aprobados" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aprobados")}
              className={activeTab === "aprobados" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "text-slate-600"}
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Aprobados por Coordinación ({approvedDeptoEvents.length})
            </Button>
            <Button
              variant={activeTab === "rechazados" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("rechazados")}
              className={activeTab === "rechazados" ? "bg-red-600 hover:bg-red-700 text-white font-bold" : "text-slate-600"}
            >
              <XCircle className="size-4 mr-1.5" /> Rechazados por Coordinación ({rejectedDeptoEvents.length})
            </Button>
          </div>
        </div>

        {/* Tab content APROBADOS */}
        {activeTab === "aprobados" && (
          <div>
            {approvedDeptoEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">
                  No hay propuestas aprobadas registradas por Coordinación.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedApproved.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">
                            {ev.titulo}
                          </h3>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {ev.estado === "PENDIENTE_APROBACION_VOAE" ? "Aprobado por Depto → Enviado a VOAE" : "Aprobado Final"}
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

                {/* Paginación de Aprobados */}
                {totalPagesApproved > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                    <span>
                      Mostrando {(pageApproved - 1) * ITEMS_PER_PAGE + 1} -{" "}
                      {Math.min(pageApproved * ITEMS_PER_PAGE, approvedDeptoEvents.length)} de{" "}
                      {approvedDeptoEvents.length} registros
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageApproved === 1}
                        onClick={() => setPageApproved((p) => p - 1)}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="size-4 mr-1" /> Anterior
                      </Button>
                      <span className="font-semibold text-slate-700">
                        {pageApproved} / {totalPagesApproved}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageApproved === totalPagesApproved}
                        onClick={() => setPageApproved((p) => p + 1)}
                        className="h-8 px-2"
                      >
                        Siguiente <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab content RECHAZADOS */}
        {activeTab === "rechazados" && (
          <div>
            {rejectedDeptoEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">
                  No hay propuestas rechazadas registradas por Coordinación.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedRejected.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border p-4 flex items-center gap-4 bg-red-50/50 hover:bg-red-50 transition-colors border-red-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 text-sm truncate">
                            {ev.titulo}
                          </h3>
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                            Rechazado
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
                        {ev.motivo_rechazo && (
                          <p className="text-xs text-red-700 font-medium mt-1.5 bg-white/70 p-2 rounded-md border border-red-200">
                            Motivo de rechazo: {ev.motivo_rechazo}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginación de Rechazados */}
                {totalPagesRejected > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-slate-500">
                    <span>
                      Mostrando {(pageRejected - 1) * ITEMS_PER_PAGE + 1} -{" "}
                      {Math.min(pageRejected * ITEMS_PER_PAGE, rejectedDeptoEvents.length)} de{" "}
                      {rejectedDeptoEvents.length} registros
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageRejected === 1}
                        onClick={() => setPageRejected((p) => p - 1)}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="size-4 mr-1" /> Anterior
                      </Button>
                      <span className="font-semibold text-slate-700">
                        {pageRejected} / {totalPagesRejected}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pageRejected === totalPagesRejected}
                        onClick={() => setPageRejected((p) => p + 1)}
                        className="h-8 px-2"
                      >
                        Siguiente <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
