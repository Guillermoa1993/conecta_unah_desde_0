import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  AlertTriangle,
  Trophy,
  X,
  Lock,
  MapPin,
  Pen,
} from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EVENTS,
  getAsistencias,
  getInscripciones,
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  LIMITE_POR_CATEGORIA,
  getStudentCategoryHours,
  addNotification,
  getEventInscripciones,
  type Asistencia,
} from "@/lib/mock-data";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { MarqueeText } from "@/components/app/MarqueeText";
import { RejectModal } from "@/components/app/RejectModal";
import { QRCodeCanvas } from "qrcode.react";
import {
  MESES,
  downloadConstanciaPdf,
  generateSealCanvasDataUrl,
  type ConstanciaData,
} from "@/lib/constancia-pdf";

const CERT_KEY_PREFIX = "cert_signed_";

function getDaysBetween(start: string, end: string): Date[] {
  const days: Date[] = [];
  const s = new Date(start);
  const e = new Date(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

const SHORT_MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

function isCertSigned(eventId: string, studentId: string): boolean {
  try {
    return JSON.parse(localStorage.getItem(`${CERT_KEY_PREFIX}${eventId}`) || "[]").includes(
      studentId,
    );
  } catch {
    return false;
  }
}

function signCert(eventId: string, studentId: string) {
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(`${CERT_KEY_PREFIX}${eventId}`) || "[]");
    if (!arr.includes(studentId)) arr.push(studentId);
    localStorage.setItem(`${CERT_KEY_PREFIX}${eventId}`, JSON.stringify(arr));
  } catch {
    localStorage.setItem(`${CERT_KEY_PREFIX}${eventId}`, JSON.stringify([studentId]));
  }
}

function getHoursForStudent(studentId: string, categoria: string): number {
  const fromActivities = getStudentCategoryHours(studentId, categoria as any);
  if (fromActivities > 0) return fromActivities;
  const lastDigit = parseInt(studentId.slice(-1), 10);
  if (lastDigit <= 2) return 0;
  if (lastDigit <= 5) return 8;
  if (lastDigit <= 7) return 13;
  return 18;
}

export const Route = createFileRoute("/_app/voae/events/$id/validacion")({
  loader: ({ params }) => {
    const eventoData = EVENTS.find((e) => e.id === params.id);
    if (!eventoData) throw notFound();
    return { event: eventoData };
  },
  notFoundComponent: () => <div className="p-8">Evento no encontrado</div>,
  component: ValidacionView,
});

