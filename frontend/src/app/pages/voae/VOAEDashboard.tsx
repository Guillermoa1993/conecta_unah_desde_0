import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Clock, CheckCircle2, History, Eye, XCircle, ChevronLeft, ChevronRight, ListFilter, ShieldCheck } from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#003366",
  CULTURAL: "#d97706",
  DEPORTIVO: "#059669",
  SOCIAL: "#7c3aed",
  RECREACION: "#8b5cf6",
};

const CATEGORY_LABELS: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
  RECREACION: "Recreativo",
};

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getEventCategoryInfo(ev: any): { label: string; color: string } {
  const isRecreativo =
    ev.tipo_evento === "RECREACION" ||
    ev.tipo_evento === "SIN_HORAS" ||
    ev.categoria === "RECREACION" ||
    Number(ev.duracion_horas || 0) === 0;

  if (isRecreativo) {
    return { label: "Recreativo", color: "#8b5cf6" };
  }

  if (ev.distribucion_horas && Array.isArray(ev.distribucion_horas) && ev.distribucion_horas.length > 0) {
    const cats = ev.distribucion_horas.map((dh: any) => dh.categoria).filter(Boolean);
    const primaryCat = String(cats[0] || "").toUpperCase();
    const label = cats
      .map((c: string) => CATEGORY_LABELS[c.toUpperCase()] || c)
      .join(", ");
    const color = CATEGORY_COLORS[primaryCat] || "#003366";
    return { label, color };
  }

  const catKey = String(ev.categoria || "").toUpperCase();
  const label = CATEGORY_LABELS[catKey] || ev.categoria || "Académico";
  const color = CATEGORY_COLORS[catKey] || "#003366";
  return { label, color };
}

type VoaeTab = "aprobados" | "rechazados";

