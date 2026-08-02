import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { Clock, CheckCircle2, XCircle, Eye, Building2, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
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

type TabType = "aprobados" | "rechazados";

export function VOAEDeptoDashboard() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("aprobados");

  // Paginación Inteligente
  const [itemsPerPagePending, setItemsPerPagePending] = useState(3);
  const [pagePending, setPagePending] = useState(1);

  const [itemsPerPageApproved, setItemsPerPageApproved] = useState(3);
  const [pageApproved, setPageApproved] = useState(1);

  const [itemsPerPageRejected, setItemsPerPageRejected] = useState(3);
  const [pageRejected, setPageRejected] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
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

  // 2. Aprobados por Coordinación
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

  // 3. Rechazados por Coordinación (excluye los rechazados por Dirección VOAE)
  const rejectedDeptoEvents = useMemo(
    () =>
      allEvents
        .filter((e) => {
          if (String(e.estado).trim().toUpperCase() !== "RECHAZADO") return false;
          const m = String(e.motivo_rechazo || "");
          if (m.startsWith("[VOAE]")) return false;
          return true;
        })
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.fecha_inicio).getTime() -
            new Date(a.updated_at || a.fecha_inicio).getTime()
        ),
    [allEvents]
  );

  // Paginación Pendientes
  const totalPagesPending = Math.ceil(pendingDeptoEvents.length / itemsPerPagePending) || 1;
  const paginatedPending = pendingDeptoEvents.slice(
    (pagePending - 1) * itemsPerPagePending,
    pagePending * itemsPerPagePending
  );

  // Paginación Aprobados
  const totalPagesApproved = Math.ceil(approvedDeptoEvents.length / itemsPerPageApproved) || 1;
  const paginatedApproved = approvedDeptoEvents.slice(
    (pageApproved - 1) * itemsPerPageApproved,
    pageApproved * itemsPerPageApproved
  );

  // Paginación Rechazados
  const totalPagesRejected = Math.ceil(rejectedDeptoEvents.length / itemsPerPageRejected) || 1;
  const paginatedRejected = rejectedDeptoEvents.slice(
    (pageRejected - 1) * itemsPerPageRejected,
    pageRejected * itemsPerPageRejected
  );

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 max-w-5xl mx-auto my-8">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#004B87] border-t-transparent"></div>
        <p className="text-xs font-bold text-[#004B87] animate-pulse">Cargando solicitudes de Coordinación de Departamento...</p>
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
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-[#003366]">
            <Clock className="size-5 text-amber-500 animate-pulse" /> Solicitudes Pendientes de Aprobación Coordinación ({pendingDeptoEvents.length})
          </h2>
          {pendingDeptoEvents.length > 0 && (
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
              {paginatedPending.map((ev) => {
                const catInfo = getEventCategoryInfo(ev);
                return (
                  <div
                    key={ev.id}
                    className="rounded-lg border p-4 flex items-center gap-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">
                          {ev.titulo}
                        </h3>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Building2 className="size-3" /> {ev.facultad || 'Facultad de Ciencias'} • {ev.departamento || ev.carrera || 'Departamento General'}
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
                          style={{ backgroundColor: catInfo.color }}
                        >
                          {catInfo.label}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" className="bg-[#004B87] hover:bg-[#003366] text-white font-semibold shadow-sm">
                      <Link to={`/voae-depto/events/${ev.id}/validar`}>
                        <Eye className="size-3.5 mr-1" /> Revisar propuesta
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Paginación de Pendientes */}
            <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
              <span className="font-medium">
                Mostrando {(pagePending - 1) * itemsPerPagePending + 1} -{" "}
                {Math.min(pagePending * itemsPerPagePending, pendingDeptoEvents.length)} de{" "}
                {pendingDeptoEvents.length} solicitudes pendientes
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

      {/* ── 2. Histórico de Aprobados y Rechazados por Coordinación ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        {/* Selector de pestañas: Aprobados / Rechazados */}
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant={activeTab === "aprobados" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("aprobados")}
              className={`w-full sm:w-auto text-left justify-center sm:justify-start ${
                activeTab === "aprobados" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "text-slate-600"
              }`}
            >
              <CheckCircle2 className="size-4 mr-1.5 shrink-0" /> Aprobados por Coordinación ({approvedDeptoEvents.length})
            </Button>
            <Button
              variant={activeTab === "rechazados" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("rechazados")}
              className={`w-full sm:w-auto text-left justify-center sm:justify-start ${
                activeTab === "rechazados" ? "bg-red-600 hover:bg-red-700 text-white font-bold" : "text-slate-600"
              }`}
            >
              <XCircle className="size-4 mr-1.5 shrink-0" /> Rechazados por Coordinación ({rejectedDeptoEvents.length})
            </Button>
          </div>

          {/* Selector de items por página */}
          {((activeTab === "aprobados" && approvedDeptoEvents.length > 0) ||
            (activeTab === "rechazados" && rejectedDeptoEvents.length > 0)) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ListFilter className="size-3.5" /> Mostrar:
              {[3, 5, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (activeTab === "aprobados") {
                      setItemsPerPageApproved(size);
                      setPageApproved(1);
                    } else {
                      setItemsPerPageRejected(size);
                      setPageRejected(1);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    (activeTab === "aprobados" ? itemsPerPageApproved : itemsPerPageRejected) === size
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
                  {paginatedApproved.map((ev) => {
                    const catInfo = getEventCategoryInfo(ev);
                    return (
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
                              Aprobado por Coordinación
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

                {/* Paginación de Aprobados (Siempre visible) */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageApproved - 1) * itemsPerPageApproved + 1} -{" "}
                    {Math.min(pageApproved * itemsPerPageApproved, approvedDeptoEvents.length)} de{" "}
                    {approvedDeptoEvents.length} eventos aprobados
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
                  {paginatedRejected.map((ev) => {
                    const catInfo = getEventCategoryInfo(ev);
                    return (
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
                              Rechazado por Coordinación
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

                {/* Paginación de Rechazados (Siempre visible) */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageRejected - 1) * itemsPerPageRejected + 1} -{" "}
                    {Math.min(pageRejected * itemsPerPageRejected, rejectedDeptoEvents.length)} de{" "}
                    {rejectedDeptoEvents.length} eventos rechazados
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
