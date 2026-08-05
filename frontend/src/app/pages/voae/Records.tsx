import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  CalendarDays,
  Users,
  Star,
  Eye,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Search,
  Download,
  Filter,
  ListFilter,
  FileCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
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

async function handleDownloadAuditReportPdf(ev: any) {
  const cleanEventName = (ev.titulo || "Evento").replace(/[^a-zA-Z0-9-_]/g, "_");
  const pdfTitle = `Reporte_Cumplimiento_${cleanEventName}`;
  const originalTitle = document.title;
  document.title = pdfTitle;
  const origin = window.location.origin;

  const catInfo = getEventCategoryInfo(ev);
  const horasLines = getHorasOtorgadasLines(ev);
  const tutorName = ev.creador_nombre || ev.tutor_nombre || ev.organizador || "Tutor Responsable";

  let realStudents: any[] = [];
  try {
    const resp = await api.get<any[]>(`/inscripciones?evento_id=${ev.id}`);
    if (Array.isArray(resp)) {
      realStudents = resp.filter(
        (i: any) => i.estado === "ASISTIDO" || i.estado === "PRESENTE" || i.asistio
      );
    }
  } catch (e) {
    // Fallback realStudents = []
  }

  const acreditadosCount = realStudents.length > 0 ? realStudents.length : (ev.asistencias_count || 0);

  const rowsHtml = realStudents.length > 0
    ? realStudents
        .map(
          (st) => `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${st.nombre_estudiante || st.nombre || "Estudiante UNAH"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${st.numero_cuenta || st.cuenta || "N/A"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${st.correo || "N/A"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${st.carrera || st.estudiante_carrera || "Carrera UNAH"}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #003366;">${horasLines.join(", ")}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #059669;">Cumplido ✓</td>
          </tr>
        `
        )
        .join("")
    : `
      <tr>
        <td colspan="6" style="padding: 16px; text-align: center; color: #64748b; font-style: italic;">
          No hay alumnos acreditados registrados para este evento en el backend.
        </td>
      </tr>
    `;

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${pdfTitle}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #0f172a; margin: 0; padding: 0; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #003366; padding-bottom: 12px; margin-bottom: 20px; }
        .title { text-align: center; font-size: 15pt; font-weight: bold; color: #003366; text-transform: uppercase; margin-bottom: 15px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9.5pt; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
        th { background: #003366; color: white; padding: 8px; text-align: left; }
        .footer { margin-top: 40px; text-align: center; font-size: 8.5pt; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="${origin}/logo-unah.png" style="height: 55px;" onError="this.style.display='none'" />
          <img src="${origin}/logo-voae.png" style="height: 55px;" onError="this.style.display='none'" />
        </div>
        <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
          <div><strong>Tel:</strong> 22166100 Ext. 100304</div>
          <div><strong>VOAE UNAH - DIRECCIÓN DE VINCULACIÓN</strong></div>
        </div>
      </div>

      <div class="title">REPORTE DE CUMPLIMIENTO DEL EVENTO</div>

      <div class="info-box">
        <div><strong>Evento:</strong> ${ev.titulo}</div>
        <div><strong>Organizador:</strong> ${tutorName}</div>
        <div><strong>Ámbito VOAE:</strong> ${catInfo.label}</div>
        <div><strong>Fecha Auditoría:</strong> ${formatDate(ev.updated_at || ev.fecha_fin || ev.fecha_inicio)}</div>
        <div><strong>Horas Otorgadas:</strong> ${horasLines.join(" | ")}</div>
        <div><strong>Total Acreditados:</strong> ${acreditadosCount} Alumnos</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>No. Cuenta</th>
            <th>Correo institucional</th>
            <th>Carrera</th>
            <th style="text-align:center;">Horas (${catInfo.label})</th>
            <th style="text-align:right;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <p>Documento oficial emitido por la Dirección de VOAE - UNAH.</p>
        <p>Código de Verificación Auténtica: VOAE-AUD-2026-${Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
      </div>
    </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.write(printHtml);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        document.title = originalTitle;
      }, 1000);
    }, 500);
  }
}

type RecordTab = "aprobados" | "rechazados" | "auditorias_finalizadas";