export function VOAEDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [voaeTab, setVoaeTab] = useState<VoaeTab>("aprobados");
  const [loading, setLoading] = useState(true);

  // Paginación Inteligente para cada sección
  const [itemsPerPagePending, setItemsPerPagePending] = useState(3);
  const [pagePending, setPagePending] = useState(1);

  const [itemsPerPageClosed, setItemsPerPageClosed] = useState(3);
  const [pageClosed, setPageClosed] = useState(1);

  const [itemsPerPageApproved, setItemsPerPageApproved] = useState(3);
  const [pageApproved, setPageApproved] = useState(1);

  const [itemsPerPageRejected, setItemsPerPageRejected] = useState(3);
  const [pageRejected, setPageRejected] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>("/eventos?limit=200");
        setEvents(data || []);
      } catch (err) {
        console.error("Error al cargar eventos en VOAE Dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // 1. Pendientes VOAE Dirección
  const pendingEvents = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.estado === "PENDIENTE_APROBACION_VOAE" ||
            e.estado === "PENDIENTE_APROBACION"
        )
        .sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()),
    [events]
  );

  // 2. Finalizados para Auditoría
  const closedEvents = useMemo(
    () =>
      events
        .filter(
          (e) =>
            e.estado === "FINALIZADO" ||
            String(e.estado).trim().toUpperCase() === "FINALIZADO"
        )
        .sort((a, b) => new Date(b.fecha_fin || b.fecha_inicio).getTime() - new Date(a.fecha_fin || a.fecha_inicio).getTime()),
    [events]
  );

  // 3. Aprobados por VOAE Dirección
  const approvedEvents = useMemo(
    () =>
      events.filter((e) =>
        ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA", "FINALIZADO"].includes(
          String(e.estado).trim().toUpperCase()
        )
      ),
    [events]
  );

  // 4. Rechazados por VOAE Dirección (excluye los rechazados por Coordinación de Depto)
  const rejectedEvents = useMemo(
    () =>
      events.filter((e) => {
        if (String(e.estado).trim().toUpperCase() !== "RECHAZADO") return false;
        const m = String(e.motivo_rechazo || "");
        if (m.startsWith("[DEPTO]")) return false;
        return true;
      }),
    [events]
  );

  // Cálculos de Paginación
  const totalPagesPending = Math.ceil(pendingEvents.length / itemsPerPagePending) || 1;
  const paginatedPending = pendingEvents.slice(
    (pagePending - 1) * itemsPerPagePending,
    pagePending * itemsPerPagePending
  );

  const totalPagesClosed = Math.ceil(closedEvents.length / itemsPerPageClosed) || 1;
  const paginatedClosed = closedEvents.slice(
    (pageClosed - 1) * itemsPerPageClosed,
    pageClosed * itemsPerPageClosed
  );

  const totalPagesApproved = Math.ceil(approvedEvents.length / itemsPerPageApproved) || 1;
  const paginatedApproved = approvedEvents.slice(
    (pageApproved - 1) * itemsPerPageApproved,
    pageApproved * itemsPerPageApproved
  );

  const totalPagesRejected = Math.ceil(rejectedEvents.length / itemsPerPageRejected) || 1;
  const paginatedRejected = rejectedEvents.slice(
    (pageRejected - 1) * itemsPerPageRejected,
    pageRejected * itemsPerPageRejected
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
        <h1 className="text-3xl font-bold text-[#003366]">Panel de Gestión VOAE</h1>
        <p className="text-muted-foreground mt-1">
          Operaciones de validación y auditoría de eventos de estudiantes y tutores.
        </p>
      </div>

      {/* ── 1. Eventos Pendientes de Aprobación VOAE (Imagen 214) ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[#003366]">
            <Clock className="size-5 text-amber-500 animate-pulse" /> Eventos Pendientes de Aprobación ({pendingEvents.length})
          </h2>
          {pendingEvents.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ListFilter className="size-3.5" /> Mostrar:
              {[3, 5, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setItemsPerPagePending(size);
                    setPagePending(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    itemsPerPagePending === size
                      ? "bg-[#004B87] text-white border-[#004B87]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {pendingEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <CheckCircle2 className="size-10 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No hay eventos pendientes de aprobación en VOAE Dirección.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedPending.map((ev) => {
                const catInfo = getEventCategoryInfo(ev);
                return (
                  <div key={ev.id} className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">{ev.titulo}</h3>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                        {(() => {
                          const rawLoc = ev.lugar || ev.ubicacion || "N/A";
                          const [cleanLoc] = rawLoc.split("|");
                          const solicitante = ev.creador_nombre || ev.tutor_nombre || ev.solicitante || ev.organizador || "Solicitante";

                          return (
                            <>
                              <span>Solicitante: <strong className="text-slate-700">{solicitante}</strong></span>
                              <span>Fecha: {formatDate(ev.fecha_inicio)}</span>
                              <span>Lugar: {cleanLoc}</span>
                            </>
                          );
                        })()}
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                          style={{ backgroundColor: catInfo.color }}
                        >
                          {catInfo.label}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-[#004B87] hover:bg-[#003366] text-white shadow-sm font-semibold">
                      <Link to={`/voae/events/${ev.id}/validar`}>
                        <Eye className="size-3.5 mr-1" /> Validar propuesta
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Paginación Pendientes (Siempre visible) */}
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
              <span className="font-medium">
                Mostrando {(pagePending - 1) * itemsPerPagePending + 1} -{" "}
                {Math.min(pagePending * itemsPerPagePending, pendingEvents.length)} de{" "}
                {pendingEvents.length} eventos pendientes
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagePending === 1}
                  onClick={() => setPagePending((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5"
                >
                  <ChevronLeft className="size-4 mr-1" /> Anterior
                </Button>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  Página {pagePending} de {totalPagesPending}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagePending >= totalPagesPending}
                  onClick={() => setPagePending((p) => Math.min(totalPagesPending, p + 1))}
                  className="h-8 px-2.5"
                >
                  Siguiente <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 2. Historial de Eventos Finalizados / Auditoría (Imagen 215) ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
            <History className="size-5 text-slate-500" /> Historial de Eventos Finalizados ({closedEvents.length})
          </h2>
          {closedEvents.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ListFilter className="size-3.5" /> Mostrar:
              {[3, 5, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setItemsPerPageClosed(size);
                    setPageClosed(1);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    itemsPerPageClosed === size
                      ? "bg-[#004B87] text-white border-[#004B87]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {closedEvents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground font-medium">No hay eventos finalizados recientemente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {paginatedClosed.map((ev) => (
                <div key={ev.id} className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{ev.titulo}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-1">
                      Organizador: <strong>{ev.tutor_nombre || ev.creador_nombre || "Tutor"}</strong> · Fin: {formatDate(ev.fecha_fin)} · {ev.inscritos_count || 0} alumnos inscritos
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-slate-300 hover:border-[#004B87] hover:text-[#004B87] font-semibold">
                    <Link to={`/voae/events/${ev.id}/validacion`}>
                      <ShieldCheck className="size-3.5 mr-1.5 text-emerald-600" /> Ver validaciones
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {/* Paginación Finalizados (Siempre visible) */}
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
              <span className="font-medium">
                Mostrando {(pageClosed - 1) * itemsPerPageClosed + 1} -{" "}
                {Math.min(pageClosed * itemsPerPageClosed, closedEvents.length)} de{" "}
                {closedEvents.length} eventos finalizados
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageClosed === 1}
                  onClick={() => setPageClosed((p) => Math.max(1, p - 1))}
                  className="h-8 px-2.5"
                >
                  <ChevronLeft className="size-4 mr-1" /> Anterior
                </Button>
                <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                  Página {pageClosed} de {totalPagesClosed}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageClosed >= totalPagesClosed}
                  onClick={() => setPageClosed((p) => Math.min(totalPagesClosed, p + 1))}
                  className="h-8 px-2.5"
                >
                  Siguiente <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 3. Histórico de Aprobados y Rechazados por VOAE Dirección (Imagen 216 & 219) ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={voaeTab === "aprobados" ? "default" : "outline"}
              size="sm"
              onClick={() => setVoaeTab("aprobados")}
              className={voaeTab === "aprobados" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "text-slate-600"}
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Aprobados por VOAE ({approvedEvents.length})
            </Button>
            <Button
              variant={voaeTab === "rechazados" ? "default" : "outline"}
              size="sm"
              onClick={() => setVoaeTab("rechazados")}
              className={voaeTab === "rechazados" ? "bg-red-600 hover:bg-red-700 text-white font-bold" : "text-slate-600"}
            >
              <XCircle className="size-4 mr-1.5" /> Rechazados por VOAE ({rejectedEvents.length})
            </Button>
          </div>

          {/* Selector de items por página */}
          {((voaeTab === "aprobados" && approvedEvents.length > 0) ||
            (voaeTab === "rechazados" && rejectedEvents.length > 0)) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ListFilter className="size-3.5" /> Mostrar:
              {[3, 5, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (voaeTab === "aprobados") {
                      setItemsPerPageApproved(size);
                      setPageApproved(1);
                    } else {
                      setItemsPerPageRejected(size);
                      setPageRejected(1);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    (voaeTab === "aprobados" ? itemsPerPageApproved : itemsPerPageRejected) === size
                      ? "bg-[#004B87] text-white border-[#004B87]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab APROBADOS */}
        {voaeTab === "aprobados" && (
          <div>
            {approvedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">No hay eventos aprobados por VOAE Dirección.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedApproved.map((ev) => {
                    const catInfo = getEventCategoryInfo(ev);
                    return (
                      <div key={ev.id} className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm truncate">{ev.titulo}</h3>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                              Aprobado por VOAE
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                            <span>
                              Tutor: <strong>{ev.tutor_nombre || ev.creador_nombre || "Tutor"}</strong>
                            </span>
                            <span>Inicio: {formatDate(ev.fecha_inicio)}</span>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                              style={{ backgroundColor: catInfo.color }}
                            >
                              {catInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginación Aprobados (Siempre visible) */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageApproved - 1) * itemsPerPageApproved + 1} -{" "}
                    {Math.min(pageApproved * itemsPerPageApproved, approvedEvents.length)} de{" "}
                    {approvedEvents.length} eventos aprobados
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageApproved === 1}
                      onClick={() => setPageApproved((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5"
                    >
                      <ChevronLeft className="size-4 mr-1" /> Anterior
                    </Button>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                      Página {pageApproved} de {totalPagesApproved}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageApproved >= totalPagesApproved}
                      onClick={() => setPageApproved((p) => Math.min(totalPagesApproved, p + 1))}
                      className="h-8 px-2.5"
                    >
                      Siguiente <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab RECHAZADOS */}
        {voaeTab === "rechazados" && (
          <div>
            {rejectedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">No hay eventos rechazados por VOAE Dirección.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {paginatedRejected.map((ev) => {
                    const catInfo = getEventCategoryInfo(ev);
                    return (
                      <div key={ev.id} className="rounded-lg border p-4 flex items-center gap-4 bg-red-50/50 hover:bg-red-50 transition-colors border-red-200">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800 text-sm truncate">{ev.titulo}</h3>
                            <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">
                              Rechazado por VOAE
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1 flex-wrap font-medium">
                            <span>
                              Tutor: <strong>{ev.tutor_nombre || ev.creador_nombre || "Tutor"}</strong>
                            </span>
                            <span>Fecha: {formatDate(ev.fecha_inicio)}</span>
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                              style={{ backgroundColor: catInfo.color }}
                            >
                              {catInfo.label}
                            </span>
                          </div>
                          {ev.motivo_rechazo && (
                            <p className="text-xs text-red-700 font-medium mt-1.5 bg-white/70 p-2 rounded-md border border-red-200">
                              Motivo de rechazo: {String(ev.motivo_rechazo).replace(/^\[(DEPTO|VOAE)\]\s*/, "")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginación Rechazados (Siempre visible) */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageRejected - 1) * itemsPerPageRejected + 1} -{" "}
                    {Math.min(pageRejected * itemsPerPageRejected, rejectedEvents.length)} de{" "}
                    {rejectedEvents.length} eventos rechazados
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageRejected === 1}
                      onClick={() => setPageRejected((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5"
                    >
                      <ChevronLeft className="size-4 mr-1" /> Anterior
                    </Button>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                      Página {pageRejected} de {totalPagesRejected}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageRejected >= totalPagesRejected}
                      onClick={() => setPageRejected((p) => Math.min(totalPagesRejected, p + 1))}
                      className="h-8 px-2.5"
                    >
                      Siguiente <ChevronRight className="size-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