function ValidacionView() {
  const { event: eventoData } = Route.useLoaderData() as { event: (typeof EVENTS)[number] };
  const navigate = useNavigate();
  const { user } = useRole();
  const categoria = eventoData.categoria as keyof typeof CATEGORY_LABEL;
  const color = CATEGORY_COLORS[eventoData.categoria] || "#64748b";

  const inscripcionCount = getEventInscripciones(eventoData.id) || 10;
  const [asistencias, setAsistencias] = useState<Asistencia[]>(() =>
    getAsistencias(eventoData.id, Math.max(inscripcionCount, 10)),
  );
  const [acreditados, setAcreditados] = useState<Set<string>>(new Set());
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Asistencia | null>(null);
  const [finishValidationOpen, setFinishValidationOpen] = useState(false);
  const [finishRejectOpen, setFinishRejectOpen] = useState(false);

  /* Verification modal state */
  const [verifyStudent, setVerifyStudent] = useState<Asistencia | null>(null);

  /* PDF modal state */
  const [selectedStudent, setSelectedStudent] = useState<Asistencia | null>(null);
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [firmadasSet, setFirmadasSet] = useState<Set<string>>(new Set());
  const [sealadasSet, setSealadasSet] = useState<Set<string>>(new Set());
  const [stampKey, setStampKey] = useState(0);

  /* Batch signature modal state */
  const [showBatchSignatureModal, setShowBatchSignatureModal] = useState(false);
  const [batchSignatureDataURL, setBatchSignatureDataURL] = useState<string | null>(null);

  /* Lista escrita modal state */
  const [listaEscritaModalOpen, setListaEscritaModalOpen] = useState(false);

  /* VOAE pre-registered signature */
  const [voaeSignatureDataURL, setVoaeSignatureDataURL] = useState<string | null>(null);
  const [showVoaeSignatureModal, setShowVoaeSignatureModal] = useState(false);

  const isDiarias = eventoData.tipo_duracion === "DIARIAS";
  const eventDays = isDiarias ? getDaysBetween(eventoData.fecha_inicio, eventoData.fecha_fin) : [];

  const [dayAttendance, setDayAttendance] = useState<Record<string, number[]>>(() => {
    const result: Record<string, number[]> = {};
    if (isDiarias) {
      asistencias.forEach((a) => {
        result[a.id] = Array.from({ length: eventDays.length }, (_, i) => {
          const lastDigit = parseInt(a.estudiante_id.slice(-1), 10);
          if (lastDigit <= 2) return i === 0 ? 1 : 0;
          if (lastDigit <= 7) return 1;
          return i % 2 === 0 ? 1 : 0;
        });
      });
    }
    return result;
  });

  const [dayApproval, setDayApproval] = useState<
    Record<string, ("PENDING" | "APPROVED" | "REJECTED")[]>
  >(() => {
    const result: Record<string, ("PENDING" | "APPROVED" | "REJECTED")[]> = {};
    if (isDiarias) {
      asistencias.forEach((a) => {
        result[a.id] = Array.from({ length: eventDays.length }, () => "PENDING");
      });
    }
    return result;
  });

  const [dayAuditTarget, setDayAuditTarget] = useState<{
    student: Asistencia;
    dayIndex: number;
  } | null>(null);

  const [globalDayAuditStudent, setGlobalDayAuditStudent] = useState<Asistencia | null>(null);

  const acreditadosCount = acreditados.size;
  const rechazadosCount = asistencias.filter((a) => a.estado_validacion === "RECHAZADO").length;
  const pendientesCount = asistencias.length - acreditadosCount - rechazadosCount;

  const initials = eventoData.tutor_nombre
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const getStudentInfo = (estudianteId: string) => {
    const current = getHoursForStudent(estudianteId, categoria);
    const hoursToAdd = isDiarias ? eventoData.duracion_horas * eventDays.length : eventoData.duracion_horas;
    const newTotal = current + hoursToAdd;
    const isComplete = current >= LIMITE_POR_CATEGORIA;
    const wouldExceed = !isComplete && newTotal > LIMITE_POR_CATEGORIA;
    const remaining = LIMITE_POR_CATEGORIA - current;
    const eligible = !isComplete && newTotal <= LIMITE_POR_CATEGORIA;
    return { current, isComplete, wouldExceed, remaining, eligible, newTotal };
  };

  const handleAcreditar = (id: string) => {
    try {
      const a = asistencias.find((x) => x.id === id);
      if (!a) return;
      const info = getStudentInfo(a.estudiante_id);
      if (!info.eligible) {
        toast.warning("Límite alcanzado", {
          description: "Este estudiante ya completó las horas en este ámbito.",
        });
        return;
      }
      if (!voaeSignatureDataURL) {
        toast.error("Firma no registrada", {
          description: "Debes registrar tu firma antes de acreditar asistencias.",
        });
        setShowVoaeSignatureModal(true);
        return;
      }
      setAcreditados((prev) => new Set(prev).add(id));
      toast.success(`Asistencia aprobada para ${a.estudiante_nombre}`);
    } catch (error) {
      console.error("Error al aprobar asistencia:", error);
      toast.error("Ocurrió un error al aprobar la asistencia. Intenta de nuevo.");
    }
  };

  const handleRechazar = (motivo: string) => {
    if (!rejectTarget) return;
    setAsistencias((prev) =>
      prev.map((a) =>
        a.id === rejectTarget.id
          ? { ...a, estado_validacion: "RECHAZADO" as const, motivo_rechazo: motivo }
          : a,
      ),
    );
    setRejectModalOpen(false);
    setRejectTarget(null);
    toast.success("El rechazo fue enviado al correo de " + rejectTarget.estudiante_nombre + ".", {
      duration: 4000,
    });
  };

  const handleFinishValidation = () => {
    setFinishValidationOpen(false);
    if (voaeSignatureDataURL) {
      handleFinalizeAndDownload(voaeSignatureDataURL);
    } else {
      setShowBatchSignatureModal(true);
    }
  };

  const handleBatchSignatureConfirm = (dataURL: string) => {
    setBatchSignatureDataURL(dataURL);
    setShowBatchSignatureModal(false);
    handleFinalizeAndDownload(dataURL);
  };

  const handleFinishReject = (motivo: string) => {
    toast.error("Validación rechazada", {
      description: `Motivo: ${motivo}`,
      style: { backgroundColor: "#ef4444", color: "white" },
    });
    setFinishRejectOpen(false);
    setFinishValidationOpen(false);
    navigate({ to: "/voae" });
  };

  const abrirModalPDF = (a: Asistencia) => {
    try {
      if (!a || !a.id) {
        toast.error("Datos del estudiante no disponibles");
        return;
      }
      if (!acreditados.has(a.id)) {
        toast.warning("Estudiante no acreditado", {
          description: "Debes aprobar al estudiante primero para generar su constancia.",
        });
        return;
      }
      if (!voaeSignatureDataURL) {
        toast.error("Firma no registrada", {
          description: "Debes registrar tu firma antes de generar constancias.",
        });
        setShowVoaeSignatureModal(true);
        return;
      }
      setSelectedStudent(a);
      setSignatureDataURL(voaeSignatureDataURL);
    } catch (error) {
      console.error("Error al abrir modal PDF:", error);
      toast.error("Ocurrió un error. Intenta de nuevo.");
    }
  };

  const cerrarModalPDF = () => {
    setSelectedStudent(null);
    setSignatureDataURL(null);
    setStampKey(0);
  };

  const handleConfirmSignature = (dataURL: string) => {
    try {
      if (!dataURL) {
        toast.error("No se pudo obtener la firma");
        return;
      }
      setSignatureDataURL(dataURL);
      setShowSignatureModal(false);
      setStampKey((v) => v + 1);
      if (!selectedStudent || !selectedStudent.estudiante_id) {
        toast.error("Estudiante no seleccionado");
        return;
      }
      signCert(eventoData.id, selectedStudent.estudiante_id);
      setFirmadasSet((prev) => new Set(prev).add(selectedStudent.estudiante_id));
      toast.success("Firma registrada", {
        description: "La constancia ha sido firmada electrónicamente.",
      });
    } catch (error) {
      console.error("Error al confirmar firma:", error);
      toast.error("Ocurrió un error al registrar la firma.");
    }
  };

  const handleSealComplete = (studentId: string) => {
    setSealadasSet((prev) => new Set(prev).add(studentId));
  };

  const yaFirmado = selectedStudent ? isCertSigned(eventoData.id, selectedStudent.estudiante_id) : false;

  const handleDownloadPDF = async (a: Asistencia, sealDataURL?: string, firmaDataURL?: string) => {
    try {
      if (!a || !a.estudiante_id) {
        toast.error("Datos del estudiante no disponibles");
        return;
      }
      const now = new Date();
      let sealUrl: string | undefined;
      try {
        sealUrl =
          sealDataURL ||
          generateSealCanvasDataUrl(
            user.name,
            user.cargo || "Vicerrector",
            user.departamento || "Orientación y Asuntos Estudiantiles",
            user.codigo_firma || "ART.202606-18-S-CU",
          );
      } catch (err) {
        console.error("Error generando sello:", err);
        sealUrl = undefined;
      }
      await downloadConstanciaPdf({
        estudiante_nombre: a.estudiante_nombre || "",
        estudiante_carrera: a.estudiante_carrera || "No especificada",
        estudiante_cuenta: a.estudiante_id,
        tutor_nombre: eventoData.tutor_nombre || "",
        evento_nombre: eventoData.titulo || "",
        evento_mes_anio: `${MESES[new Date(eventoData.fecha_inicio).getMonth()]} ${new Date(eventoData.fecha_inicio).getFullYear()}`,
        horas: eventoData.duracion_horas || 0,
        categoria: CATEGORY_LABEL[categoria] || eventoData.categoria || "",
        voae_nombre: user.name,
        voae_cargo: user.cargo || "Vicerrector",
        voae_departamento: user.departamento || "Orientación y Asuntos Estudiantiles",
        voae_codigo: user.codigo_firma || "ART.202606-18-S-CU",
        voae_firma_url: firmaDataURL || voaeSignatureDataURL || undefined,
        fecha_dia: now.getDate(),
        fecha_mes: MESES[now.getMonth()],
        fecha_anio: now.getFullYear(),
        sello_url: sealUrl,
        constancia_id: `const-${a.estudiante_id}-${eventoData.id}`,
      });
      toast.success("PDF generado", {
        description: `Constancia de ${a.estudiante_nombre} lista para descargar/guardar.`,
      });
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Ocurrió un error al generar el PDF. Intenta de nuevo.");
    }
  };

  const handleFinalizeAndDownload = async (batchSignature?: string) => {
    try {
      const signedIds: string[] = [];
      let sealUrl = "";
      try {
        sealUrl = generateSealCanvasDataUrl(
          user.name,
          user.cargo || "Vicerrector",
          user.departamento || "Orientación y Asuntos Estudiantiles",
          user.codigo_firma || "ART.202606-18-S-CU",
        );
      } catch (err) {
        console.error("Error generando sello:", err);
      }
      for (const a of asistencias) {
        if (
          acreditados.has(a.id) ||
          (isDiarias && (dayApproval[a.id] || []).some((s) => s === "APPROVED"))
        ) {
          signCert(eventoData.id, a.estudiante_id);
          signedIds.push(a.estudiante_id);
          addNotification({
            usuario_id: a.estudiante_id,
            titulo: `Constancia emitida — ${eventoData.titulo}`,
            mensaje: `Tu constancia de participación en "${eventoData.titulo}" ha sido validada y emitida por VOAE.`,
            tipo: "ASISTENCIA",
          });
          if (isDiarias) {
            const approvedDays = (dayApproval[a.id] || [])
              .map((s, idx) => (s === "APPROVED" ? idx : -1))
              .filter((idx) => idx >= 0);
            for (const dayIdx of approvedDays) {
              const d = eventDays[dayIdx];
              await downloadConstanciaPdf({
                estudiante_nombre: a.estudiante_nombre,
                estudiante_carrera: a.estudiante_carrera,
                estudiante_cuenta: a.estudiante_id,
                tutor_nombre: eventoData.tutor_nombre,
                evento_nombre: eventoData.titulo,
                evento_mes_anio: `${MESES[d.getMonth()]} ${d.getFullYear()}`,
                horas: eventoData.duracion_horas,
                categoria: CATEGORY_LABEL[categoria] || eventoData.categoria,
                voae_nombre: user.name,
                voae_cargo: user.cargo || "Vicerrector",
                voae_departamento: user.departamento || "Orientación y Asuntos Estudiantiles",
                voae_codigo: user.codigo_firma || "ART.202606-18-S-CU",
                voae_firma_url: batchSignature,
                fecha_dia: d.getDate(),
                fecha_mes: MESES[d.getMonth()],
                fecha_anio: d.getFullYear(),
                sello_url: sealUrl || undefined,
                constancia_id: `const-${a.estudiante_id}-${eventoData.id}-dia${dayIdx + 1}`,
                dia: dayIdx + 1,
                total_dias: eventDays.length,
              });
            }
          } else {
            await handleDownloadPDF(a, sealUrl || undefined, batchSignature);
          }
        }
      }
      toast.success("Validación completada", {
        description: `${signedIds.length} constancias emitidas correctamente.`,
        style: { backgroundColor: "#22c55e", color: "white" },
      });
      setFinishValidationOpen(false);
      navigate({ to: "/voae" });
    } catch (error) {
      console.error("Error al finalizar validación:", error);
      toast.error("Ocurrió un error al finalizar la validación. Intenta de nuevo.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <Link
        to="/voae"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>

      <div className="rounded-xl border bg-card shadow-soft p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="size-14 rounded-full grid place-items-center text-sm font-bold shrink-0"
              style={{ backgroundColor: color + "20", color }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{eventoData.titulo}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {CATEGORY_LABEL[eventoData.categoria]} · {eventoData.fecha_inicio.slice(0, 10)} ·{" "}
                {eventoData.lugar}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="size-6 rounded-full grid place-items-center text-[9px] font-semibold"
                  style={{ backgroundColor: "var(--puma-blue)", color: "white" }}
                >
                  {initials}
                </div>
                <span className="text-sm font-medium">{eventoData.tutor_nombre}</span>
                <span className="text-xs text-muted-foreground mx-1">·</span>
                <span className="text-xs text-muted-foreground">
                  {isDiarias
                    ? `${eventoData.duracion_horas}h/día × ${eventDays.length} días`
                    : `${eventoData.duracion_horas}h a acreditar`}
                </span>
                <span className="text-xs text-muted-foreground mx-1">·</span>
                <span className="text-xs font-medium" style={{ color }}>
                  {CATEGORY_LABEL_LONG[categoria]}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              className="gap-1.5 shrink-0"
              style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
            >
              <FileText className="size-4" /> Generar reporte de cumplimiento
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 shrink-0"
              style={{ borderColor: "#1e3a5f", color: "#1e3a5f" }}
              onClick={() => setListaEscritaModalOpen(true)}
              disabled={!eventoData.lista_escrita_url}
            >
              {eventoData.lista_escrita_url ? (
                <FileText className="size-4" />
              ) : (
                <FileText className="size-4 opacity-50" />
              )}
              Ver lista escrita
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm flex-wrap">
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#dcfce7", color: "#166534" }}
        >
          <CheckCircle2 className="size-3.5" /> {acreditadosCount} acreditados
        </span>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
        >
          <XCircle className="size-3.5" /> {rechazadosCount} rechazados
        </span>
        <span
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium"
          style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
        >
          <Clock className="size-3.5" /> {pendientesCount} pendientes
        </span>
        <div className="ml-auto">
          {voaeSignatureDataURL ? (
            <Button
              className="text-white gap-1.5"
              style={{ backgroundColor: "#22c55e" }}
              onClick={() => {
                toast.success("Firma ya registrada", {
                  description: "Tu firma se aplicará a todas las constancias que apruebes.",
                });
              }}
            >
              <CheckCircle2 className="size-4" /> Firma registrada
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-1.5"
              style={{ borderColor: "#1e3a5f", color: "#1e3a5f" }}
              onClick={() => setShowVoaeSignatureModal(true)}
            >
              <Pen className="size-4" /> Registrar mi firma
            </Button>
          )}
        </div>
      </div>

      <Button
        className="text-white gap-1.5"
        style={{ backgroundColor: "#22c55e" }}
        onClick={() => {
          const elegibles = asistencias.filter((a) => {
            if (a.estado_validacion === "RECHAZADO") return false;
            if (isDiarias) {
              const days = dayApproval[a.id];
              if (!days || days.some((d) => d !== "APPROVED")) return false;
            } else {
              const days = dayAttendance[a.id];
              if (!days || days.some((d) => d === 0)) return false;
            }
            return getStudentInfo(a.estudiante_id).eligible;
          });
          const ids = new Set(acreditados);
          elegibles.forEach((a) => ids.add(a.id));
          setAcreditados(ids);
          toast.success("Acreditación masiva", {
            description: `${elegibles.length} estudiantes acreditados.`,
          });
        }}
      >
        <CheckCircle2 className="size-4" /> Acreditar todos los que asistieron
      </Button>

      {isDiarias && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {eventDays.map((d, i) => {
            const attended = asistencias.filter(
              (a) => (dayAttendance[a.id]?.[i] ?? 0) === 1,
            ).length;
            const approved = asistencias.filter(
              (a) => dayApproval[a.id]?.[i] === "APPROVED",
            ).length;
            const rejected = asistencias.filter(
              (a) => dayApproval[a.id]?.[i] === "REJECTED",
            ).length;
            const absent = asistencias.filter((a) => (dayAttendance[a.id]?.[i] ?? 0) === 0).length;
            const pending = asistencias.filter(
              (a) => dayApproval[a.id]?.[i] === "PENDING" && (dayAttendance[a.id]?.[i] ?? 0) === 1,
            ).length;
            return (
              <div key={i} className="rounded-lg border bg-card p-3 text-center shadow-soft">
                <div className="text-xs text-muted-foreground">Día {i + 1}</div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: "#1e3a5f" }}
                >{`${d.getDate()} ${SHORT_MESES[d.getMonth()]}`}</div>
                <div className="mt-2 flex flex-col gap-0.5 text-[11px]">
                  <span style={{ color: "#166534" }}>✓ {approved} aprobados</span>
                  <span style={{ color: "#dc2626" }}>✗ {rejected} rechazados</span>
                  <span style={{ color: "#9ca3af" }}>— {absent} ausentes</span>
                  {pending > 0 && <span style={{ color: "#92400e" }}>○ {pending} pendientes</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className="rounded-xl border bg-card shadow-soft overflow-x-auto"
        style={{ maxWidth: "100%" }}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="px-2 py-1.5 text-[11px]">Estudiante</TableHead>
              <TableHead className="px-2 py-1.5 text-[11px]">Cuenta</TableHead>
              <TableHead className="px-2 py-1.5 text-[11px]">Carrera</TableHead>
              <TableHead className="px-2 py-1.5 text-[11px]">Inscripción</TableHead>
              <TableHead className="px-2 py-1.5 text-[11px]">Estado tutor</TableHead>
              <TableHead className="px-2 py-1.5 text-[11px]">
                {eventoData.tipo_evento === "HORAS_VOAE" ? "Certificado" : "Constancia"}
              </TableHead>
              {isDiarias &&
                eventDays.map((d, i) => (
                  <TableHead key={i} className="text-center px-1 py-1.5 text-[11px]">
                    <div className="text-[10px] font-bold">Día {i + 1}</div>
                    <div className="text-[9px] font-normal">{`${d.getDate()}/${d.getMonth() + 1}`}</div>
                  </TableHead>
                ))}
              <TableHead className="px-2 py-1.5 text-[11px]">Ubicación (E/S)</TableHead>
              {isDiarias && (
                <TableHead className="text-center px-2 py-1.5 text-[11px]">PDFs</TableHead>
              )}
              <TableHead className="px-2 py-1.5 text-[11px]">Acción VOAE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asistencias.map((a) => {
              const yaAcreditado = acreditados.has(a.id);
              const info = getStudentInfo(a.estudiante_id);
              const certSigned = isCertSigned(eventoData.id, a.estudiante_id);

              return (
                <TableRow key={a.id} className="hover:bg-secondary/30">
                  <TableCell className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-7 rounded-full grid place-items-center text-[10px] font-semibold shrink-0"
                        style={{ backgroundColor: color, color: "white" }}
                      >
                        {a.estudiante_nombre
                          .split(" ")
                          .map((p: string) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-xs leading-tight block truncate max-w-[120px]">
                          {a.estudiante_nombre}
                        </span>
                        <div className="text-[9px] text-muted-foreground leading-tight">
                          {CATEGORY_LABEL[eventoData.categoria]}: {info.current}h /{" "}
                          {LIMITE_POR_CATEGORIA}h
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-[10px] px-2 py-1.5">
                    {a.estudiante_id}
                  </TableCell>

                  <TableCell className="px-2 py-1.5 min-w-0 max-w-[100px]">
                    <MarqueeText text={a.estudiante_carrera} maxWidth={100} />
                  </TableCell>

                  <TableCell className="text-[11px] whitespace-nowrap px-2 py-1.5">
                    {a.escaneado_at?.slice(0, 10) || eventoData.fecha_inicio.slice(0, 10)}
                  </TableCell>

                  <TableCell className="px-2 py-1.5">
                    {info.isComplete && !yaAcreditado ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                      >
                        <Trophy className="size-2.5" style={{ color: "#FFD100" }} /> Ámbito completo
                      </span>
                    ) : (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                      >
                        Asistió
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="px-2 py-1.5">
                    <div className="flex gap-1">
                      {isDiarias ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[10px] h-7 px-2"
                          style={{ borderColor: "#7c3aed", color: "#7c3aed" }}
                          onClick={() => setGlobalDayAuditStudent(a)}
                        >
                          <Eye className="size-2.5" /> Días
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[10px] h-7 px-2"
                          style={{ borderColor: "#004B87", color: "#004B87" }}
                          onClick={() => setVerifyStudent(a)}
                        >
                          <Eye className="size-2.5" /> Auditar
                        </Button>
                      )}
                      {eventoData.tipo_evento === "HORAS_VOAE" ? (
                        <Button
                          size="sm"
                          className="gap-1 text-[10px] h-7 px-2"
                          style={{
                            backgroundColor: acreditados.has(a.id) ? "#1e3a5f" : "#9ca3af",
                            color: "white",
                            cursor: acreditados.has(a.id) ? "pointer" : "not-allowed",
                          }}
                          onClick={() => acreditados.has(a.id) && abrirModalPDF(a)}
                        >
                          <FileText className="size-2.5" /> Certificado
                        </Button>
                      ) : (
                        <span className="text-[10px] text-gray-400">No aplica</span>
                      )}
                    </div>
                  </TableCell>

                  {isDiarias &&
                    eventDays.map((d, i) => {
                      const attended = (dayAttendance[a.id]?.[i] ?? 0) === 1;
                      const estado = dayApproval[a.id]?.[i] || "PENDING";
                      const hasEntrada = a.hora_llegada ? true : false;
                      const hasSalida = a.hora_salida ? true : false;
                      const badge = !attended
                        ? { bg: "#f1f5f9", text: "#9ca3af", label: "Ausente" }
                        : !hasSalida
                          ? { bg: "#fef9c3", text: "#854d0e", label: "Parcial" }
                          : { bg: "#dcfce7", text: "#166534", label: "Asistió" };
                      return (
                        <TableCell key={i} className="text-center align-middle px-2 py-1">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="text-[9px] text-muted-foreground leading-tight">
                              {a.hora_llegada
                                ? new Date(a.hora_llegada).toLocaleTimeString("es-HN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}{" "}
                              /{" "}
                              {a.hora_salida
                                ? new Date(a.hora_salida).toLocaleTimeString("es-HN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </div>
                            <span
                              className="text-[9px] px-1 py-0.5 rounded-full font-medium whitespace-nowrap"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              {badge.label}
                            </span>
                            {estado === "PENDING" && attended && (
                              <div className="flex gap-0.5 mt-0.5">
                                <button
                                  onClick={() => {
                                    if (!voaeSignatureDataURL) {
                                      toast.error("Firma no registrada", {
                                        description:
                                          "Debes registrar tu firma antes de aprobar días.",
                                      });
                                      setShowVoaeSignatureModal(true);
                                      return;
                                    }
                                    setDayApproval((prev) => {
                                      const next = { ...prev };
                                      const arr = [...(next[a.id] || [])];
                                      arr[i] = "APPROVED";
                                      next[a.id] = arr;
                                      return next;
                                    });
                                    toast.success("Día aprobado");
                                  }}
                                  className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium"
                                  style={{ backgroundColor: "#22c55e" }}
                                >
                                  Aprobar
                                </button>
                                <button
                                  onClick={() => setDayAuditTarget({ student: a, dayIndex: i })}
                                  className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium"
                                  style={{ backgroundColor: "#ef4444" }}
                                >
                                  Rechazar
                                </button>
                              </div>
                            )}
                            {estado === "APPROVED" && (
                              <span className="text-[9px] font-medium" style={{ color: "#166534" }}>
                                ✓ Aprobado
                              </span>
                            )}
                            {estado === "REJECTED" && (
                              <span className="text-[9px] font-medium" style={{ color: "#dc2626" }}>
                                ✗ Rechazado
                              </span>
                            )}
                          </div>
                        </TableCell>
                      );
                    })}

                  <TableCell className="px-2 py-1.5">
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {a.hora_llegada ? "E " + a.hora_llegada.slice(11, 16) : "E -"}
                      {" | "}
                      {a.hora_salida ? "S " + a.hora_salida.slice(11, 16) : "S -"}
                    </span>
                  </TableCell>

                  {isDiarias && (
                    <TableCell className="text-center px-2 py-1.5">
                      <Button
                        size="sm"
                        className="h-7 text-[10px] text-white gap-1 px-2"
                        style={{
                          backgroundColor: (dayApproval[a.id] || []).some((s) => s === "APPROVED")
                            ? "#1e3a5f"
                            : "#9ca3af",
                        }}
                        disabled={!(dayApproval[a.id] || []).some((s) => s === "APPROVED")}
                        onClick={() => {
                          const approvedDays = (dayApproval[a.id] || [])
                            .map((s, idx) => (s === "APPROVED" ? idx : -1))
                            .filter((idx) => idx >= 0);
                          const totalHoras = approvedDays.length * eventoData.duracion_horas;
                          const dayLabels = approvedDays
                            .map(
                              (idx) =>
                                `Día ${idx + 1} (${eventDays[idx].getDate()}/${eventDays[idx].getMonth() + 1})`,
                            )
                            .join(", ");
                          toast.success(`PDFs generados para ${a.estudiante_nombre}`, {
                            description: `${approvedDays.length} día(s) aprobados: ${dayLabels}. Total: ${totalHoras}h.`,
                          });
                        }}
                      >
                        <FileText className="size-2.5" /> PDFs
                      </Button>
                    </TableCell>
                  )}

                  <TableCell className="px-2 py-1.5 whitespace-nowrap">
                    {yaAcreditado ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: "#f3f4f6", color: "#9ca3af" }}
                      >
                        Horas acreditadas
                      </span>
                    ) : a.estado_validacion === "RECHAZADO" ? (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                        style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                      >
                        Rechazado
                      </span>
                    ) : (
                      <div className="inline-flex gap-1">
                        {firmadasSet.has(a.estudiante_id) && sealadasSet.has(a.estudiante_id) ? (
                          info.eligible ? (
                            <Button
                              size="sm"
                              className="h-7 text-white gap-1 text-[10px] px-2"
                              style={{ backgroundColor: "#22c55e" }}
                              onClick={() => handleAcreditar(a.id)}
                            >
                              <CheckCircle2 className="size-2.5" /> Acreditar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="h-7 gap-1 text-[10px] px-2"
                              style={{
                                backgroundColor: "#9ca3af",
                                color: "white",
                                cursor: "not-allowed",
                              }}
                              disabled
                            >
                              Acreditar
                            </Button>
                          )
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    className="h-7 gap-1 text-[10px] px-2"
                                    style={{
                                      backgroundColor: "#d1d5db",
                                      color: "#6b7280",
                                      cursor: "not-allowed",
                                    }}
                                    disabled
                                  >
                                    <Lock className="size-2.5" /> Acreditar
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-[10px]">
                                  Debes firmar y sellar el certificado antes de acreditar
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-[10px] px-2"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                          onClick={() => {
                            setRejectTarget(a);
                            setRejectModalOpen(true);
                          }}
                        >
                          <XCircle className="size-2.5" /> Rechazar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end gap-3">
        {isDiarias && (
          <Button
            className="text-white gap-1.5"
            style={{ backgroundColor: "#7c3aed" }}
            onClick={() => setFinishValidationOpen(true)}
          >
            <CheckCircle2 className="size-4" /> Finalizar auditoría y generar constancias
          </Button>
        )}
        <Button
          className="text-white gap-1.5"
          style={{ backgroundColor: "#1e3a5f" }}
          onClick={() => setFinishValidationOpen(true)}
        >
          Finalizar validación
        </Button>
      </div>

      <AlertDialog open={finishValidationOpen} onOpenChange={setFinishValidationOpen}>
        <AlertDialogContent className="max-w-[520px] rounded-xl shadow-soft">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold" style={{ color: "#1e3a5f" }}>
              {isDiarias
                ? "Finalizar auditoría y generar constancias"
                : "Finalizar revisión de constancias"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {isDiarias ? (
                (() => {
                  const studentsWithApprovedDays = new Set<string>();
                  let totalPdfs = 0;
                  asistencias.forEach((a) => {
                    const days = dayApproval[a.id] || [];
                    const approvedCount = days.filter((s) => s === "APPROVED").length;
                    if (approvedCount > 0) {
                      studentsWithApprovedDays.add(a.estudiante_id);
                      totalPdfs += approvedCount;
                    }
                  });
                  const sinConstancias = asistencias.filter((a) => {
                    const days = dayApproval[a.id] || [];
                    return !days.some((s) => s === "APPROVED");
                  }).length;
                  return (
                    <div className="space-y-2">
                      <p>Se generarán las constancias correspondientes a los días aprobados.</p>
                      <div className="rounded-lg border p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span>Estudiantes con al menos 1 día aprobado:</span>
                          <span className="font-medium">{studentsWithApprovedDays.size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total de documentos PDF a generar:</span>
                          <span className="font-medium">{totalPdfs}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estudiantes sin constancia emitida:</span>
                          <span className="font-medium">{sinConstancias}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  ¿Deseas aprobar y emitir las constancias para los estudiantes acreditados?
                  {acreditadosCount > 0 && (
                    <span className="block mt-2 font-medium" style={{ color: "#166534" }}>
                      Se emitirán {acreditadosCount} constancia{acreditadosCount !== 1 ? "s" : ""}.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              className="gap-1.5"
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
              onClick={() => {
                setFinishValidationOpen(false);
                setFinishRejectOpen(true);
              }}
            >
              <XCircle className="size-4" /> Rechazar
            </Button>
            <AlertDialogAction
              style={{ backgroundColor: "#22c55e" }}
              onClick={handleFinishValidation}
            >
              <CheckCircle2 className="size-4 mr-1.5" />{" "}
              {isDiarias ? "Confirmar y generar" : "Aprobar y Emitir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectModal
        open={finishRejectOpen}
        estudianteNombre=""
        onConfirm={handleFinishReject}
        onCancel={() => setFinishRejectOpen(false)}
      />

      {/* Verification Modal */}
      <Dialog
        open={!!verifyStudent}
        onOpenChange={(v) => {
          if (!v) setVerifyStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          {verifyStudent && (
            <div className="flex flex-col items-center gap-4 py-2">
              {/* Photo */}
              <div
                className="size-[100px] rounded-full grid place-items-center text-lg font-bold shrink-0 border-2"
                style={{ borderColor: "#004B87", backgroundColor: color + "20", color }}
              >
                {verifyStudent.estudiante_nombre
                  .split(" ")
                  .map((p: string) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              {/* Name */}
              <div className="text-center">
                <p className="font-semibold text-base">{verifyStudent.estudiante_nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {verifyStudent.estudiante_id} · {verifyStudent.estudiante_carrera}
                </p>
              </div>
              {/* Times */}
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    Entrada:{" "}
                    <strong>
                      {verifyStudent.hora_llegada
                        ? new Date(verifyStudent.hora_llegada).toLocaleTimeString("es-HN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sin registro"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    Salida:{" "}
                    <strong>
                      {verifyStudent.hora_salida
                        ? new Date(verifyStudent.hora_salida).toLocaleTimeString("es-HN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Sin registro"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span
                    className={
                      verifyStudent.ubicacion_entrada_validada ? "text-green-600" : "text-amber-600"
                    }
                  >
                    {verifyStudent.ubicacion_entrada_validada
                      ? "✓ Ubicación verificada"
                      : "⚠ Ubicación no coincide"}
                  </span>
                </div>
              </div>
              {/* Buttons */}
              <div className="w-full space-y-2 pt-2">
                <Button
                  className="w-full text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={() => {
                    const studentRef = verifyStudent;
                    try {
                      handleAcreditar(studentRef.id);
                    } catch (error) {
                      console.error("Error al aprobar:", error);
                      toast.error("Ocurrió un error al aprobar. Intenta de nuevo.");
                      return;
                    }
                    setVerifyStudent(null);
                    if (voaeSignatureDataURL && studentRef) {
                      setTimeout(() => {
                        try {
                          setSelectedStudent(studentRef);
                          setSignatureDataURL(voaeSignatureDataURL);
                          setStampKey((v) => v + 1);
                        } catch (err) {
                          console.error("Error al abrir certificado:", err);
                          toast.error("Error al abrir el certificado. Intenta de nuevo.");
                        }
                      }, 150);
                    }
                  }}
                >
                  <CheckCircle2 className="size-4" /> Aprobar
                </Button>
                <Button
                  className="w-full gap-1.5"
                  variant="outline"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => {
                    setRejectTarget(verifyStudent);
                    setRejectModalOpen(true);
                    setVerifyStudent(null);
                  }}
                >
                  <XCircle className="size-4" /> Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Modal */}
      {selectedStudent && (
        <PdfModal
          estudiante={selectedStudent}
          eventoData={eventoData}
          user={user}
          signatureDataURL={signatureDataURL}
          yaFirmado={yaFirmado}
          stampKey={stampKey}
          onCerrar={cerrarModalPDF}
          onDownloadPDF={() => handleDownloadPDF(selectedStudent)}
          onSealComplete={(id) => handleSealComplete(id)}
        />
      )}

      {/* Signature sub-modal */}
      <SignatureModal
        open={showSignatureModal}
        onConfirm={handleConfirmSignature}
        onCancel={() => setShowSignatureModal(false)}
      />

      {/* Batch signature modal for finalize flow */}
      <SignatureModal
        open={showBatchSignatureModal}
        onConfirm={handleBatchSignatureConfirm}
        onCancel={() => {
          setShowBatchSignatureModal(false);
          setFinishValidationOpen(true);
        }}
      />

      {/* Global Day Audit Modal — day-by-day for one student */}
      <Dialog
        open={!!globalDayAuditStudent}
        onOpenChange={(v) => {
          if (!v) setGlobalDayAuditStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          {globalDayAuditStudent &&
            (() => {
              const s = globalDayAuditStudent;
              return (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-full grid place-items-center text-sm font-bold shrink-0 border-2"
                      style={{ borderColor: "#004B87", backgroundColor: color + "20", color }}
                    >
                      {s.estudiante_nombre
                        .split(" ")
                        .map((p: string) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{s.estudiante_nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.estudiante_id} · {s.estudiante_carrera}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {eventDays.map((d, i) => {
                      const attended = (dayAttendance[s.id]?.[i] ?? 0) === 1;
                      const estado = dayApproval[s.id]?.[i] || "PENDING";
                      const hasEntrada = !!s.hora_llegada;
                      const hasSalida = !!s.hora_salida;
                      const badge = !attended
                        ? { bg: "#f1f5f9", text: "#9ca3af", label: "Ausente" }
                        : !hasSalida
                          ? { bg: "#fef9c3", text: "#854d0e", label: "Parcial" }
                          : { bg: "#dcfce7", text: "#166534", label: "Asistió" };
                      return (
                        <div
                          key={i}
                          className="rounded-lg border p-3 space-y-2"
                          style={{
                            borderColor:
                              estado === "APPROVED"
                                ? "#22c55e"
                                : estado === "REJECTED"
                                  ? "#ef4444"
                                  : "#e5e7eb",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">
                              Día {i + 1} —{" "}
                              {d.toLocaleDateString("es-HN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <span
                              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                              style={{ backgroundColor: badge.bg, color: badge.text }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            <span>
                              Entrada:{" "}
                              {s.hora_llegada
                                ? new Date(s.hora_llegada).toLocaleTimeString("es-HN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                            <span>
                              Salida:{" "}
                              {s.hora_salida
                                ? new Date(s.hora_salida).toLocaleTimeString("es-HN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                          </div>
                          {estado === "PENDING" && attended && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 text-white gap-1 text-xs"
                                style={{ backgroundColor: "#22c55e" }}
                                onClick={() => {
                                  if (!voaeSignatureDataURL) {
                                    toast.error("Firma no registrada", {
                                      description:
                                        "Debes registrar tu firma antes de aprobar días.",
                                    });
                                    setShowVoaeSignatureModal(true);
                                    return;
                                  }
                                  setDayApproval((prev) => {
                                    const next = { ...prev };
                                    const arr = [...(next[s.id] || [])];
                                    arr[i] = "APPROVED";
                                    next[s.id] = arr;
                                    return next;
                                  });
                                  setDayAuditTarget(null);
                                  toast.success("Día aprobado");
                                }}
                              >
                                <CheckCircle2 className="size-3" /> Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 gap-1 text-xs"
                                style={{ borderColor: "#ef4444", color: "#ef4444" }}
                                onClick={() => {
                                  setDayApproval((prev) => {
                                    const next = { ...prev };
                                    const arr = [...(next[s.id] || [])];
                                    arr[i] = "REJECTED";
                                    next[s.id] = arr;
                                    return next;
                                  });
                                  toast.error(`Día ${i + 1} rechazado`);
                                }}
                              >
                                <XCircle className="size-3" /> Rechazar día
                              </Button>
                            </div>
                          )}
                          {estado === "APPROVED" && (
                            <div
                              className="text-xs font-medium text-center"
                              style={{ color: "#166534" }}
                            >
                              <CheckCircle2 className="size-3 inline mr-1" /> Día aprobado
                            </div>
                          )}
                          {estado === "REJECTED" && (
                            <div
                              className="text-xs font-medium text-center"
                              style={{ color: "#dc2626" }}
                            >
                              <XCircle className="size-3 inline mr-1" /> Día rechazado
                            </div>
                          )}
                          {!attended && (
                            <div className="text-xs text-center text-muted-foreground">
                              Estudiante ausente este día — no requiere acción
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full text-white gap-1.5"
                    style={{ backgroundColor: "#1e3a5f" }}
                    onClick={() => {
                      setGlobalDayAuditStudent(null);
                      toast.success("Decisiones guardadas");
                    }}
                  >
                    <CheckCircle2 className="size-4" /> Guardar decisiones
                  </Button>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Quick Day Audit Modal (single day) */}
      <Dialog
        open={!!dayAuditTarget}
        onOpenChange={(v) => {
          if (!v) setDayAuditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          {dayAuditTarget &&
            (() => {
              const { student: s, dayIndex: di } = dayAuditTarget;
              const d = eventDays[di];
              const attended = (dayAttendance[s.id]?.[di] ?? 0) === 1;
              const estado = dayApproval[s.id]?.[di] || "PENDING";
              const hasSalida = !!s.hora_salida;
              return (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div
                    className="size-[100px] rounded-full grid place-items-center text-lg font-bold shrink-0 border-2"
                    style={{ borderColor: "#004B87", backgroundColor: color + "20", color }}
                  >
                    {s.estudiante_nombre
                      .split(" ")
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-base">{s.estudiante_nombre}</p>
                    <p className="text-sm">
                      {s.estudiante_id} · {s.estudiante_carrera}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Día {di + 1} —{" "}
                      {d.toLocaleDateString("es-HN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="w-full space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Asistencia:</span>
                      {!attended ? (
                        <span className="text-red-500 font-semibold">✗ Ausente</span>
                      ) : !hasSalida ? (
                        <span className="text-amber-600 font-semibold">◐ Parcial</span>
                      ) : (
                        <span className="text-green-600 font-semibold">✓ Asistió</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Horario:</span>
                      <span className="font-medium">
                        {eventoData.hora_inicio || "08:00"} — {eventoData.hora_fin || "17:00"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Entrada:</span>
                      <span className="font-medium">
                        {s.hora_llegada
                          ? new Date(s.hora_llegada).toLocaleTimeString("es-HN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Salida:</span>
                      <span className="font-medium">
                        {s.hora_salida
                          ? new Date(s.hora_salida).toLocaleTimeString("es-HN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span
                        className={
                          s.ubicacion_entrada_validada ? "text-green-600" : "text-amber-600"
                        }
                      >
                        {s.ubicacion_entrada_validada ? "✓ Verificada" : "⚠ No coincide"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      {estado === "APPROVED" ? (
                        <span className="text-green-600 font-semibold">✓ Aprobado</span>
                      ) : estado === "REJECTED" ? (
                        <span className="text-red-500 font-semibold">✗ Rechazado</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">⏳ Pendiente</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full pt-2">
                    {estado === "PENDING" && attended && (
                      <>
                        <Button
                          className="flex-1 text-white gap-1 text-xs"
                          style={{ backgroundColor: "#22c55e" }}
                          onClick={() => {
                            if (!voaeSignatureDataURL) {
                              toast.error("Firma no registrada", {
                                description: "Debes registrar tu firma antes de aprobar días.",
                              });
                              setShowVoaeSignatureModal(true);
                              return;
                            }
                            setDayApproval((prev) => {
                              const next = { ...prev };
                              const arr = [...(next[s.id] || [])];
                              arr[di] = "APPROVED";
                              next[s.id] = arr;
                              return next;
                            });
                            setDayAuditTarget(null);
                            toast.success("Día aprobado");
                          }}
                        >
                          <CheckCircle2 className="size-3" /> Aprobar
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-1 text-xs"
                          style={{ borderColor: "#ef4444", color: "#ef4444" }}
                          onClick={() => {
                            setDayApproval((prev) => {
                              const next = { ...prev };
                              const arr = [...(next[s.id] || [])];
                              arr[di] = "REJECTED";
                              next[s.id] = arr;
                              return next;
                            });
                            setDayAuditTarget(null);
                            toast.error("Día rechazado");
                          }}
                        >
                          <XCircle className="size-3" /> Rechazar
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDayAuditTarget(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Reject sub-modal */}
      <RejectModal
        open={rejectModalOpen}
        estudianteNombre={rejectTarget?.estudiante_nombre || ""}
        onConfirm={(motivo) => {
          handleRechazar(motivo);
        }}
        onCancel={() => {
          setRejectModalOpen(false);
          setRejectTarget(null);
        }}
      />

      {/* VOAE Signature Modal */}
      <SignatureModal
        open={showVoaeSignatureModal}
        onCancel={() => setShowVoaeSignatureModal(false)}
        onConfirm={(dataURL) => {
          setVoaeSignatureDataURL(dataURL);
          setShowVoaeSignatureModal(false);
          toast.success("Firma registrada", {
            description:
              "Tu firma se aplicará a todas las constancias que apruebes en este evento.",
          });
        }}
      />

      {/* Lista escrita modal */}
      <Dialog open={listaEscritaModalOpen} onOpenChange={setListaEscritaModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Lista de asistencia escrita</DialogTitle>
            <DialogDescription>
              Lista de asistencia manual del evento "{eventoData.titulo}"
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/20 overflow-hidden flex items-center justify-center p-2">
            {eventoData.lista_escrita_url?.match(/\.pdf$/i) ? (
              <iframe
                src={eventoData.lista_escrita_url}
                className="w-full h-[400px] rounded"
                title="Lista escrita PDF"
              />
            ) : (
              <img
                src={eventoData.lista_escrita_url || ""}
                alt="Lista escrita"
                className="max-w-full max-h-[400px] object-contain rounded"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListaEscritaModalOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── PDF MODAL ─── */
function PdfModal({
  estudiante,
  eventoData,
  user,
  signatureDataURL,
  yaFirmado,
  stampKey,
  onCerrar,
  onDownloadPDF,
  onSealComplete,
}: {
  estudiante: Asistencia;
  eventoData: (typeof EVENTS)[number];
  user: {
    name: string;
    cargo?: string;
    departamento?: string;
    codigo_firma?: string;
    firma_url?: string;
  };
  signatureDataURL: string | null;
  yaFirmado: boolean;
  stampKey: number;
  onCerrar: () => void;
  onDownloadPDF: () => void;
  onSealComplete: (studentId: string) => void;
}) {
  if (!eventoData) return null;
  const categoria = eventoData.categoria as keyof typeof CATEGORY_LABEL;
  const now = new Date();

  const qrData = JSON.stringify({
    estudiante: estudiante.estudiante_nombre,
    cuenta: estudiante.estudiante_id,
    evento: eventoData.titulo,
    fecha: eventoData.fecha_inicio.slice(0, 10),
    horas: eventoData.duracion_horas,
    categoria: eventoData.categoria,
    voae_firmante: user.name,
    codigo_registro: user.codigo_firma || "ART.202606-18-S-CU",
    emitido: now.toISOString().slice(0, 10),
  });

  return (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v) onCerrar();
      }}
    >
      <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <AlertDialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <AlertDialogTitle className="text-xl font-semibold" style={{ color: "#1e3a5f" }}>
                {estudiante.estudiante_nombre}
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {eventoData.titulo} · {eventoData.fecha_inicio.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="size-8 rounded-full grid place-items-center hover:bg-secondary/50 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </AlertDialogHeader>

        {/* Document body */}
        <div
          className="bg-white rounded-lg border p-6 text-sm leading-relaxed"
          style={{ fontFamily: "serif" }}
        >
          {/* Institutional header */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <img src="/logo-unah.png" alt="UNAH" className="size-[90px] object-contain" />
              <img src="/logo-voae.png" alt="VOAE" className="size-[90px] object-contain" />
            </div>
            <div className="text-right text-[11px] text-muted-foreground leading-tight">
              <div>Tel: 22166100</div>
              <div>Ext. 100304</div>
              <div>voae@unah.edu.hn</div>
            </div>
          </div>

          <h2
            className="text-lg font-bold text-center mb-6 uppercase underline decoration-1 underline-offset-4"
            style={{ color: "#1e3a5f" }}
          >
            CONSTANCIA DE PARTICIPACIÓN
          </h2>

          <p className="mb-4 text-justify">
            La Vicerrectoría de Orientación y Asuntos Estudiantiles de la Universidad Nacional
            Autónoma de Honduras, <strong>HACE CONSTAR QUE</strong>:
          </p>

          <p className="mb-4 text-center font-bold" style={{ fontSize: "1.05rem" }}>
            {estudiante.estudiante_nombre.toUpperCase()}
          </p>

          <div className="mb-4 text-center">
            estudiante de la Carrera de{" "}
            <MarqueeText
              text={estudiante.estudiante_carrera.toUpperCase()}
              maxWidth={260}
              className="align-middle"
            />
            <br />
            con No. de Cta. <strong>{estudiante.estudiante_id}</strong>
          </div>

          <p className="mb-4 text-justify">
            ha participado durante su proceso formativo en el{" "}
            <strong>"{eventoData.titulo.toUpperCase()}"</strong>, como parte de las actividades
            establecidas en el Artículo 140 de las Normas Académicas de la UNAH; en dicho evento el
            (la) estudiante acumuló <strong>{eventoData.duracion_horas} HORAS</strong> cubriendo así el
            ámbito <strong>{CATEGORY_LABEL_LONG[categoria].toUpperCase()}</strong>.
          </p>

          <p className="mb-4 text-justify">
            La presente constancia se extiende conforme datos recibidos desde la unidad académica
            responsable del desarrollo de la actividad antes descrita y para fines de trámite de
            graduación.
          </p>

          <p className="mb-6 text-justify">
            Dado en Ciudad Universitaria José Trinidad Reyes a los {now.getDate()} días del mes de{" "}
            {MESES[now.getMonth()]} del año {now.getFullYear()}.
          </p>

          {/* 3-column footer */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t">
            {/* COL 1 — Signature */}
            <div className="text-center">
              <div className="relative" style={{ height: 100, overflow: "hidden" }}>
                {signatureDataURL && (
                  <img
                    src={signatureDataURL}
                    alt="Firma"
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 0,
                      width: "100%",
                      height: "auto",
                      opacity: 0.85,
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                )}
              </div>
              <div
                className="border-t border-gray-400 mt-1 mb-1"
                style={{ width: 200, marginLeft: "auto", marginRight: "auto" }}
              />
              <p className="text-[10px] font-bold mt-1">{user.name.toUpperCase()}</p>
              <p className="text-[9px] text-muted-foreground">{user.cargo || "Vicerrector"}</p>
              <p className="text-[9px] text-muted-foreground">
                {user.departamento || "Orientación y Asuntos Estudiantiles"}
              </p>
              <p className="text-[9px]" style={{ color: "#1e40af" }}>
                Cód. Reg. {user.codigo_firma || "ART.202606-18-S-CU"}
              </p>
            </div>

            {/* COL 2 — Animated Seal (sello-voae.jpg) */}
            <SealStamp
              stampKey={stampKey}
              signatureDataURL={signatureDataURL}
              studentId={estudiante.estudiante_id}
              onSealComplete={onSealComplete}
            />

            {/* COL 3 — QR */}
            <div className="flex flex-col items-center justify-center">
              <QRCodeCanvas value={qrData} size={80} />
              <p className="text-[9px] text-muted-foreground mt-1">Escanea para verificar</p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ backgroundColor: "#22c55e" }}
          >
            <CheckCircle2 className="size-4" /> Firma registrada
          </span>
          <Button
            className="gap-1.5"
            style={{ backgroundColor: "#1e3a5f", color: "white" }}
            onClick={onDownloadPDF}
          >
            <FileText className="size-4" /> Descargar PDF
          </Button>
          <Button variant="outline" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── SIGNATURE SUB-MODAL ─── */
function SignatureModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (dataURL: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!open) {
      setHasDrawn(false);
      return;
    }
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      }
    }, 50);
  }, [open]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    setHasDrawn(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
    setHasDrawn(false);
  };

  const confirmar = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Error al obtener el canvas de firma");
        return;
      }
      const dataURL = canvas.toDataURL("image/png");
      if (!dataURL || dataURL === "data:,") {
        toast.error("No se pudo generar la firma. Intenta de nuevo.");
        return;
      }
      onConfirm(dataURL);
    } catch (error) {
      console.error("Error al confirmar firma:", error);
      toast.error("Ocurrió un error al procesar la firma.");
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Firma digital</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-24 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
              {hasDrawn && (
                <Button
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onClick={confirmar}
                >
                  Confirmar firma
                </Button>
              )}
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── ANIMATED SEAL STAMP ─── */
function SealStamp({
  stampKey,
  signatureDataURL,
  studentId,
  onSealComplete,
}: {
  stampKey: number;
  signatureDataURL: string | null;
  studentId: string;
  onSealComplete: (studentId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"hidden" | "impact" | "settle">("hidden");

  useEffect(() => {
    if (!signatureDataURL || stampKey === 0) return;
    setPhase("hidden");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 130;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("No se pudo obtener el contexto 2D del canvas del sello");
      return;
    }
    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, SIZE, SIZE);
          ctx.save();
          const rotation = ((Math.random() * 4 - 2) * Math.PI) / 180;
          ctx.translate(SIZE / 2, SIZE / 2);
          ctx.rotate(rotation);
          ctx.translate(-SIZE / 2, -SIZE / 2);
          ctx.globalAlpha = 0.85;
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          ctx.restore();
          setPhase("impact");
        } catch (err) {
          console.error("Error dibujando sello:", err);
        }
      };
      img.onerror = () => {
        console.warn("No se pudo cargar la imagen del sello");
      };
      img.src = "/sello-voae.png";
    }, 50);
    return () => clearTimeout(timer);
  }, [stampKey, signatureDataURL]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      animate={
        phase === "impact"
          ? { scale: 1.0, opacity: 1.0 }
          : phase === "settle"
            ? { scale: 1.0, opacity: 0.85 }
            : { scale: 1.4, opacity: 0 }
      }
      transition={
        phase === "impact"
          ? { duration: 0.08, ease: "easeOut" }
          : { duration: 0.2, ease: "easeOut" }
      }
      onAnimationComplete={() => {
        if (phase === "impact") {
          setPhase("settle");
        } else if (phase === "settle") {
          onSealComplete(studentId);
        }
      }}
    >
      <canvas ref={canvasRef} width={130} height={130} className="size-[130px]" />
    </motion.div>
  );
}