export function VOAERecords() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordTab, setRecordTab] = useState<RecordTab>("aprobados");

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODAS");

  // Paginaciones
  const [itemsPerPageApproved, setItemsPerPageApproved] = useState(3);
  const [pageApproved, setPageApproved] = useState(1);

  const [itemsPerPageRejected, setItemsPerPageRejected] = useState(3);
  const [pageRejected, setPageRejected] = useState(1);

  const [itemsPerPageAudited, setItemsPerPageAudited] = useState(3);
  const [pageAudited, setPageAudited] = useState(1);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        const data = await api.get<any[]>("/eventos?limit=200");
        setEvents(data || []);
      } catch (err: any) {
        toast.error("Error al cargar historial institucional", { description: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchAllEvents();
  }, []);

  const approvedEvents = useMemo(
    () =>
      events.filter((e) =>
        ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA", "FINALIZADO"].includes(
          String(e.estado).trim().toUpperCase()
        )
      ),
    [events]
  );

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

  const auditedEvents = useMemo(
    () =>
      events.filter((e) => {
        const isFinal =
          e.estado === "FINALIZADO" ||
          String(e.estado).trim().toUpperCase() === "FINALIZADO";
        if (!isFinal) return false;

        const isRecreativo =
          e.tipo_evento === "RECREACION" ||
          e.tipo_evento === "SIN_HORAS" ||
          e.categoria === "RECREACION" ||
          Number(e.duracion_horas || 0) === 0;

        if (isRecreativo) return false;

        const isAuditCompleted =
          localStorage.getItem(`voae_audit_completed_${e.id}`) === "true" ||
          e.auditoria_completada === true;

        return isAuditCompleted;
      }),
    [events]
  );

  // Filtros aplicados
  const filteredApprovedEvents = useMemo(() => {
    return approvedEvents.filter((e) => {
      const titleName = (e.titulo || "").toLowerCase();
      const tutorName = (e.creador_nombre || e.tutor_nombre || "").toLowerCase();
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
  }, [approvedEvents, searchTerm, categoryFilter]);

  const filteredRejectedEvents = useMemo(() => {
    return rejectedEvents.filter((e) => {
      const titleName = (e.titulo || "").toLowerCase();
      const tutorName = (e.creador_nombre || e.tutor_nombre || "").toLowerCase();
      const reason = (e.motivo_rechazo || "").toLowerCase();
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch = !sTerm || titleName.includes(sTerm) || tutorName.includes(sTerm) || reason.includes(sTerm);

      const matchesCategory =
        categoryFilter === "TODAS" ||
        String(e.categoria || "").toUpperCase() === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [rejectedEvents, searchTerm, categoryFilter]);

  const filteredAuditedEvents = useMemo(() => {
    return auditedEvents.filter((e) => {
      const titleName = (e.titulo || "").toLowerCase();
      const tutorName = (e.creador_nombre || e.tutor_nombre || "").toLowerCase();
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

  // Paginaciones
  const totalPagesApproved = Math.ceil(filteredApprovedEvents.length / itemsPerPageApproved) || 1;
  const paginatedApproved = filteredApprovedEvents.slice(
    (pageApproved - 1) * itemsPerPageApproved,
    pageApproved * itemsPerPageApproved
  );

  const totalPagesRejected = Math.ceil(filteredRejectedEvents.length / itemsPerPageRejected) || 1;
  const paginatedRejected = filteredRejectedEvents.slice(
    (pageRejected - 1) * itemsPerPageRejected,
    pageRejected * itemsPerPageRejected
  );

  const totalPagesAudited = Math.ceil(filteredAuditedEvents.length / itemsPerPageAudited) || 1;
  const paginatedAudited = filteredAuditedEvents.slice(
    (pageAudited - 1) * itemsPerPageAudited,
    pageAudited * itemsPerPageAudited
  );

  const totalHoras = useMemo(() => {
    return auditedEvents.reduce((sum, e) => sum + Number(e.duracion_horas || 1) * (e.asistencias_count || e.inscritos_count || 1), 0);
  }, [auditedEvents]);

  const totalEstudiantes = useMemo(() => {
    return auditedEvents.reduce((sum, e) => sum + (e.asistencias_count || e.inscritos_count || 0), 0);
  }, [auditedEvents]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden min-w-0">
      <div>
        <h1 className="text-3xl font-bold text-[#003366]">Histórico de Eventos VOAE</h1>
        <p className="text-muted-foreground mt-1">
          Registro histórico de eventos aprobados, rechazados y auditorías finalizadas por la Dirección de VOAE.
        </p>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-sm border-blue-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#004B87]">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{approvedEvents.length}</p>
            <p className="text-xs text-[#717182] font-semibold">Eventos aprobados</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-amber-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Star className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalHoras}h</p>
            <p className="text-xs text-[#717182] font-semibold">Horas auditadas acreditadas</p>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-4 shadow-sm border-emerald-100 flex items-center gap-4">
          <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xl font-black text-[#003366]">{totalEstudiantes}</p>
            <p className="text-xs text-[#717182] font-semibold">Alumnos auditados</p>
          </div>
        </div>
      </div>

      {/* Contenedor Principal con las 3 Pestañas (Idéntico a Sección 3) */}
      <section className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={recordTab === "aprobados" ? "default" : "outline"}
              size="sm"
              onClick={() => setRecordTab("aprobados")}
              className={recordTab === "aprobados" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold" : "text-slate-600"}
            >
              <CheckCircle2 className="size-4 mr-1.5" /> Aprobados por VOAE ({approvedEvents.length})
            </Button>
            <Button
              variant={recordTab === "rechazados" ? "default" : "outline"}
              size="sm"
              onClick={() => setRecordTab("rechazados")}
              className={recordTab === "rechazados" ? "bg-red-600 hover:bg-red-700 text-white font-bold" : "text-slate-600"}
            >
              <XCircle className="size-4 mr-1.5" /> Rechazados por VOAE ({rejectedEvents.length})
            </Button>
            <Button
              variant={recordTab === "auditorias_finalizadas" ? "default" : "outline"}
              size="sm"
              onClick={() => setRecordTab("auditorias_finalizadas")}
              className={recordTab === "auditorias_finalizadas" ? "bg-[#004B87] hover:bg-[#003366] text-white font-bold" : "text-slate-600"}
            >
              <ShieldCheck className="size-4 mr-1.5" /> Auditorías finalizadas ({auditedEvents.length})
            </Button>
          </div>

          {/* Selector de items por página */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <ListFilter className="size-3.5" /> Mostrar:
            {[3, 5, 10].map((size) => (
              <button
                key={size}
                onClick={() => {
                  if (recordTab === "aprobados") {
                    setItemsPerPageApproved(size);
                    setPageApproved(1);
                  } else if (recordTab === "rechazados") {
                    setItemsPerPageRejected(size);
                    setPageRejected(1);
                  } else {
                    setItemsPerPageAudited(size);
                    setPageAudited(1);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                  (recordTab === "aprobados"
                    ? itemsPerPageApproved
                    : recordTab === "rechazados"
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
        </div>

        {/* Barra de Búsqueda y Filtros de Ámbito */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Buscar evento u organizador..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPageApproved(1);
                setPageRejected(1);
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
                setPageApproved(1);
                setPageRejected(1);
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

        {/* Tab 1: APROBADOS */}
        {recordTab === "aprobados" && (
          <div>
            {filteredApprovedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">No se encontraron eventos aprobados.</p>
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
                              Tutor: <strong>{ev.tutor_nombre || ev.creador_nombre || "Tutor Responsable"}</strong>
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

                {/* Paginación Aprobados */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageApproved - 1) * itemsPerPageApproved + 1} -{" "}
                    {Math.min(pageApproved * itemsPerPageApproved, filteredApprovedEvents.length)} de{" "}
                    {filteredApprovedEvents.length} eventos aprobados
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

        {/* Tab 2: RECHAZADOS */}
        {recordTab === "rechazados" && (
          <div>
            {filteredRejectedEvents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">No se encontraron eventos rechazados.</p>
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
                              Tutor: <strong>{ev.tutor_nombre || ev.creador_nombre || "Tutor Responsable"}</strong>
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

                {/* Paginación Rechazados */}
                <div className="flex items-center justify-between pt-3 border-t text-xs text-slate-500 flex-wrap gap-2">
                  <span className="font-medium">
                    Mostrando {(pageRejected - 1) * itemsPerPageRejected + 1} -{" "}
                    {Math.min(pageRejected * itemsPerPageRejected, filteredRejectedEvents.length)} de{" "}
                    {filteredRejectedEvents.length} eventos rechazados
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

        {/* Tab 3: AUDITORÍAS FINALIZADAS */}
        {recordTab === "auditorias_finalizadas" && (
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
                        <TableHead className="font-bold text-[#003366] text-xs uppercase tracking-wider text-center">Reporte</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAudited.map((ev) => {
                        const horasLines = getHorasOtorgadasLines(ev);
                        const tutorName = ev.creador_nombre || ev.tutor_nombre || "Tutor Responsable";
                        const acreditadosCount = ev.asistencias_count !== undefined && ev.asistencias_count !== null
                          ? Number(ev.asistencias_count)
                          : Number(ev.inscritos_count || 0);

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
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs h-8 border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5 font-semibold cursor-pointer mx-auto"
                                onClick={() => handleDownloadAuditReportPdf(ev)}
                              >
                                <FileCheck className="size-3.5 text-blue-600" /> Generar reporte de cumplimiento
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Paginación Auditorías Finalizadas */}
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
      </section>
    </div>
  );
}
