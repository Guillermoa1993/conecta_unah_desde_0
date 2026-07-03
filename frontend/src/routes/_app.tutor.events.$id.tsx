import { useState, useRef, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  Star,
  QrCode,
  Download,
  Play,
  Square,
  Send,
  RefreshCw,
  Copy,
  Upload,
  X,
  AlertTriangle,
  Camera,
  Lock,
  Mail,
  FileText,
  Eye,
  Pen,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatsCard } from "@/components/app/StatsCard";
import { VoaeDrawer } from "@/components/app/VoaeDrawer";
import { RatingDrawer } from "@/components/app/RatingDrawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QRCodeCanvas } from "qrcode.react";
import {
  EVENTS,
  getEnrollments,
  ENCUESTAS,
  STATUS_LABEL,
  CATEGORY_LABEL,
  CATEGORY_COLORS,
  getEventInscripciones,
  getEventAsistencias,
  type UniEvent,
  type EventStatus,
} from "@/lib/mock-data";
import { downloadConstanciaPdf, MESES, generateSealCanvasDataUrl } from "@/lib/constancia-pdf";
import { PdfModal, SignatureModal } from "@/components/app/ConstanciaModal";
import {
  eventAttendanceCodes,
  generateCode,
  eventQrData,
  eventQrTokens,
  eventRejectionReasons,
} from "@/lib/event-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { EventTimeline } from "@/components/app/EventTimeline";
import { IdentityVerificationModal } from "@/components/app/IdentityVerificationModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_app/tutor/events/$id")({
  loader: ({ params }) => {
    const eventoData = EVENTS.find((e) => e.id === params.id);
    if (!eventoData) throw notFound();
    return { event: eventoData };
  },
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Evento no encontrado</div>
  ),
  errorComponent: ({ error }) => <div className="p-8">Error: {error.message}</div>,
  component: EventDashboard,
});

