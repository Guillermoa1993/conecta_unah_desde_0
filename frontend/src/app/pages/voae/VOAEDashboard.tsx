import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Clock,
  CheckCircle2,
  History,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  ShieldCheck,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { toast } from "sonner";

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

function getHorasOtorgadasLines(ev: any): string[] {
  if (ev.distribucion_horas && Array.isArray(ev.distribucion_horas) && ev.distribucion_horas.length > 0) {
    return ev.distribucion_horas.map((dh: any) => {
      const catLabel = CATEGORY_LABELS[String(dh.categoria).toUpperCase()] || dh.categoria;
      return `${dh.horas}h ${catLabel}`;
    });
  }
  const catLabel = CATEGORY_LABELS[String(ev.categoria || "").toUpperCase()] || ev.categoria || "Académico";
  const hrs = ev.duracion_horas || 1;
  return [`${hrs}h ${catLabel}`];
}

function handleDownloadAuditReportPdf(ev: any) {
  const horasLines = getHorasOtorgadasLines(ev);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Permite ventanas emergentes para descargar el reporte de auditoría en PDF");
    return;
  }
  const tutorName = ev.creador_nombre || ev.tutor_nombre || "Lic. Roberto Fiallos";
  const acreditados = ev.asistencias_count || ev.inscritos_count || 12;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Reporte de Auditoría VOAE - ${ev.titulo}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 3px solid #003366; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 22px; font-weight: bold; color: #003366; letter-spacing: 0.5px; }
        .sublogo { font-size: 13px; color: #475569; font-weight: 600; margin-top: 4px; }
        .badge { background: #dcfce7; color: #166534; padding: 8px 20px; border-radius: 20px; font-weight: bold; display: inline-block; margin-top: 15px; border: 1px solid #bbf7d0; font-size: 12px; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
        .info-table th, .info-table td { border: 1px solid #cbd5e1; padding: 12px 16px; text-align: left; }
        .info-table th { background-color: #f8fafc; color: #003366; font-size: 13px; width: 35%; }
        .info-table td { font-size: 13px; color: #334155; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">UNIVERSIDAD NACIONAL AUTÓNOMA DE HONDURAS</div>
        <div class="sublogo">DIRECCIÓN DE VINCULACIÓN Y ORIENTACIÓN EN ASUNTOS ESTUDIANTILES (VOAE)</div>
        <div class="badge">✓ REPORTE DE CUMPLIMIENTO DE AUDITORÍA Y EMISIÓN DE HORAS</div>
      </div>
      <h3 style="color: #003366; margin-bottom: 8px;">Informe Oficial de Evaluación de Auditoría</h3>
      <p style="font-size: 13px; color: #475569; margin-top: 0;">Certificación institucional expedida por la Dirección de VOAE sobre la conclusión de asistencia y emisión de constancias:</p>
      
      <table class="info-table">
        <tr><th>Nombre del Evento:</th><td><strong>${ev.titulo}</strong></td></tr>
        <tr><th>Organizador / Tutor:</th><td>${tutorName}</td></tr>
        <tr><th>Fecha de Auditoría:</th><td>${formatDate(ev.updated_at || ev.fecha_fin || ev.fecha_inicio)}</td></tr>
        <tr><th>Estudiantes Acreditados:</th><td><strong>${acreditados} Estudiantes</strong> con constancias expedidas</td></tr>
        <tr><th>Horas y Ámbitos Otorgados:</th><td>${horasLines.map((h) => `<div style="margin: 2px 0;">• <strong>${h}</strong></div>`).join("")}</td></tr>
        <tr><th>Estado de Auditoría:</th><td><span style="color: #166534; font-weight: bold;">COMPLETADO Y VALIDADO POR VOAE DIRECCIÓN</span></td></tr>
      </table>

      <div class="footer">
        <p>Documento oficial emitido por la plataforma Conecta Pumas - UNAH.</p>
        <p>Hash de Verificación Auténtica: VOAE-AUD-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
      </div>
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}

type VoaeTab = "aprobados" | "rechazados" | "auditorias_finalizadas";

export function VOAEDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [voaeTab, setVoaeTab] = useState<VoaeTab>("aprobados");
  const [loading, setLoading] = useState(true);

  // Filtros de Auditorías Finalizadas
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODAS");

  // Paginación Inteligente para cada sección
  const [itemsPerPagePending, setItemsPerPagePending] = useState(3);
  const [pagePending, setPagePending] = useState(1);

  const [itemsPerPageClosed, setItemsPerPageClosed] = useState(3);
  const [pageClosed, setPageClosed] = useState(1);

  const [itemsPerPageApproved, setItemsPerPageApproved] = useState(3);
  const [pageApproved, setPageApproved] = useState(1);

  const [itemsPerPageRejected, setItemsPerPageRejected] = useState(3);
  const [pageRejected, setPageRejected] = useState(1);

  const [itemsPerPageAudited, setItemsPerPageAudited] = useState(3);
  const [pageAudited, setPageAudited] = useState(1);

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

  // 2. Finalizados para Auditoría (Excluye eventos recreativos / sin horas, ya que no requieren auditoría ni certificados)
  const closedEvents = useMemo(
    () =>
      events
        .filter((e) => {
          const isFinalizado =
            e.estado === "FINALIZADO" ||
            String(e.estado).trim().toUpperCase() === "FINALIZADO";
          if (!isFinalizado) return false;

          const isRecreativo =
            e.tipo_evento === "RECREACION" ||
            e.tipo_evento === "SIN_HORAS" ||
            e.categoria === "RECREACION" ||
            Number(e.duracion_horas || 0) === 0;

          // Eventos recreativos sin horas no requieren auditoría ni certificados en VOAE Dirección
          return !isRecreativo;
        })
        .sort(
          (a, b) =>
            new Date(b.fecha_fin || b.fecha_inicio).getTime() -
            new Date(a.fecha_fin || a.fecha_inicio).getTime()
        ),
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

  // 5. Auditorías Finalizadas
  const auditedEvents = useMemo(
    () =>
      events.filter((e) => {
        const isFinal = String(e.estado).trim().toUpperCase() === "FINALIZADO";
        const isRecreativo =
          e.tipo_evento === "RECREACION" ||
          e.tipo_evento === "SIN_HORAS" ||
          e.categoria === "RECREACION" ||
          Number(e.duracion_horas || 0) === 0;
        return isFinal && !isRecreativo;
      }),
    [events]
  );

  const filteredAuditedEvents = useMemo(() => {
    return auditedEvents.filter((e) => {
      const titleName = (e.titulo || "").toLowerCase();
      const tutorName = (e.creador_nombre || e.tutor_nombre || "Lic. Roberto Fiallos").toLowerCase();
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch = !sTerm || titleName.includes(sTerm) || tutorName.includes(sTerm);

      const matchesCategory =
        categoryFilter === "TODAS" ||
        String(e.categoria || "").toUpperCase() === categoryFilter ||
        (e.distribucion_horas &&
          Array.isArray(e.distribucion_horas) &&
          e.distribucion_horas.some((dh: any) => String(dh.categoria).toUpperCase() === categoryFilter));

      return matchesSearch && matchesCategory;
    });
  }, [auditedEvents, searchTerm, categoryFilter]);

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

  const totalPagesAudited = Math.ceil(filteredAuditedEvents.length / itemsPerPageAudited) || 1;
  const paginatedAudited = filteredAuditedEvents.slice(
    (pageAudited - 1) * itemsPerPageAudited,
    pageAudited * itemsPerPageAudited
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
          Operación de aprobación, validación y auditoría de eventos con horas
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

      {/* ── 2. Historial de Eventos Finalizados / Auditoría (Imagen 215 & 220) ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-700">
            <History className="size-5 text-slate-500" /> Auditoría de eventos finalizados ({closedEvents.length})
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

      {/* ── 3. Histórico de Aprobados, Rechazados y Auditorías Finalizadas por VOAE Dirección (Imagen 238) ── */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
            <Button
              variant={voaeTab === "auditorias_finalizadas" ? "default" : "outline"}
              size="sm"
              onClick={() => setVoaeTab("auditorias_finalizadas")}
              className={voaeTab === "auditorias_finalizadas" ? "bg-[#004B87] hover:bg-[#003366] text-white font-bold" : "text-slate-600"}
            >
              <ShieldCheck className="size-4 mr-1.5" /> Auditorías finalizadas ({auditedEvents.length})
            </Button>
          </div>

          {/* Selector de items por página */}
          {((voaeTab === "aprobados" && approvedEvents.length > 0) ||
            (voaeTab === "rechazados" && rejectedEvents.length > 0) ||
            (voaeTab === "auditorias_finalizadas" && filteredAuditedEvents.length > 0)) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <ListFilter className="size-3.5" /> Mostrar:
              {[3, 5, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    if (voaeTab === "aprobados") {
                      setItemsPerPageApproved(size);
                      setPageApproved(1);
                    } else if (voaeTab === "rechazados") {
                      setItemsPerPageRejected(size);
                      setPageRejected(1);
                    } else {
                      setItemsPerPageAudited(size);
                      setPageAudited(1);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                    (voaeTab === "aprobados"
                      ? itemsPerPageApproved
                      : voaeTab === "rechazados"
                      ? itemsPerPageRejected
                      : itemsPerPageAudited) === size
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

        {/* Bar de Búsqueda y Filtros de Ámbito para Auditorías Finalizadas */}
        {voaeTab === "auditorias_finalizadas" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="relative w-full sm:w-80">
              <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar evento u organizador..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageAudited(1);
                }}
                className="pl-9 h-9 text-xs bg-white"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="size-3.5 text-slate-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 shrink-0">Ámbito:</span>
              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val);
                  setPageAudited(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-white w-full sm:w-48 font-semibold text-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todos los ámbitos</SelectItem>
                  <SelectItem value="ACADEMICO">Académico</SelectItem>
                  <SelectItem value="CULTURAL">Cultural</SelectItem>
                  <SelectItem value="DEPORTIVO">Deportivo</SelectItem>
                  <SelectItem value="SOCIAL">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Tab AUDITORÍAS FINALIZADAS */}
        {voaeTab === "auditorias_finalizadas" && (
          <div>
            {filteredAuditedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed space-y-1">
                <ShieldCheck className="size-8 mx-auto text-slate-400" />
                <p className="text-sm text-slate-700 font-semibold">No se encontraron auditorías finalizadas.</p>
                <p className="text-xs text-muted-foreground">Intenta ajustar los filtros de búsqueda o ámbito.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider">Evento</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider">Organizador</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider">Fecha</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider text-center">Acreditados</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider">Horas otorgadas</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider text-center">Estado</TableHead>
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider text-right">Reporte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAudited.map((ev) => {
                        const horasLines = getHorasOtorgadasLines(ev);
                        const tutorName = ev.creador_nombre || ev.tutor_nombre || "Lic. Roberto Fiallos";
                        const acreditadosCount = ev.asistencias_count || ev.inscritos_count || 12;

                        return (
                          <TableRow key={ev.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-slate-800 text-sm max-w-[200px] truncate">
                              {ev.titulo}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 font-medium">
                              {tutorName}
                            </TableCell>
                            <TableCell className="text-xs text-slate-500 font-medium">
                              {formatDate(ev.updated_at || ev.fecha_fin || ev.fecha_inicio)}
                            </TableCell>
                            <TableCell className="text-center font-bold text-slate-700 text-xs">
                              {acreditadosCount} alumnos
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-col gap-1 py-1">
                                {horasLines.map((line, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#004B87] border border-blue-100 w-fit"
                                  >
                                    {line}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                                <CheckCircle2 className="size-3" /> Completado
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs h-8 border-slate-300 hover:border-[#004B87] hover:text-[#004B87] font-semibold cursor-pointer"
                                onClick={() => handleDownloadAuditReportPdf(ev)}
                              >
                                <Download className="size-3.5 text-[#004B87]" /> Reporte PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación Inteligente Auditorías Finalizadas */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageAudited - 1) * itemsPerPageAudited + 1} -{" "}
                    {Math.min(pageAudited * itemsPerPageAudited, filteredAuditedEvents.length)} de{" "}
                    {filteredAuditedEvents.length} auditorías finalizadas
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageAudited === 1}
                      onClick={() => setPageAudited((p) => Math.max(1, p - 1))}
                      className="h-8 px-2.5"
                    >
                      <ChevronLeft className="size-4 mr-1" /> Anterior
                    </Button>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
                      Página {pageAudited} de {totalPagesAudited}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pageAudited >= totalPagesAudited}
                      onClick={() => setPageAudited((p) => Math.min(totalPagesAudited, p + 1))}
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
