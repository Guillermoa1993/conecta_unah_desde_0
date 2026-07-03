import { useState, useRef, useEffect, Fragment, useCallback } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
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
  Eye,
  XCircle,
  Upload,
  Trash2,
  X,
  AlertTriangle,
  Camera,
  Lock,
  Mail,
  Megaphone,
  UserPlus,
  Plus,
  LogOut,
  Check,
  Info,
  FileText,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Share2,
  Pen,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatsCard } from "@/components/app/StatsCard";
import { VoaeDrawer } from "@/components/app/VoaeDrawer";
import { RatingDrawer } from "@/components/app/RatingDrawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { QRCodeCanvas } from "qrcode.react";
import {
  EVENTS,
  getEnrollments,
  ENCUESTAS,
  STATUS_LABEL,
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  CENTROS_REGIONALES,
  getEventInscripciones,
  getEventAsistencias,
  type UniEvent,
  type EventStatus,
  MODERADORES,
  NOVEDADES,
  type Moderador,
} from "@/lib/mock-data";
import {
  downloadConstanciaPdf,
  MESES,
  generateSealCanvasDataUrl,
  type ConstanciaData,
} from "@/lib/constancia-pdf";
import {
  eventAttendanceCodes,
  generateCode,
  eventQrData,
  eventQrTokens,
  eventRejectionReasons,
} from "@/lib/event-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { notifyVoaeNewEvent, notifyVoaeEventFinalized } from "@/lib/email-notifications";
import { useRole } from "@/lib/role-context";
import { EventTimeline } from "@/components/app/EventTimeline";
import { IdentityVerificationModal } from "@/components/app/IdentityVerificationModal";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LocationPicker } from "@/components/app/LocationPicker";
import { PdfModal, SignatureModal } from "@/components/app/ConstanciaModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function ReadOnlyMap({ lat, lng, className }: { lat: number; lng: number; className?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setLeaflet(() => L);
    })();
  }, []);

  useEffect(() => {
    if (!mapRef.current || !leaflet) return;
    const L = leaflet;
    const map = L.map(mapRef.current, {
      center: [lat, lng] as L.LatLngExpression,
      zoom: 15,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    L.marker([lat, lng] as L.LatLngExpression, { draggable: false }).addTo(map);
    return () => {
      map.remove();
    };
  }, [lat, lng, leaflet]);

  return (
    <div
      ref={mapRef}
      className={className || "w-full h-full min-h-[200px] rounded-xl border z-0"}
    />
  );
}

export const Route = createFileRoute("/_app/empleado/events/$id")({
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

interface BitacoraEntry {
  id: string;
  usuario_id: string;
  usuario_nombre: string;
  accion: string;
  created_at: string;
}

interface ModeradorEvent {
  id: string;
  usuario_id: string;
  nombre: string;
  email: string;
  permisos: string[];
  tipo_rol: "MODERADOR" | "COPROPIETARIO";
  activo: boolean;
  asignado_por: string;
}

const MOCK_USERS_BY_EMAIL: Record<string, { nombre: string; email: string }> = {
  "jperez@unah.edu.hn": { nombre: "Juan Pérez", email: "jperez@unah.edu.hn" },
  "mgonzalez@unah.edu.hn": { nombre: "María González", email: "mgonzalez@unah.edu.hn" },
  "asanchez@unah.edu.hn": { nombre: "Ana Sánchez", email: "asanchez@unah.edu.hn" },
  "lhernandez@unah.edu.hn": { nombre: "Luis Hernández", email: "lhernandez@unah.edu.hn" },
  "cflores@unah.edu.hn": { nombre: "Carmen Flores", email: "cflores@unah.edu.hn" },
  "jrodriguez@unah.edu.hn": { nombre: "José Rodríguez", email: "jrodriguez@unah.edu.hn" },
  "mlagos@unah.edu.hn": { nombre: "María Lagos", email: "mlagos@unah.edu.hn" },
  "rguzman@unah.hn": { nombre: "Lic. Roberto Guzmán", email: "rguzman@unah.hn" },
  "kflores@unah.hn": { nombre: "MSc. Karen Flores", email: "kflores@unah.hn" },
  "mpineda@unah.hn": { nombre: "Ing. Mario Pineda", email: "mpineda@unah.hn" },
};

const PLACEHOLDER_BG: Record<string, string> = {
  ACADEMICO: "#dbeafe",
  CULTURAL: "#ede9fe",
  DEPORTIVO: "#dcfce7",
  SOCIAL: "#fef9c3",
};
const PLACEHOLDER_INITIALS_BG: Record<string, string> = {
  ACADEMICO: "#bfdbfe",
  CULTURAL: "#ddd6fe",
  DEPORTIVO: "#bbf7d0",
  SOCIAL: "#fef08a",
};
const PLACEHOLDER_TEXT: Record<string, string> = {
  ACADEMICO: "#1e40af",
  CULTURAL: "#7c3aed",
  DEPORTIVO: "#166534",
  SOCIAL: "#854d0e",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace unos segundos";
  if (mins < 60) return `hace ${mins} minutos`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} horas`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} días`;
}

function EventDashboard() {
  const navigate = useNavigate();
  const { event: loadedEvent } = Route.useLoaderData() as { event: UniEvent };
  const [eventStatus, setEventStatus] = useState<string>(loadedEvent.estado);
  const currentEvent = { ...loadedEvent, estado: eventStatus as EventStatus };
  const [certificadosEstado, setCertificadosEstado] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`certificados_estado_${loadedEvent.id}`) || "LISTO_PARA_ENVIAR";
    }
    return "LISTO_PARA_ENVIAR";
  });
  const [finishConfirmOpen, setFinishConfirmOpen] = useState(false);
  const [voaeDrawerOpen, setVoaeDrawerOpen] = useState(false);
  const [ratingDrawerOpen, setRatingDrawerOpen] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [identityCheck, setIdentityCheck] = useState<{
    studentName: string;
    studentId: string;
    studentCareer: string;
    onConfirm: () => void;
  } | null>(null);

  const [finalizationQrUrl, setFinalizationQrUrl] = useState<string | null>(null);

  // QR modals
  const [entryQrModalOpen, setEntryQrModalOpen] = useState(false);
  const [exitQrModalOpen, setExitQrModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [descCarouselIndex, setDescCarouselIndex] = useState(0);

  const handleDeleteEvent = () => {
    const idx = EVENTS.findIndex((e) => e.id === currentEvent.id);
    if (idx !== -1) {
      EVENTS.splice(idx, 1);
      toast.success("Evento eliminado");
      navigate({ to: "/empleado/eventos" });
    }
    setDeleteConfirmOpen(false);
  };

  const handleSendToVoae = () => {
    const idx = EVENTS.findIndex((e) => e.id === currentEvent.id);
    if (idx !== -1) {
      EVENTS[idx] = {
        ...EVENTS[idx],
        estado: "PENDIENTE_APROBACION",
        updated_at: new Date().toISOString(),
      };
      setEventStatus("PENDIENTE_APROBACION");
      toast.success("Evento enviado a VOAE para revisión");
      notifyVoaeNewEvent(
        currentEvent.titulo,
        currentEvent.tutor_nombre,
        `${window.location.origin}/empleado/eventos/${currentEvent.id}`,
      );
    }
    setPublishConfirmOpen(false);
  };

  const handlePublishDirect = () => {
    const idx = EVENTS.findIndex((e) => e.id === currentEvent.id);
    if (idx !== -1) {
      EVENTS[idx] = {
        ...EVENTS[idx],
        estado: "PROGRAMADO",
        updated_at: new Date().toISOString(),
      };
      setEventStatus("PROGRAMADO");
      toast.success("Evento publicado en el feed");
    }
  };

  // Auditoría modal
  const [auditoriaStudent, setAuditoriaStudent] = useState<any>(null);
  const [auditoriaIndex, setAuditoriaIndex] = useState(0);

  // PDF modal state
  const [pdfStudent, setPdfStudent] = useState<any>(null);
  const [signatureDataURL, setSignatureDataURL] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [stampKey, setStampKey] = useState(0);
  const [firmadasSet, setFirmadasSet] = useState<Set<string>>(new Set());

  const certKeyPrefix = "cert_signed_";
  const isCertSigned = (eventId: string, studentId: string): boolean => {
    try {
      const stored = JSON.parse(localStorage.getItem(`${certKeyPrefix}${eventId}`) || "[]");
      return stored.includes(studentId);
    } catch {
      return false;
    }
  };
  const signCert = (eventId: string, studentId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem(`${certKeyPrefix}${eventId}`) || "[]");
      if (!stored.includes(studentId)) {
        stored.push(studentId);
        localStorage.setItem(`${certKeyPrefix}${eventId}`, JSON.stringify(stored));
      }
    } catch {
      localStorage.setItem(`${certKeyPrefix}${eventId}`, JSON.stringify([studentId]));
    }
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
    signCert(loadedEvent.id, pdfStudent.estudiante_id || pdfStudent.studentId);
    setFirmadasSet((prev) => new Set(prev).add(pdfStudent.estudiante_id || pdfStudent.studentId));
  };
  const handleSealComplete = (_studentId: string) => {};
  const handleDownloadPDF = async (s: any) => {
    const evDate = new Date(loadedEvent.fecha_inicio);
    const today = new Date();
    const sealUrl = signatureDataURL
      ? generateSealCanvasDataUrl(
          currentUser?.name || "Lic. Roberto Fiallos",
          currentUser?.cargo || "Vicerrector",
          currentUser?.departamento || "Orientación y Asuntos Estudiantiles",
          currentUser?.codigo_firma || "ART.202606-18-S-CU",
        )
      : undefined;
    await downloadConstanciaPdf({
      estudiante_nombre: s.studentName || s.estudiante_nombre,
      estudiante_carrera: s.studentCareer || s.estudiante_carrera || "No especificada",
      estudiante_cuenta: s.studentId || s.estudiante_id,
      tutor_nombre: loadedEvent.tutor_nombre,
      evento_nombre: loadedEvent.titulo,
      evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
      horas: loadedEvent.duracion_horas,
      categoria: CATEGORY_LABEL[loadedEvent.categoria],
      voae_nombre: currentUser?.name || "Lic. Roberto Fiallos",
      voae_cargo: currentUser?.cargo || "Vicerrector",
      voae_departamento: currentUser?.departamento || "Orientación y Asuntos Estudiantiles",
      voae_codigo: currentUser?.codigo_firma || "ART.202606-18-S-CU",
      fecha_dia: today.getDate(),
      fecha_mes: MESES[today.getMonth()],
      fecha_anio: today.getFullYear(),
      sello_url: sealUrl,
      constancia_id: `const-${s.studentId || s.estudiante_id}-${loadedEvent.id}`,
    });
  };

  // Feed modal
  const [feedModalOpen, setFeedModalOpen] = useState(false);
  const [feedMessage, setFeedMessage] = useState("");

  // Moderator modal
  const portadaInputRef = useRef<HTMLInputElement>(null);
  const [modModalOpen, setModModalOpen] = useState(false);
  const [modEmail, setModEmail] = useState("");
  const [modSearchedUser, setModSearchedUser] = useState<
    { nombre: string; email: string; foto?: string } | null | "NOT_FOUND"
  >(null);
  const [modTipoRol, setModTipoRol] = useState<"MODERADOR" | "COPROPIETARIO">("MODERADOR");

  // Bitacora
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(() => [
    {
      id: "bit-001",
      usuario_id: loadedEvent.tutor_id,
      usuario_nombre: loadedEvent.tutor_nombre,
      accion: "Creó el evento",
      created_at: loadedEvent.created_at,
    },
  ]);

  // Moderadores local state (per-event mock)
  const [moderadores, setModeradores] = useState<ModeradorEvent[]>(() => {
    const allMods: ModeradorEvent[] = MODERADORES.slice(0, 2).map((m) => ({
      ...m,
      tipo_rol: "MODERADOR",
    }));
    allMods.push({
      id: "mod-evt-coprop",
      usuario_id: "TUT-0099",
      nombre: "Lic. Fernanda Rivas",
      email: "fernanda.rivas@unah.hn",
      permisos: [],
      tipo_rol: "COPROPIETARIO",
      activo: true,
      asignado_por: loadedEvent.tutor_nombre,
    });
    return allMods;
  });

  const user = { id: loadedEvent.tutor_id, nombre: loadedEvent.tutor_nombre };
  const { user: currentUser } = useRole();
  const isCreator = true;

  const addBitacoraEntry = (accion: string) => {
    const entry: BitacoraEntry = {
      id: `bit-${Date.now()}`,
      usuario_id: user.id,
      usuario_nombre: user.nombre,
      accion,
      created_at: new Date().toISOString(),
    };
    setBitacora((prev) => [entry, ...prev]);
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

  const eventEncuestas = ENCUESTAS.filter((enc) => enc.asistencia_id.startsWith(currentEvent.id));
  const avgRating =
    eventEncuestas.length > 0
      ? eventEncuestas.reduce((s, c) => s + c.calificacion_evento, 0) / eventEncuestas.length
      : 0;
  const commentsList = eventEncuestas
    .filter((enc) => enc.comentario.trim().length > 0)
    .sort((a, b) => new Date(b.enviado_at).getTime() - new Date(a.enviado_at).getTime());
  const findStudent = (asistenciaId: string) => enrollments.find((e) => e.id === asistenciaId);

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

  // ─── 3-STAGE FLOW ───
  const handleStartEvent = () => {
    setEventStatus("EN_CURSO");
    addBitacoraEntry("Inició el evento");
    toast.success("Evento iniciado", {
      style: { backgroundColor: "#22c55e", color: "white" },
    });
  };

  const handleStartExit = () => {
    setEventStatus("EN_CURSO_SALIDA");
    addBitacoraEntry("Inició la etapa de salida del evento");
    const qrId = crypto.randomUUID();
    setFinalizationQrUrl(`https://conectapumas.app/finalizar/${currentEvent.id}/${qrId}`);
    toast.success("Salida habilitada", {
      style: { backgroundColor: "#004B87", color: "white" },
    });
  };

  const handleFinishEvent = () => {
    setFinishConfirmOpen(false);
    const isConHoras = currentEvent.tipo_evento === "HORAS_VOAE";
    setEventStatus(isConHoras ? "FINALIZADO" : "CERRADO");
    if (isConHoras) setVoaeDrawerOpen(true);
    addBitacoraEntry("Finalizó el evento");
    if (isConHoras) {
      notifyVoaeEventFinalized(
        currentEvent.titulo,
        `${window.location.origin}/empleado/eventos/${currentEvent.id}`,
      );
    }
  };

  const handleSendToFeed = () => {
    if (!feedMessage.trim()) return;
    const nov = {
      id: `nov-${Date.now()}`,
      autor_id: user.id,
      autor_nombre: user.nombre,
      autor_rol: "Tutor",
      titulo: loadedEvent.titulo,
      contenido: feedMessage.trim(),
      tipo: "MANUAL" as const,
      created_at: new Date().toISOString(),
      evento_id: loadedEvent.id,
    };
    NOVEDADES.unshift(nov);
    setFeedMessage("");
    setFeedModalOpen(false);
    toast.success("Publicación creada en el feed");
  };

  const addModerador = () => {
    if (!modSearchedUser || modSearchedUser === "NOT_FOUND") return;
    const newMod: ModeradorEvent = {
      id: `mod-${Date.now()}`,
      usuario_id: `USR-${Date.now()}`,
      nombre: modSearchedUser.nombre,
      email: modSearchedUser.email,
      permisos: modTipoRol === "MODERADOR" ? ["ASISTENCIA", "FEED"] : [],
      tipo_rol: modTipoRol,
      activo: true,
      asignado_por: user.nombre,
    };
    setModeradores((prev) => [...prev, newMod]);
    setModEmail("");
    setModSearchedUser(null);
    setModTipoRol("MODERADOR");
    setModModalOpen(false);
    toast.success("Moderador agregado");
  };

  const removeModerador = (id: string) => {
    setModeradores((prev) => prev.filter((m) => m.id !== id));
    toast.success("Moderador eliminado");
  };

  // Real-time attendance summary polling
  const [liveCounts, setLiveCounts] = useState({
    total: enrolled,
    conEntrada: enrollments.filter((e) => e.hora_llegada).length,
    conSalida: enrollments.filter((e) => e.hora_salida).length,
    sinMarcar: enrolled - enrollments.filter((e) => e.hora_llegada).length,
  });
  const prevConEntrada = useRef(liveCounts.conEntrada);
  const prevConSalida = useRef(liveCounts.conSalida);
  const [pulseEntrada, setPulseEntrada] = useState(false);
  const [pulseSalida, setPulseSalida] = useState(false);
  const [scaleEntrada, setScaleEntrada] = useState(false);
  const [scaleSalida, setScaleSalida] = useState(false);

  useEffect(() => {
    if (eventStatus !== "EN_CURSO" && eventStatus !== "EN_CURSO_SALIDA") return;
    const interval = setInterval(() => {
      const total = enrolled;
      const withEntry = Math.min(total, Math.floor(Math.random() * total) + 1);
      const withExit = Math.min(withEntry, Math.floor(Math.random() * withEntry));
      setLiveCounts((prev) => {
        const next = { total, conEntrada: withEntry, conSalida: withExit, sinMarcar: total - withEntry };
        if (next.conEntrada > prevConEntrada.current) {
          prevConEntrada.current = next.conEntrada;
          setPulseEntrada(true);
          setScaleEntrada(true);
          setTimeout(() => { setPulseEntrada(false); setScaleEntrada(false); }, 1500);
        }
        if (next.conSalida > prevConSalida.current) {
          prevConSalida.current = next.conSalida;
          setPulseSalida(true);
          setScaleSalida(true);
          setTimeout(() => { setPulseSalida(false); setScaleSalida(false); }, 1500);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [eventStatus, enrolled]);

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

  const downloadReport = () => {
    downloadPdf();
    toast.success("Reporte descargado");
  };

  const isLiveStatus = eventStatus === "EN_CURSO" || eventStatus === "EN_CURSO_SALIDA";

  const statusBadgeClass = cn(
    "text-xs px-3 py-1.5 rounded-full font-medium border shrink-0",
    eventStatus === "FINALIZADO"
      ? "bg-muted text-muted-foreground border-border"
      : eventStatus === "PROGRAMADO"
        ? "bg-primary/10 text-primary border-primary/20"
        : eventStatus === "EN_CURSO"
          ? "bg-blue-50 text-blue-800 border-blue-200"
          : eventStatus === "EN_CURSO_SALIDA"
            ? "bg-orange-50 text-orange-800 border-orange-200"
            : "bg-muted text-muted-foreground border-border",
  );

  const isEntryActive = eventStatus === "EN_CURSO";
  const isExitActive = eventStatus === "EN_CURSO_SALIDA";
  const isFinalized = eventStatus === "FINALIZADO" || eventStatus === "CERRADO";

  const entryQrText = isFinalized
    ? "Evento finalizado"
    : eventStatus === "BORRADOR"
      ? "Se habilita cuando inicie el evento"
      : eventStatus === "PROGRAMADO"
        ? "Evento no iniciado"
        : eventStatus === "EN_CURSO_SALIDA"
          ? "Registro de entrada cerrado"
          : eventStatus === "EN_CURSO"
            ? "QR de entrada activo"
            : "";

  const exitQrText = isFinalized
    ? "Evento finalizado"
    : eventStatus === "BORRADOR" || eventStatus === "PROGRAMADO" || eventStatus === "EN_CURSO"
      ? "Se habilita al iniciar salida"
      : eventStatus === "EN_CURSO_SALIDA"
        ? "QR de salida activo"
        : "";

  if (editMode) {
    return (
      <EditEventForm
        event={event}
        onClose={() => setEditMode(false)}
        onSaved={() => {
          setEditMode(false);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Link
        to="/empleado/eventos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver
      </Link>

      {/* Header with actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
            {currentEvent.titulo}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 md:justify-end">
          <span className={statusBadgeClass}>
            {STATUS_LABEL[eventStatus as EventStatus] || "En curso - Salida"}
          </span>
          {/* BORRADOR */}
          {eventStatus === "BORRADOR" && (
            <>
              <Button
                className="text-white gap-1.5"
                style={{ backgroundColor: "var(--puma-blue)" }}
                onClick={() => setEditMode(true)}
              >
                <Upload className="size-4" /> Editar
              </Button>
              {currentEvent.tipo_evento === "HORAS_VOAE" ? (
                <Button
                  className="text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={() => setPublishConfirmOpen(true)}
                >
                  <Send className="size-4" /> Enviar a VOAE
                </Button>
              ) : (
                <Button
                  className="text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={handlePublishDirect}
                >
                  <Megaphone className="size-4" /> Aceptar y publicar en feed
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-1.5 text-red-500 border-red-300 hover:bg-red-50"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="size-4" /> Descartar
              </Button>
            </>
          )}

          {/* PENDIENTE_APROBACION */}
          {eventStatus === "PENDIENTE_APROBACION" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    disabled
                    className="text-white gap-1.5 opacity-50 cursor-not-allowed"
                    style={{ backgroundColor: "var(--puma-blue)" }}
                  >
                    <Send className="size-4" /> Esperando aprobación
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Este evento aún no ha sido aprobado por VOAE. Espera la aprobación para continuar.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* RECHAZADO */}
          {eventStatus === "RECHAZADO" && (
            <>
              <Button
                className="text-white gap-1.5"
                style={{ backgroundColor: "var(--puma-blue)" }}
                onClick={() => setEditMode(true)}
              >
                <Upload className="size-4" /> Editar y reenviar a VOAE
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 text-red-500 border-red-300 hover:bg-red-50"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
            </>
          )}

          {/* ACTIVO */}
          {eventStatus === "PROGRAMADO" && (
            <>
              <Button
                className="text-white gap-1.5"
                style={{ backgroundColor: "#22c55e" }}
                onClick={handleStartEvent}
              >
                <Play className="size-4" /> Iniciar evento
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "var(--puma-blue)", color: "var(--puma-blue)" }}
              >
                <ShareIcon /> Compartir
              </Button>
            </>
          )}

          {/* EN_CURSO */}
          {eventStatus === "EN_CURSO" && (
            <>
              <Button
                className="text-white gap-1.5"
                style={{ backgroundColor: "#004B87" }}
                onClick={handleStartExit}
              >
                <LogOut className="size-4" /> Iniciar salida
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#004B87", color: "#004B87" }}
                onClick={() => setFeedModalOpen(true)}
              >
                <Megaphone className="size-4" /> Publicar en feed
              </Button>
            </>
          )}

          {/* EN_CURSO_SALIDA */}
          {eventStatus === "EN_CURSO_SALIDA" && (
            <>
              <Button
                className="text-white gap-1.5"
                style={{ backgroundColor: "#ef4444" }}
                onClick={() => setFinishConfirmOpen(true)}
              >
                <Square className="size-4" /> Finalizar evento
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#004B87", color: "#004B87" }}
                onClick={() => setFeedModalOpen(true)}
              >
                <Megaphone className="size-4" /> Publicar en feed
              </Button>
            </>
          )}

          {/* FINALIZADO (eventos con horas) */}
          {eventStatus === "FINALIZADO" && (
            <>
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
              <Button variant="outline" className="gap-1.5" onClick={downloadReport}>
                <Download className="size-4" /> Descargar reportes
              </Button>
            </>
          )}

          {/* CERRADO (eventos de recreación) */}
          {eventStatus === "CERRADO" && (
            <>
              <Button variant="outline" className="gap-1.5" onClick={downloadReport}>
                <Download className="size-4" /> Descargar reportes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Borrador banner */}
      {eventStatus === "BORRADOR" && (
        <div
          className="rounded-xl p-4 text-sm flex items-start gap-3"
          style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
        >
          <Info className="size-5 shrink-0 mt-0.5" style={{ color: "#64748b" }} />
          <span>Este evento está en borrador. Puedes editarlo antes de publicarlo.</span>
        </div>
      )}

      {/* Rejection reason */}
      {eventStatus === "RECHAZADO" && (
        <div
          className="rounded-xl p-5 flex items-start gap-4"
          style={{ backgroundColor: "#fef3c7", borderLeft: "4px solid #f59e0b", color: "#92400e" }}
        >
          <AlertTriangle className="size-5 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div className="flex-1">
            <p className="font-semibold">Este evento fue rechazado por VOAE.</p>
            <p className="mt-1.5 text-sm" style={{ color: "#92400e" }}>
              <span className="font-medium">Motivo:</span>{" "}
              {currentEvent.motivo_rechazo ||
                eventRejectionReasons[currentEvent.id] ||
                "No se especificó motivo."}
            </p>
          </div>
        </div>
      )}

      {/* Portada + Mapa */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4">
        {/* Left column — portada (55%) */}
        <div className="md:col-span-6 rounded-xl overflow-hidden border bg-card shadow-soft relative group">
          {eventStatus === "BORRADOR" && (
            <>
              <input
                ref={portadaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                    toast.error("Formato no v\u00e1lido", { description: "Usa JPG, PNG o WEBP" });
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Archivo muy grande", { description: "M\u00e1ximo 5MB" });
                    return;
                  }
                  const url = URL.createObjectURL(file);
    const idx = EVENTS.findIndex((ev) => ev.id === e.id);
                  if (idx !== -1) EVENTS[idx] = { ...EVENTS[idx], portada_url: url };
                  toast.success("Imagen de portada actualizada");
                  window.location.reload();
                }}
              />
              <button
                type="button"
                onClick={() => portadaInputRef.current?.click()}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer"
                aria-label="Cambiar imagen de portada"
              >
                <div className="size-10 rounded-full bg-white/90 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Camera className="size-5" style={{ color: "var(--puma-dark, #1e3a5f)" }} />
                </div>
              </button>
              <p className="absolute bottom-2 left-2 z-10 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded">
                Toca para cambiar la portada
              </p>
            </>
          )}
          {currentEvent.portada_url ? (
            <img src={currentEvent.portada_url} alt="" className="w-full h-52 object-cover" />
          ) : (
            <div
              className="w-full h-52 grid place-items-center"
              style={{ backgroundColor: PLACEHOLDER_BG[currentEvent.categoria] || "#f1f5f9" }}
            >
              <div
                className="size-20 rounded-full grid place-items-center"
                style={{
                  backgroundColor: PLACEHOLDER_INITIALS_BG[currentEvent.categoria] || "#e2e8f0",
                }}
              >
                <div
                  className="text-3xl font-bold"
                  style={{ color: PLACEHOLDER_TEXT[currentEvent.categoria] || "#64748b" }}
                >
                  {CATEGORY_LABEL[currentEvent.categoria]?.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Right column — map or virtual link (45%) */}
        <div className="md:col-span-5">
          {currentEvent.tipo_actividad === "Virtual" ? (
            <div
              className="rounded-xl border bg-card shadow-soft p-5 flex flex-col items-center justify-center gap-3 h-full min-h-[200px]"
              style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
            >
              <Camera className="size-8" style={{ color: "#3b82f6" }} />
              <p className="text-sm font-medium text-center">Enlace virtual</p>
              {currentEvent.enlace_virtual ? (
                <a
                  href={currentEvent.enlace_virtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline break-all text-center"
                  style={{ color: "#1d4ed8" }}
                >
                  {currentEvent.enlace_virtual}
                </a>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  No se ha configurado un enlace virtual.
                </p>
              )}
            </div>
          ) : currentEvent.tipo_actividad === "Híbrido" && currentEvent.enlace_virtual ? (
            <div className="space-y-3">
              <div
                className="rounded-xl border p-4 flex items-center gap-3"
                style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }}
              >
                <Camera className="size-5 shrink-0" style={{ color: "#3b82f6" }} />
                <a
                  href={currentEvent.enlace_virtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                  style={{ color: "#1d4ed8" }}
                >
                  {currentEvent.enlace_virtual}
                </a>
              </div>
              {currentEvent.latitud != null && currentEvent.longitud != null ? (
                <ReadOnlyMap
                  lat={currentEvent.latitud}
                  lng={currentEvent.longitud}
                  className="w-full h-40 rounded-xl border z-0"
                />
              ) : (
                <div className="rounded-xl border bg-muted h-40 grid place-items-center text-sm text-muted-foreground">
                  <div className="text-center">
                    <MapPin className="size-8 mx-auto mb-1 opacity-40" />
                    <span>Ubicación no disponible</span>
                  </div>
                </div>
              )}
            </div>
          ) : currentEvent.latitud != null && currentEvent.longitud != null ? (
            <ReadOnlyMap
              lat={currentEvent.latitud}
              lng={currentEvent.longitud}
              className="w-full h-52 rounded-xl border z-0"
            />
          ) : (
            <div className="rounded-xl border bg-muted h-52 grid place-items-center text-sm text-muted-foreground">
              <div className="text-center">
                <MapPin className="size-10 mx-auto mb-2 opacity-40" />
                <span>Ubicación no disponible</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description + additional images carousel */}
      {(currentEvent.descripcion || currentEvent.imagenes_adicionales?.length) && (
        <div className="rounded-xl border bg-card shadow-soft p-5 space-y-3">
          {currentEvent.descripcion && (
            <p className="text-sm text-muted-foreground leading-relaxed">{currentEvent.descripcion}</p>
          )}
          {currentEvent.imagenes_adicionales && currentEvent.imagenes_adicionales.length > 0 && (
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={currentEvent.imagenes_adicionales[descCarouselIndex]}
                alt=""
                className="w-full h-48 object-cover"
              />
              {currentEvent.imagenes_adicionales.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setDescCarouselIndex(
                        (i) =>
                          (i - 1 + currentEvent.imagenes_adicionales!.length) %
                          currentEvent.imagenes_adicionales!.length,
                      )
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-white/80 hover:bg-white shadow-md grid place-items-center transition"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="size-4 text-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDescCarouselIndex((i) => (i + 1) % currentEvent.imagenes_adicionales!.length)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 size-8 rounded-full bg-white/80 hover:bg-white shadow-md grid place-items-center transition"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="size-4 text-foreground" />
                  </button>
                  <div className="absolute bottom-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {descCarouselIndex + 1} / {currentEvent.imagenes_adicionales.length}
                  </div>
                </>
              )}
            </div>
          )}
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
      <EventTimeline status={eventStatus as EventStatus} createdAt={currentEvent.created_at} />

      {/* QR */}
      <div className="rounded-xl border bg-card shadow-soft p-5">
        <div className="grid md:grid-cols-2 gap-6">
          {/* QR de Inscripción */}
          <div>
            <div className="font-semibold text-sm mb-3 flex items-center gap-2">
              <QrCode className="size-4 text-primary" /> QR de Inscripción
            </div>
            <div className="flex items-center gap-4">
              <div
                className="relative size-[130px] shrink-0 rounded-xl border-2 overflow-hidden"
                style={{ backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }}
                onClick={() => isEntryActive && setEntryQrModalOpen(true)}
              >
                {isEntryActive ? (
                  <div className="size-full grid place-items-center p-2">
                    <QrDisplay eventId={currentEvent.id} qrUrl={eventQrTokens[currentEvent.id]?.qrUrl} />
                  </div>
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Lock className="size-8" style={{ color: "#374151" }} />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!isEntryActive}
                onClick={() => isEntryActive && setEntryQrModalOpen(true)}
              >
                <Download className="size-4" /> Descargar QR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{entryQrText}</p>
          </div>
          {/* QR de Finalización */}
          <div>
            <div className="font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" /> QR de Finalización
            </div>
            <div className="flex items-center gap-4">
              <div
                className="relative size-[130px] shrink-0 rounded-xl border-2 overflow-hidden"
                style={{ backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }}
                onClick={() => isExitActive && setExitQrModalOpen(true)}
              >
                {isExitActive ? (
                  <div className="size-full grid place-items-center p-2">
                    <QrDisplay eventId={`${currentEvent.id}-fin`} qrUrl={finalizationQrUrl || undefined} />
                  </div>
                ) : (
                  <div className="size-full flex items-center justify-center">
                    <Lock className="size-8" style={{ color: "#374151" }} />
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={!isExitActive}
                onClick={() => isExitActive && setExitQrModalOpen(true)}
              >
                <Download className="size-4" /> Descargar QR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{exitQrText}</p>
          </div>
        </div>
      </div>

      {/* QR Entry Modal */}
      <Dialog open={entryQrModalOpen} onOpenChange={setEntryQrModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-base">Comparte este QR para que más usuarios se unan</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="rounded-xl border-2 p-6" style={{ backgroundColor: "#ffffff" }}>
              <div className="min-w-[350px] min-h-[350px] flex items-center justify-center">
                <QrDisplay eventId={currentEvent.id} qrUrl={eventQrTokens[currentEvent.id]?.qrUrl} qrSize={350} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Exit Modal */}
      <Dialog open={exitQrModalOpen} onOpenChange={setExitQrModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-center text-base">Comparte este QR para que los asistentes registren su salida</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            <div className="rounded-xl border-2 p-6" style={{ backgroundColor: "#ffffff" }}>
              <div className="min-w-[350px] min-h-[350px] flex items-center justify-center">
                <QrDisplay eventId={`${currentEvent.id}-fin`} qrUrl={finalizationQrUrl || undefined} qrSize={350} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments modal */}
      <Dialog open={commentsModalOpen} onOpenChange={setCommentsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comentarios de participantes — {currentEvent.titulo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {commentsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ningún participante ha dejado un comentario todavía.
              </p>
            ) : (
              commentsList.map((enc) => {
                const student = findStudent(enc.asistencia_id);
                const initials = student
                  ? student.studentName
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                  : "??";
                return (
                  <div key={enc.id} className="flex gap-3 rounded-lg border p-3">
                    <div
                      className="size-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: "var(--puma-blue)" }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">
                          {student?.studentName || "Participante"}
                        </p>
                        <span className="text-xs shrink-0">
                          {"★".repeat(enc.calificacion_evento)}
                          {"☆".repeat(5 - enc.calificacion_evento)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{enc.comentario}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                          onClick={() => abrirPdfModal(s)}
                        >
                          <FileText className="size-3.5" /> Ver PDF
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
      <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-4">
        <button onClick={() => setRatingDrawerOpen(true)} className="text-left w-full">
          <StatsCard
            label="Calificación promedio"
            value={avgRating.toFixed(1)}
            hint={`${eventEncuestas.length} respuestas`}
            icon={Star}
            tone="muted"
          />
        </button>
        {eventEncuestas.length > 0 ? (
          <button
            onClick={() => setCommentsModalOpen(true)}
            className="flex items-center gap-1.5 text-sm ml-1"
            style={{ color: "#1e3a5f" }}
          >
            <MessageSquare className="size-4" />
            Ver comentarios de los participantes &rarr;
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-sm ml-1 text-gray-400">
            <MessageSquare className="size-4" />
            Aún no hay comentarios
          </span>
        )}
      </div>

      {/* Real-time attendance summary */}
      {isLiveStatus && (
        <div className="flex flex-row gap-3 flex-wrap">
          {[
            {
              label: "Total inscritos",
              value: liveCounts.total,
              bg: "#eff6ff",
              textColor: "#1e40af",
              borderColor: "#3b82f6",
              icon: <Users className="size-5" style={{ color: "#3b82f6" }} />,
              semaphore: "#3b82f6",
              pulsing: false,
              scaling: false,
            },
            {
              label: "Con entrada marcada",
              value: liveCounts.conEntrada,
              bg: "#f0fdf4",
              textColor: "#166534",
              borderColor: "#22c55e",
              icon: <CheckCircle2 className="size-5" style={{ color: "#22c55e" }} />,
              semaphore: "#22c55e",
              pulsing: pulseEntrada,
              scaling: scaleEntrada,
            },
            {
              label: "Con salida marcada",
              value: liveCounts.conSalida,
              bg: "#fefce8",
              textColor: "#92400e",
              borderColor: "#f59e0b",
              icon: <LogOut className="size-5" style={{ color: "#f59e0b" }} />,
              semaphore: "#f59e0b",
              pulsing: pulseSalida,
              scaling: scaleSalida,
            },
            {
              label: "Sin marcar",
              value: liveCounts.sinMarcar,
              bg: "#fff1f2",
              textColor: "#991b1b",
              borderColor: "#ef4444",
              icon: <Clock className="size-5" style={{ color: "#ef4444" }} />,
              semaphore: "#ef4444",
              pulsing: false,
              scaling: false,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex-1 min-w-[160px] rounded-xl border p-4 flex flex-col gap-2 relative overflow-hidden"
              style={{
                backgroundColor: item.bg,
                borderColor: "transparent",
                borderLeft: `4px solid ${item.borderColor}`,
              }}
            >
              <div className="absolute top-2 right-2">{item.icon}</div>
              <span
                className="text-3xl font-bold mt-4 transition-transform duration-300"
                style={{
                  color: item.textColor,
                  transform: item.scaling ? "scale(1.1)" : "scale(1)",
                }}
              >
                {item.value}
              </span>
              <span className="text-xs font-medium" style={{ color: item.textColor }}>
                {item.label}
              </span>
              <div className="absolute bottom-2 right-2">
                <span
                  className={`block size-2.5 rounded-full ${item.pulsing ? "animate-ping" : ""}`}
                  style={{ backgroundColor: item.semaphore }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="enrolled" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="enrolled">Matriculados ({enrollments.length})</TabsTrigger>
          <TabsTrigger value="attendance">Asistencias ({attendedCount})</TabsTrigger>
          {isCreator && <TabsTrigger value="bitacora">Bitácora</TabsTrigger>}
          <TabsTrigger value="moderadores">Moderadores</TabsTrigger>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  style={{ borderColor: "#22c55e", color: "#22c55e" }}
                  onClick={() => {
                    const first = enrollments.find((e) => attendanceState[e.id]);
                    if (first) {
                      setAuditoriaStudent(first);
                      setAuditoriaIndex(0);
                    } else {
                      toast.error("No hay estudiantes marcados como asistidos");
                    }
                  }}
                >
                  <CheckCircle2 className="size-3.5" /> Inicio de auditoría
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
                  <TableHead className="text-center w-20">Auditar</TableHead>
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
                          <TooltipContent>Enviar código por correo </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-8"
                        style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
                        onClick={() => {
                          setAuditoriaStudent(s);
                          setAuditoriaIndex(enrollments.indexOf(s));
                        }}
                      >
                        <Eye className="size-3" /> Verificar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Bitácora Tab */}
        {isCreator && (
          <TabsContent value="bitacora">
            <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
              <div className="px-5 py-4 border-b bg-secondary/20">
                <h3 className="font-semibold text-sm">Bitácora del evento</h3>
              </div>
              <div className="divide-y">
                {bitacora.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No hay entradas en la bitácora.
                  </div>
                ) : (
                  bitacora.map((entry) => (
                    <div key={entry.id} className="px-5 py-4 flex items-start gap-3">
                      <div
                        className="size-9 rounded-full grid place-items-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: "var(--puma-blue)" }}
                      >
                        {entry.usuario_nombre
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{entry.usuario_nombre}</span>
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{entry.accion}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        )}

        {/* Moderadores Tab */}
        <TabsContent value="moderadores">
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b bg-secondary/20 flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-sm">Moderadores del evento</h3>
              {isCreator && (
                <Button
                  size="sm"
                  className="text-white gap-1.5"
                  style={{ backgroundColor: "var(--puma-blue)" }}
                  onClick={() => setModModalOpen(true)}
                >
                  <UserPlus className="size-3.5" /> Agregar moderador
                </Button>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo de rol</TableHead>
                  <TableHead>Permisos</TableHead>
                  <TableHead>Estado</TableHead>
                  {isCreator && <TableHead className="text-center">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {moderadores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isCreator ? 6 : 5}
                      className="text-center text-muted-foreground py-6"
                    >
                      No hay moderadores asignados.
                    </TableCell>
                  </TableRow>
                ) : (
                  moderadores.map((mod) => (
                    <TableRow key={mod.id} className="hover:bg-secondary/30">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="size-8 rounded-full grid place-items-center text-[10px] font-semibold text-white"
                            style={{ backgroundColor: "var(--puma-blue)" }}
                          >
                            {mod.nombre
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="font-medium">{mod.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{mod.email}</TableCell>
                      <TableCell>
                        <Badge variant={mod.tipo_rol === "COPROPIETARIO" ? "default" : "secondary"}>
                          {mod.tipo_rol === "COPROPIETARIO" ? "Copropietario" : "Moderador"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {mod.tipo_rol === "COPROPIETARIO" ? (
                            <span className="text-xs text-muted-foreground">Acceso total</span>
                          ) : (
                            mod.permisos.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-[10px]">
                                {perm === "ASISTENCIA"
                                  ? "Asistencia"
                                  : perm === "FEED"
                                    ? "Feed"
                                    : perm}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium",
                            mod.activo ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700",
                          )}
                        >
                          {mod.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      {isCreator && (
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeModerador(mod.id)}
                          >
                            <X className="size-3.5" /> Eliminar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Agregar moderador modal */}
      <Dialog
        open={modModalOpen}
        onOpenChange={(open) => {
          setModModalOpen(open);
          if (!open) {
            setModEmail("");
            setModSearchedUser(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar moderador</DialogTitle>
            <DialogDescription>
              Busca por correo institucional para agregar un moderador al evento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Correo institucional</label>
              <Input
                placeholder="ej: jperez@unah.edu.hn"
                value={modEmail}
                onChange={(e) => {
                  const val = e.target.value;
                  setModEmail(val);
                  if (val.trim()) {
                    const found = MOCK_USERS_BY_EMAIL[val.trim().toLowerCase()];
                    setModSearchedUser(found || "NOT_FOUND");
                  } else {
                    setModSearchedUser(null);
                  }
                }}
              />
            </div>
            {modSearchedUser && modSearchedUser !== "NOT_FOUND" && (
              <div
                className="rounded-lg p-3 flex items-center gap-3"
                style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                <div
                  className="size-10 rounded-full grid place-items-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: "var(--puma-blue)" }}
                >
                  {modSearchedUser.nombre
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#166534" }}>
                    {modSearchedUser.nombre}
                  </p>
                  <p className="text-xs" style={{ color: "#166534" }}>
                    {modSearchedUser.email}
                  </p>
                </div>
              </div>
            )}
            {modSearchedUser === "NOT_FOUND" && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#991b1b",
                }}
              >
                No se encontró ningún usuario con ese correo institucional.
              </div>
            )}
            {modSearchedUser && modSearchedUser !== "NOT_FOUND" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tipo de rol</label>
                  <Select
                    value={modTipoRol}
                    onValueChange={(v) => setModTipoRol(v as "MODERADOR" | "COPROPIETARIO")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MODERADOR">Moderador</SelectItem>
                      <SelectItem value="COPROPIETARIO">Copropietario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {modTipoRol === "MODERADOR" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Permisos</p>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                        style={{
                          backgroundColor: "#eff6ff",
                          borderColor: "#bfdbfe",
                          color: "#1e40af",
                        }}
                      >
                        <Check className="size-3" /> Asistencia
                      </div>
                      <span className="text-[10px] text-muted-foreground self-center">
                        Puede ayudar con el marcaje de entrada y salida
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                        style={{
                          backgroundColor: "#eff6ff",
                          borderColor: "#bfdbfe",
                          color: "#1e40af",
                        }}
                      >
                        <Check className="size-3" /> Feed
                      </div>
                      <span className="text-[10px] text-muted-foreground self-center">
                        Puede publicar y republicar en el feed del evento
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className="rounded-lg p-3 text-sm"
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                    }}
                  >
                    Acceso total igual al creador: puede gestionar moderadores, editar el evento y
                    ver la bitácora.
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: "var(--puma-blue)" }}
              onClick={addModerador}
              disabled={!modSearchedUser || modSearchedUser === "NOT_FOUND"}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publicar en feed modal */}
      <Dialog open={feedModalOpen} onOpenChange={setFeedModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar en el feed</DialogTitle>
            <DialogDescription>
              Escribe un mensaje para compartir con los participantes del evento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Escribe tu mensaje aquí..."
              value={feedMessage}
              onChange={(e) => {
                if (e.target.value.length <= 500) setFeedMessage(e.target.value);
              }}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{feedMessage.length}/500</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFeedModalOpen(false);
                setFeedMessage("");
              }}
            >
              Cancelar
            </Button>
            <Button
              className="text-white gap-1.5"
              style={{ backgroundColor: "#004B87" }}
              disabled={!feedMessage.trim()}
              onClick={handleSendToFeed}
            >
              <Megaphone className="size-4" /> Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El evento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction style={{ backgroundColor: "#ef4444" }} onClick={handleDeleteEvent}>
              <Trash2 className="size-4 mr-1.5" /> Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish confirm dialog */}
      <AlertDialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar a VOAE?</AlertDialogTitle>
            <AlertDialogDescription>
              El evento será enviado a VOAE para su revisión y aprobación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction style={{ backgroundColor: "#22c55e" }} onClick={handleSendToVoae}>
              <Send className="size-4 mr-1.5" /> Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Auditoría Modal */}
      <Dialog
        open={auditoriaStudent !== null}
        onOpenChange={(v) => {
          if (!v) setAuditoriaStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          {auditoriaStudent && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div
                className="size-[100px] rounded-full grid place-items-center text-lg font-bold shrink-0 border-2"
                style={{ borderColor: "#004B87", backgroundColor: "#004B8720", color: "#004B87" }}
              >
                {auditoriaStudent.studentName
                  .split(" ")
                  .map((p: string) => p[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="text-center">
                <p className="font-semibold text-base">{auditoriaStudent.studentName}</p>
                <p className="text-sm text-muted-foreground">{auditoriaStudent.studentId}</p>
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <span>
                    Entrada:{" "}
                    <strong>
                      {auditoriaStudent.hora_llegada
                        ? new Date(auditoriaStudent.hora_llegada).toLocaleTimeString("es-HN", {
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
                      {auditoriaStudent.hora_salida
                        ? new Date(auditoriaStudent.hora_salida).toLocaleTimeString("es-HN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : auditoriaStudent.hora_llegada
                          ? "Sin registrar salida"
                          : "Sin registro"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>
                    Ubicación:{" "}
                    <strong
                      className={
                        auditoriaStudent.ubicacion_entrada_validada
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {auditoriaStudent.ubicacion_entrada_validada
                        ? currentEvent.lugar || "Verificada"
                        : "No coincide / Sin registro"}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="w-full space-y-2 pt-2">
                <Button
                  className="w-full text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={() => {
                    toggleAttendance(auditoriaStudent.id, true);
                    toast.success(`Asistencia aprobada para ${auditoriaStudent.studentName}`);
                    setAuditoriaStudent(null);
                  }}
                >
                  <CheckCircle2 className="size-4" /> Aprobar
                </Button>
                <Button
                  className="w-full gap-1.5 text-white"
                  style={{ backgroundColor: "#ef4444" }}
                  onClick={() => {
                    toggleAttendance(auditoriaStudent.id, false);
                    toast.error(`Asistencia rechazada para ${auditoriaStudent.studentName}`);
                    setAuditoriaStudent(null);
                  }}
                >
                  <XCircle className="size-4" /> Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            estudiante_carrera:
              pdfStudent.studentCareer || pdfStudent.estudiante_carrera || "No especificada",
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
            name: currentUser?.name || "Lic. Roberto Fiallos",
            cargo: currentUser?.cargo || "Vicerrector",
            departamento: currentUser?.departamento || "Orientación y Asuntos Estudiantiles",
            codigo_firma: currentUser?.codigo_firma || "ART.202606-18-S-CU",
            firma_url: currentUser?.firma_url,
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

function ShareIcon() {
  return (
    <svg
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </svg>
  );
}

function QrDisplay({ eventId, qrUrl, qrSize = 100 }: { eventId: string; qrUrl?: string; qrSize?: number }) {
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
      <QRCodeCanvas value={value} size={qrSize} level="M" />
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

/* ──────── EDIT EVENT FORM (STEPPER) ──────── */

const EDIT_STEPS = [
  { icon: FileText, label: "Información básica" },
  { icon: CalendarDays, label: "Fecha, lugar y capacidad" },
  { icon: ImagePlus, label: "Material visual" },
  { icon: CheckCircle2, label: "Revisión y publicación" },
];

type EditFormData = {
  titulo: string;
  categoria: string;
  tipo_actividad: string;
  tipo_evento: string;
  centro_regional: string;
  descripcion: string;
  entidad_organizadora: string;
  audiencia: string;
  registro_entrada: boolean;
  registro_salida: boolean;
  tipo_duracion: "TOTALES" | "DIARIAS";
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  enlace_virtual: string;
  cupo_maximo: string;
  duracion_horas: string;
  requiere_inscripcion: boolean;
  usa_imagen_personalizada: boolean;
  latitud: string;
  longitud: string;
};

type EditFormErrors = Partial<Record<keyof EditFormData, string>>;

function EditEventForm({
  event,
  onClose,
  onSaved,
}: {
  event: UniEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const e = event;
  const [currentStep, setCurrentStep] = useState(1);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<EditFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof EditFormData, boolean>>>({});
  const [imgPortada, setImgPortada] = useState<string | null>(e.portada_url || null);
  const portadaFileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useRole();

  const [data, setData] = useState<EditFormData>({
    titulo: e.titulo,
    categoria: e.categoria,
    tipo_actividad: e.tipo_actividad || "Presencial",
    tipo_evento: e.tipo_evento === "RECREACION" ? "SIN_HORAS" : "HORAS_VOAE",
    centro_regional: e.centro_regional || "Ciudad Universitaria",
    descripcion: e.descripcion,
    entidad_organizadora: e.entidad_organizadora || "",
    audiencia: "TODO_PUBLICO",
    registro_entrada: true,
    registro_salida: true,
    tipo_duracion: (e.tipo_duracion as "TOTALES" | "DIARIAS") || "TOTALES",
    fecha_inicio: e.fecha_inicio.slice(0, 10),
    hora_inicio: e.hora_inicio || e.fecha_inicio.slice(11, 16),
    fecha_fin: e.fecha_fin.slice(0, 10),
    hora_fin: e.hora_fin || e.fecha_fin.slice(11, 16),
    ubicacion: e.lugar || "",
    enlace_virtual: e.enlace_virtual || "",
    cupo_maximo: String(e.cupo_maximo),
    duracion_horas: String(e.duracion_horas),
    requiere_inscripcion: e.requiere_inscripcion,
    usa_imagen_personalizada: e.usa_imagen_personalizada,
    latitud: String(e.latitud ?? ""),
    longitud: String(e.longitud ?? ""),
  });

  const set = (field: keyof EditFormData, value: string | boolean) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const TEXT_RE =
    /^[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\u00fc\u00dc0-9\s.,:=\-*()+]+$/;

  const validate = (d: EditFormData): EditFormErrors => {
    const e: EditFormErrors = {};
    const todayStr = new Date().toISOString().slice(0, 10);
    if (!d.titulo.trim()) e.titulo = "El t\u00edtulo del evento es obligatorio";
    else if (d.titulo.length > 40) e.titulo = "El t\u00edtulo no puede exceder 40 caracteres";
    if (!d.descripcion.trim()) e.descripcion = "La descripci\u00f3n del evento es obligatoria";
    else if (d.descripcion.trim().split(/\s+/).length > 100)
      e.descripcion = "La descripci\u00f3n no puede exceder 100 palabras";
    if (d.tipo_actividad !== "Virtual" && !d.ubicacion.trim())
      e.ubicacion = "La ubicaci\u00f3n es obligatoria para eventos presenciales o h\u00edbridos";
    if (d.tipo_actividad !== "Presencial" && !d.enlace_virtual.trim())
      e.enlace_virtual = "El enlace virtual es obligatorio para eventos virtuales o h\u00edbridos";
    if (d.enlace_virtual && d.enlace_virtual.trim() && !/^https?:\/\//.test(d.enlace_virtual))
      e.enlace_virtual = "Debe ser una URL v\u00e1lida (https://...)";
    if (!d.fecha_inicio) e.fecha_inicio = "Selecciona la fecha de inicio";
    else if (d.fecha_inicio < todayStr) e.fecha_inicio = "No puedes seleccionar una fecha pasada";
    if (!d.hora_inicio) e.hora_inicio = "Selecciona la hora de inicio";
    if (!d.fecha_fin) e.fecha_fin = "Selecciona la fecha de fin";
    else if (d.fecha_fin < d.fecha_inicio)
      e.fecha_fin = "La fecha de fin debe ser igual o posterior a la de inicio";
    if (!d.hora_fin) e.hora_fin = "Selecciona la hora de fin";
    if (
      d.fecha_inicio &&
      d.fecha_fin &&
      d.fecha_inicio === d.fecha_fin &&
      d.hora_inicio &&
      d.hora_fin &&
      d.hora_fin <= d.hora_inicio
    ) {
      e.hora_fin = "El horario de fin debe ser posterior al horario de inicio.";
    }
    if (!d.cupo_maximo || parseInt(d.cupo_maximo) < 1) e.cupo_maximo = "El cupo m\u00ednimo es 1";
    if (!d.duracion_horas || parseFloat(d.duracion_horas) <= 0)
      e.duracion_horas = "La duraci\u00f3n debe ser mayor a 0";
    return e;
  };

  const step2RequiredFields = (): (keyof EditFormData)[] => {
    const fields: (keyof EditFormData)[] = [
      "fecha_inicio",
      "hora_inicio",
      "fecha_fin",
      "hora_fin",
      "cupo_maximo",
      "duracion_horas",
    ];
    if (data.tipo_actividad !== "Virtual") fields.push("ubicacion");
    if (data.tipo_actividad !== "Presencial") fields.push("enlace_virtual");
    return fields;
  };

  const step1Complete = data.titulo.trim().length > 0 && data.descripcion.trim().length > 0;
  const step2Complete = (() => {
    const fields = step2RequiredFields();
    return fields.every((f) => {
      const v = data[f];
      return typeof v === "string" ? v.trim().length > 0 : v !== false;
    });
  })();

  const handlePortadaFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no v\u00e1lido", { description: "Usa JPG, PNG o WEBP para la portada" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "M\u00e1ximo 5MB para la portada" });
      return;
    }
    setImgPortada(URL.createObjectURL(file));
  };

  const handleNext = () => {
    if (currentStep === 1 && !step1Complete) {
      setTouched((prev) => ({ ...prev, titulo: true, descripcion: true }));
      setErrors(validate(data));
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (currentStep === 2 && !step2Complete) {
      const fields = step2RequiredFields();
      setTouched((prev) => {
        const next = { ...prev };
        fields.forEach((f) => {
          next[f] = true;
        });
        return next;
      });
      setErrors(validate(data));
      toast.error("Completa los campos obligatorios");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const doSave = (newStatus?: EventStatus) => {
    setSaving(true);
    const isRec = data.tipo_evento === "SIN_HORAS";
    const idx = EVENTS.findIndex((ev) => ev.id === e.id);
    if (idx !== -1) {
      (EVENTS as any)[idx] = {
        ...EVENTS[idx],
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        tipo_evento: isRec ? "RECREACION" : "HORAS_VOAE",
        tipo_actividad: data.tipo_actividad,
        fecha_inicio: data.fecha_inicio + "T" + data.hora_inicio + ":00",
        fecha_fin: data.fecha_fin + "T" + data.hora_fin + ":00",
        hora_inicio: data.hora_inicio,
        hora_fin: data.hora_fin,
        lugar: data.ubicacion,
        enlace_virtual: data.enlace_virtual,
        cupo_maximo: parseInt(data.cupo_maximo) || 0,
        duracion_horas: parseFloat(data.duracion_horas) || 0,
        centro_regional: data.centro_regional,
        entidad_organizadora: data.entidad_organizadora,
        visibilidad: "PUBLICO",
        requiere_inscripcion: data.requiere_inscripcion,
        portada_url: imgPortada || undefined,
        usa_imagen_personalizada: data.usa_imagen_personalizada,
        tipo_duracion: data.tipo_duracion,
        estado: newStatus || (e.estado as EventStatus),
        updated_at: new Date().toISOString(),
      };
    }
    setSaving(false);
    if (newStatus && newStatus !== e.estado) {
      toast.success(
        data.tipo_evento === "SIN_HORAS" ? "Evento publicado" : "Evento enviado a VOAE",
      );
    } else {
      toast.success("Cambios guardados");
    }
    onSaved();
  };

  const handleSaveChanges = () => {
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    doSave();
  };

  const handleCancelClick = () => {
    const hasChanges =
      data.titulo !== e.titulo ||
      data.descripcion !== e.descripcion ||
      data.fecha_inicio !== e.fecha_inicio.slice(0, 10) ||
      imgPortada !== (e.portada_url || null);
    if (hasChanges) {
      setExitConfirmOpen(true);
    } else {
      onClose();
    }
  };

  /* ── Step 1 ── */
  const renderStep1 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-lg border bg-green-50/50 p-3">
          <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Editando evento creado por:{" "}
              <span className="font-semibold">{user?.name || e.tutor_nombre}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Los cambios se guardarán manteniendo el estado actual del evento.
            </p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium">
            Título del evento <span className="text-red-500">*</span>
          </label>
          <input
            className={cn(
              "w-full h-10 px-3 rounded-lg border text-sm mt-1",
              errors.titulo && "border-red-400",
            )}
            value={data.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            maxLength={40}
          />
          {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">
            {data.titulo.length}/40
          </p>
        </div>
        <div>
          <label className="text-xs font-medium">
            Categoría <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.categoria}
            onChange={(e) => set("categoria", e.target.value)}
          >
            {(Object.keys(CATEGORY_LABEL_LONG) as Array<keyof typeof CATEGORY_LABEL_LONG>).map(
              (c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL_LONG[c]}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">
            Tipo de actividad <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.tipo_actividad}
            onChange={(e) => set("tipo_actividad", e.target.value)}
          >
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            className={cn(
              "w-full rounded-lg border text-sm mt-1 p-3 resize-none",
              errors.descripcion && "border-red-400",
            )}
            rows={3}
            value={data.descripcion}
            onChange={(e) => {
              const val = e.target.value;
              const words = val.trim() ? val.trim().split(/\s+/) : [];
              if (words.length <= 100) set("descripcion", val);
            }}
            placeholder="Máximo 100 palabras"
          />
          {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">
            {data.descripcion.trim() ? data.descripcion.trim().split(/\s+/).length : 0} / 100
            palabras
          </p>
        </div>
        <div>
          <label className="text-xs font-medium">Entidad organizadora</label>
          <input
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.entidad_organizadora}
            maxLength={50}
            onChange={(e) => set("entidad_organizadora", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium">Tipo de evento</label>
          <select
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.tipo_evento}
            onChange={(e) => set("tipo_evento", e.target.value)}
          >
            <option value="HORAS_VOAE">Horas VOAE (Artículo 140)</option>
            <option value="SIN_HORAS">Evento de recreación</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Centro regional</label>
          <select
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.centro_regional}
            onChange={(e) => set("centro_regional", e.target.value)}
          >
            {CENTROS_REGIONALES.map((cr) => (
              <option key={cr} value={cr}>
                {cr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Audiencia</label>
          <select
            className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
            value={data.audiencia}
            onChange={(e) => set("audiencia", e.target.value)}
          >
            <option value="TODO_PUBLICO">Todo público</option>
            <option value="SOLO_ESTUDIANTES">Solo estudiantes</option>
            <option value="SOLO_EMPLEADOS">Solo empleados</option>
          </select>
        </div>
        <div>
          {data.tipo_evento === "HORAS_VOAE" ? (
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-not-allowed">
                <input type="checkbox" checked disabled className="accent-gray-400" />
                <span>Asistencia de entrada</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-not-allowed">
                <input type="checkbox" checked disabled className="accent-gray-400" />
                <span>Asistencia de salida</span>
              </label>
              <p className="text-xs" style={{ color: "#ef4444" }}>
                Obligatorio para eventos con horas VOAE.
              </p>
            </div>
          ) : (
            <div className="flex gap-6 pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.registro_entrada}
                  onChange={(e) => set("registro_entrada", e.target.checked)}
                />
                <span>Asistencia de entrada</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.registro_salida}
                  onChange={(e) => set("registro_salida", e.target.checked)}
                />
                <span>Asistencia de salida</span>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ── Step 2 ── */
  const renderStep2 = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return (
      <div className="h-full flex flex-col justify-center">
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium">
                Fecha inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.fecha_inicio && "border-red-400",
                )}
                value={data.fecha_inicio}
                onChange={(e) => set("fecha_inicio", e.target.value)}
                min={todayStr}
              />
              {errors.fecha_inicio && (
                <p className="text-xs text-red-500 mt-1">{errors.fecha_inicio}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium">
                Hora inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.hora_inicio && "border-red-400",
                )}
                value={data.hora_inicio}
                onChange={(e) => set("hora_inicio", e.target.value)}
              />
              {errors.hora_inicio && (
                <p className="text-xs text-red-500 mt-1">{errors.hora_inicio}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium">
                Fecha fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.fecha_fin && "border-red-400",
                )}
                value={data.fecha_fin}
                onChange={(e) => set("fecha_fin", e.target.value)}
                min={data.fecha_inicio || todayStr}
              />
              {errors.fecha_fin && <p className="text-xs text-red-500 mt-1">{errors.fecha_fin}</p>}
            </div>
            <div>
              <label className="text-xs font-medium">
                Hora fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.hora_fin && "border-red-400",
                )}
                value={data.hora_fin}
                onChange={(e) => set("hora_fin", e.target.value)}
              />
              {errors.hora_fin && <p className="text-xs text-red-500 mt-1">{errors.hora_fin}</p>}
            </div>
          </div>

          {data.tipo_actividad !== "Virtual" && (
            <div>
              <label className="text-xs font-medium">
                Ubicación física <span className="text-red-500">*</span>
              </label>
              <input
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.ubicacion && "border-red-400",
                )}
                value={data.ubicacion}
                onChange={(e) => set("ubicacion", e.target.value)}
                placeholder="Salón, edificio, dirección..."
              />
              {errors.ubicacion && <p className="text-xs text-red-500 mt-1">{errors.ubicacion}</p>}
              <div className="mt-3">
                <LocationPicker
                  lat={data.latitud}
                  lng={data.longitud}
                  onLocationChange={(lat, lng) => {
                    setData((prev) => ({ ...prev, latitud: lat, longitud: lng }));
                  }}
                />
              </div>
            </div>
          )}

          {data.tipo_actividad !== "Presencial" && (
            <div>
              <label className="text-xs font-medium">
                Enlace virtual <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.enlace_virtual && "border-red-400",
                )}
                value={data.enlace_virtual}
                onChange={(e) => set("enlace_virtual", e.target.value)}
                placeholder="https://meet.google.com/..."
              />
              {errors.enlace_virtual && (
                <p className="text-xs text-red-500 mt-1">{errors.enlace_virtual}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">
                Cupo máximo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                className={cn(
                  "w-full h-10 px-3 rounded-lg border text-sm mt-1",
                  errors.cupo_maximo && "border-red-400",
                )}
                value={data.cupo_maximo}
                onChange={(e) => set("cupo_maximo", e.target.value)}
              />
              {errors.cupo_maximo && (
                <p className="text-xs text-red-500 mt-1">{errors.cupo_maximo}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium">
                Duración <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  className={cn(
                    "w-24 h-10 px-3 rounded-lg border text-sm",
                    errors.duracion_horas && "border-red-400",
                  )}
                  value={data.duracion_horas}
                  onChange={(e) => set("duracion_horas", e.target.value)}
                />
                <select
                  className="h-10 px-3 rounded-lg border text-sm"
                  value={data.tipo_duracion}
                  onChange={(e) => set("tipo_duracion", e.target.value as "TOTALES" | "DIARIAS")}
                >
                  <option value="TOTALES">Horas totales</option>
                  <option value="DIARIAS">Horas diarias</option>
                </select>
              </div>
              {errors.duracion_horas && (
                <p className="text-xs text-red-500 mt-1">{errors.duracion_horas}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.requiere_inscripcion}
                onChange={(e) => set("requiere_inscripcion", e.target.checked)}
              />
              Requiere inscripción previa
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.usa_imagen_personalizada}
                onChange={(e) => set("usa_imagen_personalizada", e.target.checked)}
              />
              Usar imagen personalizada
            </label>
          </div>
        </div>
      </div>
    );
  };

  /* ── Step 3 ── */
  const renderStep3 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={data.usa_imagen_personalizada}
              onChange={(e) => set("usa_imagen_personalizada", e.target.checked)}
            />
            Deseas agregar una imagen de portada?
          </label>
        </div>

        {data.usa_imagen_personalizada && (
          <div>
            <input
              ref={portadaFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePortadaFile(e.target.files?.[0])}
            />
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition"
              onClick={() => portadaFileRef.current?.click()}
            >
              {imgPortada ? (
                <div className="flex items-center gap-4 justify-center">
                  <img src={imgPortada} alt="" className="h-24 rounded-lg object-cover" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Imagen de portada</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgPortada(null);
                      }}
                      className="text-xs text-red-500 underline mt-1"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <ImagePlus className="size-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Toca para seleccionar una imagen de portada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WEBP · Máximo 5MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!data.usa_imagen_personalizada && (
          <div className="rounded-lg border bg-muted/30 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Se usará un placeholder automático según la categoría del evento.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Step 4 ── */
  const renderStep4 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-4">
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Información básica
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Título:</span> {data.titulo}
            </div>
            <div>
              <span className="text-muted-foreground">Categoría:</span> {data.categoria}
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span> {data.tipo_actividad}
            </div>
            <div>
              <span className="text-muted-foreground">Entidad:</span>{" "}
              {data.entidad_organizadora || "—"}
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fecha y lugar
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Inicio:</span> {data.fecha_inicio}{" "}
              {data.hora_inicio}
            </div>
            <div>
              <span className="text-muted-foreground">Fin:</span> {data.fecha_fin} {data.hora_fin}
            </div>
            {data.ubicacion && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Ubicación:</span> {data.ubicacion}
              </div>
            )}
            {data.enlace_virtual && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Enlace:</span> {data.enlace_virtual}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configuración
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Cupo:</span> {data.cupo_maximo}
            </div>
            <div>
              <span className="text-muted-foreground">Duración:</span> {data.duracion_horas}h
            </div>
            <div>
              <span className="text-muted-foreground">Inscripción:</span>{" "}
              {data.requiere_inscripcion ? "Sí" : "No"}
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Los cambios se guardarán manteniendo el estado actual del evento.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pt-4 pb-3 px-4 md:pt-6 md:pb-4 md:px-6 lg:pt-8 lg:pb-5 lg:px-8">
        <div className="mx-auto" style={{ maxWidth: "1000px" }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition shrink-0"
              aria-label="Volver al detalle del evento"
            >
              <ChevronLeft className="size-5" />
            </button>
            {EDIT_STEPS.map((step, i) => (
              <Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors shrink-0",
                      i + 1 < currentStep
                        ? "bg-green-500 border-green-500 text-white"
                        : i + 1 === currentStep
                          ? "border-[#004B87] text-[#004B87] bg-white"
                          : "border-[#9ca3af] text-[#9ca3af] bg-white",
                    )}
                  >
                    {i + 1 < currentStep ? <CheckCircle2 className="size-5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium text-center leading-tight max-w-[88px] truncate hidden sm:block",
                      i + 1 === currentStep ? "text-[#004B87]" : "text-[#9ca3af]",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < EDIT_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 sm:mx-2 bg-gray-200 rounded">
                    <div
                      className={cn(
                        "h-full rounded transition-all duration-300",
                        i + 1 < currentStep ? "bg-green-500" : "bg-transparent",
                      )}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">Paso {currentStep} de 4</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 lg:px-8 min-h-0">
        <div className="mx-auto h-full" style={{ maxWidth: "1000px" }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-3 md:px-6 md:py-4 lg:px-8">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1000px" }}>
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev} className="gap-1.5">
                <ChevronLeft className="size-4" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  currentStep === 1 ? !step1Complete : currentStep === 2 ? !step2Complete : false
                }
                className={cn(
                  "gap-1.5",
                  (currentStep === 1
                    ? !step1Complete
                    : currentStep === 2
                      ? !step2Complete
                      : false) && "opacity-50 cursor-not-allowed",
                )}
                style={{ backgroundColor: "var(--puma-blue)" }}
              >
                Siguiente <ChevronRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelClick}
                  disabled={saving}
                  style={{ borderColor: "#9ca3af", color: "#9ca3af" }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="gap-1.5 text-white"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={handleSaveChanges}
                  disabled={saving}
                >
                  <Check className="size-4" /> Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Deseas salir sin guardar los cambios?</DialogTitle>
            <DialogDescription>Los cambios no guardados se perderán.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setExitConfirmOpen(false)}>
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setExitConfirmOpen(false);
                onClose();
              }}
            >
              Salir sin guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