function EventDashboard() {
  const { event: loadedEvent } = Route.useLoaderData() as { event: UniEvent };
  const [eventStatus, setEventStatus] = useState<EventStatus>(loadedEvent.estado);
  const currentEvent = { ...loadedEvent, estado: eventStatus };
  const [certificadosEstado, setCertificadosEstado] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`certificados_estado_${loadedEvent.id}`) || "LISTO_PARA_ENVIAR";
    }
    return "LISTO_PARA_ENVIAR";
  });
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [voaeDrawerOpen, setVoaeDrawerOpen] = useState(false);
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [identityCheck, setIdentityCheck] = useState<{
    studentName: string;
    studentId: string;
    studentCareer: string;
    onConfirm: () => void;
  } | null>(null);

  const [finalizationQrUrl, setFinalizationQrUrl] = useState<string | null>(null);

  // PDF / Certificate state
  const [pdfStudent, setPdfStudent] = useState<any>(null);
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null);
  const [stampKey, setStampKey] = useState(0);
  const [firmadasSet, setFirmadasSet] = useState<Set<string>>(new Set());
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const signCert = (eventId: string, studentId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem(`cert_signed_${eventId}`) || "[]");
      if (!stored.includes(studentId)) {
        stored.push(studentId);
        localStorage.setItem(`cert_signed_${eventId}`, JSON.stringify(stored));
      }
    } catch {
      localStorage.setItem(`cert_signed_${eventId}`, JSON.stringify([studentId]));
    }
  };
  const isCertSigned = (eventId: string, studentId: string): boolean => {
    try {
      return JSON.parse(localStorage.getItem(`cert_signed_${eventId}`) || "[]").includes(studentId);
    } catch { return false; }
  };
  const abrirPdfModal = (s: any) => {
    setPdfStudent(s);
    setSignatureDataURL(null);
    setStampKey(0);
  };
  const cerrarPdfModal = () => {
    setPdfStudent(null);
    setSignatureDataURL(null);
  };
  const handleConfirmSignature = (dataURL: string) => {
    setSignatureDataURL(dataURL);
    setShowSignatureModal(false);
    setStampKey((v) => v + 1);
    signCert(loadedEvent.id, pdfStudent.studentId || pdfStudent.estudiante_id);
    setFirmadasSet((prev) => new Set(prev).add(pdfStudent.studentId || pdfStudent.estudiante_id));
  };
  const handleSealComplete = (_studentId: string) => {};
  const handleDownloadPDF = async (s: any) => {
    const evDate = new Date(loadedEvent.fecha_inicio);
    const today = new Date();
    await downloadConstanciaPdf({
      estudiante_nombre: s.studentName || s.estudiante_nombre,
      estudiante_carrera: s.studentCareer || s.estudiante_carrera || "No especificada",
      estudiante_cuenta: s.studentId || s.estudiante_id,
      tutor_nombre: loadedEvent.tutor_nombre,
      evento_nombre: loadedEvent.titulo,
      evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
      horas: loadedEvent.duracion_horas,
      categoria: CATEGORY_LABEL[loadedEvent.categoria],
      voae_nombre: "Tutor",
      fecha_dia: today.getDate(),
      fecha_mes: MESES[today.getMonth()],
      fecha_anio: today.getFullYear(),
      constancia_id: `const-${s.studentId || s.estudiante_id}-${loadedEvent.id}`,
    });
  };

  // Generate 6-digit attendance code
  const [attendanceCode, setAttendanceCode] = useState(() => {
    if (!eventAttendanceCodes[loadedEvent.id])
      eventAttendanceCodes[loadedEvent.id] = generateCode();
    return eventAttendanceCodes[loadedEvent.id];
  });
  const regenerateCode = () => {
    const code = generateCode();
    eventAttendanceCodes[loadedEvent.id] = code;
    setAttendanceCode(code);
    toast.success("Nuevo código generado");
  };
  const copyCode = () => {
    navigator.clipboard?.writeText(attendanceCode);
    toast.success("Código copiado al portapapeles");
  };

  const enrolled = getEventInscripciones(loadedEvent.id);
  const attended = getEventAsistencias(loadedEvent.id);
  const enrollments = getEnrollments(loadedEvent.id, enrolled);
  const attendedCount = enrollments.filter((e) => e.attended).length;

  const eventEncuestas = ENCUESTAS.slice(0, Math.min(6, attended));
  const avgRating =
    eventEncuestas.length > 0
      ? eventEncuestas.reduce((s, c) => s + c.calificacion_evento, 0) / eventEncuestas.length
      : 0;

  // Attendance tracking state
  const [attendanceState, setAttendanceState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(enrollments.map((e) => [e.id, e.attended])),
  );

  const toggleAttendance = (id: string, value: boolean) => {
    setAttendanceState((prev) => ({ ...prev, [id]: value }));
  };

  const markAllAttended = () => {
    setAttendanceState((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, true])));
    toast.success("Todos marcados como asistidos");
  };

  const handleStartEvent = () => {
    setEventStatus("EN_CURSO");
    toast.success("Evento iniciado", {
      style: { backgroundColor: "#22c55e", color: "white" },
    });
  };

  const handleFinishEvent = () => {
    setFinishConfirmOpen(false);
    const isConHoras = currentEvent.tipo_evento === "HORAS_VOAE";
    setEventStatus(isConHoras ? "FINALIZADO" : "CERRADO");
    const qrId = crypto.randomUUID();
    setFinalizationQrUrl(`https://conectapumas.app/finalizar/${currentEvent.id}/${qrId}`);
    if (isConHoras) setVoaeDrawerOpen(true);
  };

  const downloadPdf = () => {
    const ubicacionLabel = (v: boolean | undefined | null) => {
      if (v === true) return "✓";
      if (v === false) return "⚠";
      return "—";
    };
    const ubicacionEntryLabel = (v: boolean | undefined | null) => `E:${ubicacionLabel(v)}`;
    const ubicacionExitLabel = (v: boolean | undefined | null) => `S:${ubicacionLabel(v)}`;
    const rows = enrollments
      .map(
        (s) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd">${s.studentName}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px">${s.studentId}</td>
        <td style="padding:8px 12px;border:1px solid #ddd">${s.email}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">
          ${attendanceState[s.id] ? '<span style="color:#22c55e;font-weight:600">Asistió</span>' : '<span style="color:#ef4444;font-weight:600">No asistió</span>'}
        </td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${s.hora_llegada ? s.hora_llegada.slice(11, 16) : "-"}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${s.hora_salida ? s.hora_salida.slice(11, 16) : s.hora_llegada ? "Sin salida" : "-"}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${ubicacionEntryLabel(s.ubicacion_entrada_validada)} ${ubicacionExitLabel(s.ubicacion_salida_validada)}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <html>
      <head><meta charset="utf-8"><title>Lista de Asistencia - ${loadedEvent.titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; color: var(--puma-dark); }
        .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f1f5f9; padding: 8px 12px; text-align: left; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; color: #64748b; }
      </style></head>
      <body>
        <h1>${loadedEvent.titulo}</h1>
        <div class="meta">Tutor: ${loadedEvent.tutor_nombre} &mdash; Fecha: ${loadedEvent.fecha_inicio.slice(0, 10)}</div>
        <table>
          <thead><tr>
            <th>Estudiante</th><th>No. Cuenta</th><th>Email</th><th>Estado</th><th>Hora llegada</th><th>Hora salida</th><th>Ubicación</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px;font-size:11px;color:#94a3b8;text-align:center">
          Generado el ${new Date().toLocaleDateString()} — Conecta Pumas
        </div>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/tutor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver
      </Link>

      {/* Header with actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <PageHeader
            title={currentEvent.titulo}
            description={currentEvent.descripcion}
            actions={
              <span
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium border shrink-0",
                  eventStatus === "FINALIZADO"
                    ? "bg-muted text-muted-foreground border-border"
                    : eventStatus === "PROGRAMADO"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground border-border",
                )}
              >
                {STATUS_LABEL[eventStatus]}
              </span>
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {eventStatus === "PENDIENTE_APROBACION" ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="text-white gap-1.5 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: "#22c55e" }}
                  >
                    <Play className="size-4" /> Iniciar evento
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Este evento a&uacute;n no ha sido aprobado por VOAE. Espera la aprobaci&oacute;n
                  para continuar.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="text-white gap-1.5 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: "#ef4444" }}
                  >
                    <Square className="size-4" /> Finalizar evento
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Este evento a&uacute;n no ha sido aprobado por VOAE. Espera la aprobaci&oacute;n
                  para continuar.
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="text-white gap-1.5 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: "var(--puma-blue)" }}
                  >
                    <Send className="size-4" /> Enviar a VOAE
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Este evento a&uacute;n no ha sido aprobado por VOAE. Espera la aprobaci&oacute;n
                  para continuar.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <>
              {(eventStatus === "BORRADOR" || eventStatus === "PROGRAMADO") && (
                <Button
                  className="text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={handleStartEvent}
                >
                  <Play className="size-4" /> Iniciar evento
                </Button>
              )}
              {(eventStatus === "PROGRAMADO" || eventStatus === "EN_CURSO") && (
                <Button
                  className="text-white gap-1.5"
                  style={{ backgroundColor: "#ef4444" }}
                  onClick={() => setFinishConfirmOpen(true)}
                >
                  <Square className="size-4" /> Finalizar evento
                </Button>
              )}
              {eventStatus === "FINALIZADO" && (
                <Button
                  className="text-white gap-1.5"
                  style={{
                    backgroundColor:
                      certificadosEstado === "LISTO_PARA_ENVIAR" ? "var(--puma-blue)" : "#64748b",
                  }}
                  disabled={certificadosEstado !== "LISTO_PARA_ENVIAR"}
                  onClick={() => setVoaeDrawerOpen(true)}
                >
                  <Send className="size-4" />{" "}
                  {certificadosEstado === "LISTO_PARA_ENVIAR"
                    ? "Enviar a VOAE"
                    : certificadosEstado === "EN_REVISION"
                      ? "Enviado a VOAE (En revisión)"
                      : certificadosEstado === "APROBADO"
                        ? "Aprobado por VOAE"
                        : "Rechazado por VOAE"}
                </Button>
              )}
              {eventStatus === "CERRADO" && (
                <Button disabled className="text-white gap-1.5 opacity-60 cursor-not-allowed" style={{ backgroundColor: "#64748b" }}>
                  <Square className="size-4" /> Evento finalizado
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Rejection reason */}
      {eventStatus === "RECHAZADO" && eventRejectionReasons[currentEvent.id] && (
        <div
          className="rounded-xl border p-5 flex items-start gap-4"
          style={{ borderLeft: "4px solid #ef4444", backgroundColor: "#f8f9fa" }}
        >
          <AlertTriangle className="size-5 shrink-0" style={{ color: "#ef4444" }} />
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: "#ef4444" }}>
              Tu evento fue rechazado
            </h3>
            <p className="font-medium mt-1">{currentEvent.titulo}</p>
            <div
              className="mt-2 rounded-lg p-3 text-sm"
              style={{ backgroundColor: "#f1f5f9", borderLeft: "3px solid #ef4444" }}
            >
              {eventRejectionReasons[currentEvent.id]}
            </div>
            <Button
              asChild
              className="mt-3 text-white gap-1.5"
              style={{ backgroundColor: "var(--puma-blue)" }}
            >
              <Link to="/tutor/create">
                <Upload className="size-4" /> Corregir y reenviar a VOAE
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Portada */}
      {currentEvent.portada_url ? (
        <div className="rounded-xl overflow-hidden border bg-card shadow-soft">
          <img src={currentEvent.portada_url} alt="" className="w-full h-52 object-cover" />
        </div>
      ) : (
        <div
          className="rounded-xl border bg-card shadow-soft h-40 grid place-items-center"
          style={{ backgroundColor: (CATEGORY_COLORS[currentEvent.categoria] || "#64748b") + "15" }}
        >
          <div
            className="size-20 rounded-full grid place-items-center"
            style={{ backgroundColor: (CATEGORY_COLORS[currentEvent.categoria] || "#64748b") + "25" }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: CATEGORY_COLORS[currentEvent.categoria] || "#64748b" }}
            >
              {CATEGORY_LABEL[currentEvent.categoria]?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Event meta */}
      <div className="rounded-xl border bg-card shadow-soft p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <Meta icon={CalendarDays} label="Fecha" value={currentEvent.fecha_inicio.slice(0, 10)} />
        <Meta
          icon={Clock}
          label="Hora · Duración"
          value={`${currentEvent.fecha_inicio.slice(11, 16)} · ${currentEvent.duracion_horas}h`}
        />
        <Meta icon={MapPin} label="Ubicación" value={currentEvent.lugar} />
        <Meta icon={Users} label="Categoría" value={CATEGORY_LABEL[currentEvent.categoria]} />
      </div>

      {/* Timeline */}
      <EventTimeline status={eventStatus} createdAt={currentEvent.created_at} />

      {/* QR */}
      <div className="rounded-xl border bg-card shadow-soft p-5">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="font-semibold text-sm mb-3 flex items-center gap-2">
              <QrCode className="size-4 text-primary" /> QR de Inscripci&oacute;n
            </div>
            <div className="flex items-start gap-4">
              <div
                className="size-28 shrink-0 rounded-xl border-2 p-2 grid place-items-center"
                style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
              >
                <QrDisplay eventId={currentEvent.id} qrUrl={eventQrTokens[currentEvent.id]?.qrUrl} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">
                  Este es el QR que ver&aacute;n los estudiantes cuando hagan clic en Inscribirse.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={eventStatus === "PENDIENTE_APROBACION"}
                    className={
                      eventStatus === "PENDIENTE_APROBACION" ? "opacity-50 cursor-not-allowed" : ""
                    }
                    onClick={() => {
                      const el = document.getElementById(`qr-download-${currentEvent.id}`);
                      const canvas = el?.querySelector("canvas");
                      const img = el?.querySelector("img");
                      if (img) {
                        const a = document.createElement("a");
                        a.download = `qr-${currentEvent.id}.png`;
                        a.href = img.src;
                        a.click();
                        toast.success("QR descargado");
                      } else if (canvas) {
                        const a = document.createElement("a");
                        a.download = `qr-${currentEvent.id}.png`;
                        a.href = canvas.toDataURL("image/png");
                        a.click();
                        toast.success("QR descargado");
                      } else {
                        toast.error("Error al descargar");
                      }
                    }}
                  >
                    <Download className="size-4" /> Descargar QR
                  </Button>
                  <ReemplazarQrButton
                    eventId={currentEvent.id}
                    disabled={eventStatus === "PENDIENTE_APROBACION"}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> QR de Finalizaci&oacute;n
            </div>
            {eventStatus === "FINALIZADO" && finalizationQrUrl ? (
              <div className="flex items-start gap-4">
                <div
                  className="size-28 shrink-0 rounded-xl border-2 p-2 grid place-items-center"
                  style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
                >
                  <QrDisplay eventId={`${currentEvent.id}-fin`} qrUrl={finalizationQrUrl} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    QR para que los estudiantes validen su finalizaci&oacute;n del evento.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const el = document.getElementById(`qr-download-${currentEvent.id}-fin`);
                        const canvas = el?.querySelector("canvas");
                        const img = el?.querySelector("img");
                        if (img) {
                          const a = document.createElement("a");
                          a.download = `qr-fin-${currentEvent.id}.png`;
                          a.href = img.src;
                          a.click();
                          toast.success("QR descargado");
                        } else if (canvas) {
                          const a = document.createElement("a");
                          a.download = `qr-fin-${currentEvent.id}.png`;
                          a.href = canvas.toDataURL("image/png");
                          a.click();
                          toast.success("QR descargado");
                        } else {
                          toast.error("Error al descargar");
                        }
                      }}
                    >
                      <Download className="size-4" /> Descargar QR
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div
                  className="size-28 shrink-0 rounded-xl border-2 p-2 grid place-items-center"
                  style={{ borderColor: "#e2e8f0", backgroundColor: "#f8f9fa" }}
                >
                  <Lock className="size-8" style={{ color: "#9ca3af" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Disponible al finalizar el evento</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificados generados */}
      {eventStatus === "FINALIZADO" && (
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold text-sm">Certificados generados</h3>
            <span
              className={cn(
                "text-xs px-2.5 py-1 rounded-full font-medium border",
                certificadosEstado === "APROBADO"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : certificadosEstado === "RECHAZADO"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : certificadosEstado === "EN_REVISION"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-50 text-slate-700 border-slate-200",
              )}
            >
              {certificadosEstado === "APROBADO"
                ? "Aprobado por VOAE"
                : certificadosEstado === "RECHAZADO"
                  ? "Rechazado por VOAE"
                  : certificadosEstado === "EN_REVISION"
                    ? "Enviado a revisión VOAE"
                    : "Listo para enviar a revisión"}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/50">
                <TableHead>Estudiante</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-center">Verificación</TableHead>
                <TableHead className="text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.filter((e) => attendanceState[e.id] && e.hora_salida).length > 0 ? (
                enrollments
                  .filter((e) => attendanceState[e.id] && e.hora_salida)
                  .map((s) => (
                    <TableRow key={s.id} className="hover:bg-secondary/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-white"
                            style={{ backgroundColor: "var(--puma-blue)" }}
                          >
                            {s.studentName
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="font-medium">{s.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                        >
                          <CheckCircle2 className="size-3" /> Certificado generado
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-default">
                                <CheckCircle2 className="size-5" style={{ color: "#22c55e" }} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              El estudiante inscrito coincide con quien marcó asistencia
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => {
                            const evDate = new Date(currentEvent.fecha_inicio);
                            const today = new Date();
                            downloadConstanciaPdf({
                              estudiante_nombre: s.studentName,
                              estudiante_carrera: s.studentCareer || "No especificada",
                              estudiante_cuenta: s.studentId,
                              tutor_nombre: currentEvent.tutor_nombre,
                              evento_nombre: currentEvent.titulo,
                              evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
                              horas: currentEvent.duracion_horas,
                              categoria: CATEGORY_LABEL[currentEvent.categoria],
                              voae_nombre: "Lic. Roberto Fiallos",
                              voae_cargo: "Vicerrector",
                              voae_departamento: "Orientación y Asuntos Estudiantiles",
                              voae_codigo: "ART.202606-18-S-CU",
                              fecha_dia: today.getDate(),
                              fecha_mes: MESES[today.getMonth()],
                              fecha_anio: today.getFullYear(),
                            });
                          }}
                        >
                          Ver PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No hay certificados generados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Cantidad de participantes"
          value={enrolled}
          hint={`Capacidad: ${currentEvent.cupo_maximo}`}
          icon={Users}
          tone="primary"
        />
        <StatsCard
          label="Asistencias confirmadas"
          value={attendedCount}
          hint={`${enrolled > 0 ? Math.round((attendedCount / enrolled) * 100) : 0}% del total`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatsCard
          label="Horas otorgadas"
          value={`${currentEvent.duracion_horas}h`}
          icon={Clock}
          tone="gold"
        />
        <button onClick={() => setRatingDrawerOpen(true)} className="text-left w-full">
          <StatsCard
            label="Calificación promedio"
            value={avgRating.toFixed(1)}
            hint={`${eventEncuestas.length} respuestas`}
            icon={Star}
            tone="muted"
          />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="enrolled">Matriculados ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="attendance">Asistencias ({attendedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="enrolled">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((s) => (
                  <TableRow key={s.id} className="hover:bg-secondary/30">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-white"
                          style={{ backgroundColor: "var(--puma-blue)" }}
                        >
                          {s.studentName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <span className="font-medium">{s.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-sm">{s.enrolledAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap bg-secondary/20">
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
                  onClick={markAllAttended}
                >
                  <CheckCircle2 className="size-3.5" /> Marcar todos como asistidos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
                  onClick={() => setScannerOpen(true)}
                >
                  <Camera className="size-3.5" /> Escanear QR del estudiante
                </Button>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPdf}>
                <Download className="size-3.5" /> Descargar lista PDF
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={enrollments.every((e) => attendanceState[e.id])}
                      onCheckedChange={(v) => {
                        const val = v === true;
                        setAttendanceState((prev) =>
                          Object.fromEntries(Object.keys(prev).map((k) => [k, val])),
                        );
                      }}
                    />
                  </TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Inscripción</TableHead>
                  <TableHead>Hora de llegada</TableHead>
                  <TableHead>Hora de salida</TableHead>
                  <TableHead className="text-center w-24">Certificado</TableHead>
                  <TableHead className="text-center w-16">Enviar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((s) => (
                  <TableRow key={s.id} className="hover:bg-secondary/30">
                    <TableCell>
                      <Checkbox
                        checked={attendanceState[s.id]}
                        onCheckedChange={(v) => toggleAttendance(s.id, v === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-white"
                          style={{ backgroundColor: "var(--puma-blue)" }}
                        >
                          {s.studentName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <span className="font-medium">{s.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-sm">{s.enrolledAt}</TableCell>
                    <TableCell className="text-sm">
                      {s.hora_llegada ? s.hora_llegada.slice(11, 16) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.hora_salida ? (
                        s.hora_salida.slice(11, 16)
                      ) : s.hora_llegada ? (
                        <span
                          className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                        >
                          Sin registrar salida
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 px-2"
                        style={{ borderColor: "#004B87", color: "#004B87" }}
                        onClick={() => abrirPdfModal(s)}
                      >
                        <FileText className="size-3.5" /> Certificado
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="size-8 p-0"
                              style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
                              onClick={() => {
                                const code = Math.floor(100000 + Math.random() * 900000).toString();
                                eventAttendanceCodes[currentEvent.id] = code;
                                setAttendanceCode(code);
                                toast.success(`Código enviado al correo de ${s.studentName}`, {
                                  style: { backgroundColor: "var(--puma-blue)", color: "white" },
                                });
                              }}
                            >
                              <Mail className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Enviar código por correo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Finish confirmation modal */}
      <AlertDialog open={finishConfirmOpen} onOpenChange={setFinishConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas finalizar este evento? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinishEvent}
              className="text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scanner Modal */}
      <ScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        enrollments={enrollments}
        onStudentFound={(enrollment) => {
          setScannerOpen(false);
          setIdentityCheck({
            studentName: enrollment.studentName,
            studentId: enrollment.studentId,
            studentCareer: enrollment.studentCareer ?? "No especificada",
            onConfirm: () => {
              const s = enrollments.find((e) => e.studentName === enrollment.studentName);
              if (s) toggleAttendance(s.id, true);
            },
          });
        }}
      />

      {/* Identity Verification Modal */}
      <IdentityVerificationModal
        open={identityCheck !== null}
        onOpenChange={(open) => {
          if (!open) setIdentityCheck(null);
        }}
        studentName={identityCheck?.studentName ?? ""}
        studentId={identityCheck?.studentId ?? ""}
        studentCareer={identityCheck?.studentCareer ?? ""}
        onConfirm={identityCheck?.onConfirm ?? (() => {})}
      />

      {/* Rating Drawer */}
      <RatingDrawer
        open={ratingDrawerOpen}
        onClose={() => setRatingDrawerOpen(false)}
        encuestas={eventEncuestas}
      />

      {/* VOAE Drawer */}
      <VoaeDrawer
        open={voaeDrawerOpen}
        onClose={() => setVoaeDrawerOpen(false)}
        tutorName={currentEvent.tutor_nombre}
        eventTitle={currentEvent.titulo}
        eventDate={currentEvent.fecha_inicio.slice(0, 10)}
        totalAsistentes={attendedCount}
        horasPorEstudiante={currentEvent.duracion_horas}
        eventId={currentEvent.id}
        asistentesList={enrollments.map((e) => ({
          id: e.id,
          studentName: e.studentName,
          studentId: e.studentId,
          attended: attendanceState[e.id],
        }))}
        onSubmitted={() => setCertificadosEstado("EN_REVISION")}
      />

      {/* PDF Modal */}
      {pdfStudent && (
        <PdfModal
          estudiante={{
            estudiante_nombre: pdfStudent.studentName || pdfStudent.estudiante_nombre,
            estudiante_id: pdfStudent.studentId || pdfStudent.estudiante_id,
            estudiante_carrera: pdfStudent.studentCareer || pdfStudent.estudiante_carrera || "No especificada",
            estudiante_foto_url: pdfStudent.estudiante_foto_url,
          }}
          event={{
            titulo: currentEvent.titulo,
            fecha_inicio: currentEvent.fecha_inicio,
            duracion_horas: currentEvent.duracion_horas,
            categoria: currentEvent.categoria,
            tutor_nombre: currentEvent.tutor_nombre,
          }}
          user={{
            name: "Tutor",
            cargo: "Tutor",
            departamento: "Orientación y Asuntos Estudiantiles",
            codigo_firma: "ART.202606-18-S-CU",
            firma_url: undefined,
          }}
          signatureDataURL={signatureDataURL}
          yaFirmado={firmadasSet.has(pdfStudent.studentId || pdfStudent.estudiante_id)}
          stampKey={stampKey}
          showSignature={false}
          onCerrar={cerrarPdfModal}
          onAbrirFirma={() => setShowSignatureModal(true)}
          onDownloadPDF={() => handleDownloadPDF(pdfStudent)}
          onSealComplete={handleSealComplete}
        />
      )}

      {/* Signature Modal */}
      <SignatureModal
        open={showSignatureModal}
        onConfirm={handleConfirmSignature}
        onCancel={() => setShowSignatureModal(false)}
      />
    </div>
  );
}

function QrDisplay({ eventId, qrUrl }: { eventId: string; qrUrl?: string }) {
  const qrInfo = eventQrData[eventId];
  if (qrInfo?.type === "uploaded" && qrInfo.imageUrl) {
    return (
      <img
        src={qrInfo.imageUrl}
        alt="QR"
        className="w-full h-full object-contain"
        id={`qr-download-${eventId}`}
      />
    );
  }
  const value = qrUrl || `https://conectapumas.app/inscribirse/${eventId}`;
  return (
    <div id={`qr-download-${eventId}`} className="w-full h-full grid place-items-center">
      <QRCodeCanvas value={value} size={100} level="M" />
    </div>
  );
}

function ReemplazarQrButton({ eventId, disabled }: { eventId: string; disabled?: boolean }) {
  const [replacing, setReplacing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  if (disabled) {
    return (
      <Button variant="outline" size="sm" className="gap-1 opacity-50 cursor-not-allowed" disabled>
        <Upload className="size-3.5" /> Reemplazar QR
      </Button>
    );
  }
  if (!replacing) {
    return (
      <Button variant="outline" size="sm" className="gap-1" onClick={() => setReplacing(true)}>
        <Upload className="size-3.5" /> Reemplazar QR
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            eventQrData[eventId] = { type: "uploaded", imageUrl: URL.createObjectURL(f) };
            setReplacing(false);
            toast.success("QR reemplazado exitosamente");
          }
        }}
      />
      <Button
        size="sm"
        className="text-white gap-1"
        style={{ backgroundColor: "var(--puma-blue)" }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" /> Seleccionar imagen
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setReplacing(false)}>
        Cancelar
      </Button>
    </div>
  );
}

/* ──────── SCANNER MODAL ──────── */
function ScannerModal({
  open,
  onClose,
  enrollments,
  onStudentFound,
}: {
  open: boolean;
  onClose: () => void;
  enrollments: ReturnType<typeof getEnrollments>;
  onStudentFound: (enrollment: ReturnType<typeof getEnrollments>[number]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setCameraReady(false);
      setFound(null);
      return;
    }
    setCameraReady(false);
    setFound(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCameraReady(true);
      })
      .catch(() => setCameraReady(true));
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!cameraReady || found || !open) return;
    let active = true;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    let jsqrFn: any = null;
    const scan = async () => {
      if (!active || !videoRef.current || !ctx) return;
      if (!jsqrFn) {
        try {
          const mod = await import("jsqr");
          jsqrFn = mod.default || mod;
        } catch {
          /* jsQR not available, fall back to mock */
        }
      }
      if (jsqrFn && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, 320, 240);
        const imageData = ctx.getImageData(0, 0, 320, 240);
        const code = jsqrFn(imageData.data, imageData.width, imageData.height);
        if (code?.data && active) {
          const matched = enrollments.find(
            (e) =>
              code.data.includes(e.studentId) || code.data.includes(e.studentName.split(" ")[0]),
          );
          if (matched) {
            setFound(matched.studentName);
            onStudentFound(matched);
            return;
          }
        }
      }
      if (active) requestAnimationFrame(scan);
    };
    const fallback = setTimeout(() => {
      if (!active || found) return;
      const idx = Math.floor(Math.random() * enrollments.length);
      const enrollment = enrollments[idx];
      if (!enrollment) return;
      setFound(enrollment.studentName);
      onStudentFound(enrollment);
    }, 5000);
    scan();
    return () => {
      active = false;
      clearTimeout(fallback);
    };
  }, [cameraReady, found, enrollments, onStudentFound, open]);

  const captureFrame = () => {
    if (!videoRef.current) return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    setCapturedFrame(c.toDataURL("image/png"));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Camera className="size-4" /> Escanear QR del estudiante
          </h2>
          <button
            onClick={onClose}
            className="size-7 rounded-full grid place-items-center hover:bg-red-50 transition"
            style={{ color: "#ef4444" }}
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">
          <div className="rounded-xl overflow-hidden bg-black relative aspect-[4/3] flex items-center justify-center">
            {capturedFrame ? (
              <img
                src={capturedFrame}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            )}
            {!cameraReady && !capturedFrame && (
              <div className="relative z-10 text-center text-white p-6">
                <Camera className="size-12 mx-auto mb-3 opacity-60" />
                <p className="text-sm opacity-80">
                  Coloca el código QR del estudiante frente a la cámara
                </p>
              </div>
            )}
            <div className="absolute inset-0 border-[3px] border-white/30 rounded-xl z-10 m-8" />
          </div>
          <div className="mt-4 text-center">
            {found ? (
              <div className="text-sm font-medium" style={{ color: "#22c55e" }}>
                <CheckCircle2 className="size-5 inline mr-1.5" />
                QR escaneado: {found}
              </div>
            ) : capturedFrame ? (
              <div className="text-sm text-muted-foreground">
                Marco capturado — esperando detección...
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {cameraReady ? "Escaneando..." : "Iniciando cámara..."}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {!found && !capturedFrame && (
              <Button variant="outline" className="flex-1" onClick={captureFrame}>
                <Camera className="size-3.5 mr-1" /> Capturar frame
              </Button>
            )}
            {capturedFrame && !found && (
              <Button variant="outline" className="flex-1" onClick={() => setCapturedFrame(null)}>
                Reintentar
              </Button>
            )}
            <Button variant="outline" className={found ? "flex-1" : "flex-1"} onClick={onClose}>
              {found ? "Cerrar" : "Cancelar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
