import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  QrCode,
  Download,
  FileText,
  Play,
  Square,
  RefreshCw,
  Copy,
  Eye,
  AlertTriangle,
  Camera,
  XCircle,
  Pen,
  Trash2,
  Send,
  Share2,
  Info,
  LogOut,
  Lock,
  Mail,
} from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { Label } from "../../components/ui/label";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { downloadConstanciaPdf, MESES } from "../../../lib/constancia-pdf";
import { SignatureModal } from "../../components/app/ConstanciaModal";
import { EventForm } from "../../components/app/EventForm";

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

const PLACEHOLDER_BG: Record<string, string> = {
  ACADEMICO: "#eff6ff",
  CULTURAL: "#faf5ff",
  DEPORTIVO: "#f0fdf4",
  SOCIAL: "#fffbeb",
};

const PLACEHOLDER_INITIALS_BG: Record<string, string> = {
  ACADEMICO: "#dbeafe",
  CULTURAL: "#f3e8ff",
  DEPORTIVO: "#dcfce7",
  SOCIAL: "#fef3c7",
};

const PLACEHOLDER_TEXT: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  PROGRAMADO: "Programado",
  EN_CURSO: "En curso",
  FINALIZADO: "Finalizado",
  RECHAZADO: "Rechazado",
};

function formatDate(iso: string) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatLocalEventTimeRange(startIso: string, endIso: string): string {
  const d1 = new Date(startIso);
  const d2 = new Date(endIso);
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return "N/A";
  
  const dateStr = d1.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const format12h = (d: Date) => {
    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const timeStr = `${format12h(d1)} - ${format12h(d2)}`;
  
  if (d1.toDateString() !== d2.toDateString()) {
    const endDateStr = d2.toLocaleDateString("es-HN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Del ${dateStr} (${format12h(d1)}) al ${endDateStr} (${format12h(d2)})`;
  }
  
  return `${dateStr} (${timeStr})`;
}

interface TimelineStepProps {
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}

function TimelineStep({ label, isCompleted, isActive }: TimelineStepProps) {
  return (
    <div className="flex flex-col items-center flex-1 relative">
      <div className={`size-8 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
        isCompleted
          ? "bg-green-500 border-green-500 text-white"
          : isActive
          ? "bg-blue-50 border-[#004B87] text-[#004B87] font-bold"
          : "bg-white border-slate-200 text-slate-400"
      }`}>
        {isCompleted ? <CheckCircle2 className="size-4" /> : "•"}
      </div>
      <span className={`text-[11px] font-semibold mt-2 text-center transition-colors ${
        isActive ? "text-[#004B87]" : isCompleted ? "text-slate-800" : "text-slate-400"
      }`}>{label}</span>
    </div>
  );
}

export function ManageEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [sendVoaeConfirmOpen, setSendVoaeConfirmOpen] = useState(false);

  const handlePublishDirect = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "PROGRAMADO",
      });
      setEvent(updated);
      toast.success("¡Evento publicado con éxito!");
      setPublishConfirmOpen(false);
    } catch (err: any) {
      toast.error("Error al publicar el evento", { description: err.message });
    }
  };
  
  // Controls state
  const [qrTimer, setQrTimer] = useState(120);
  const [qrType, setQrType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [attendanceCode, setAttendanceCode] = useState("");
  const [entryQrOpen, setEntryQrOpen] = useState(false);
  const [exitQrOpen, setExitQrOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [auditoriaStudent, setAuditoriaStudent] = useState<any | null>(null);
  const [auditoriaIndex, setAuditoriaIndex] = useState(0);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  
  // Constancia Modals state
  const [pdfStudent, setPdfStudent] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [firmadasSet, setFirmadasSet] = useState<Set<string>>(new Set());

  const portadaInputRef = useRef<HTMLInputElement>(null);

  const fetchEventDetails = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const evData = await api.get<any>(`/eventos/${eventId}`);
      setEvent(evData);
      
      const insData = await api.get<any[]>(`/inscripciones/evento/${eventId}`);
      setStudents(insData || []);
    } catch (err: any) {
      toast.error("Error al cargar detalles del evento", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (qrTimer > 0 && event?.estado === "EN_CURSO") {
      const interval = setInterval(() => setQrTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [qrTimer, event?.estado]);

  const generateAttendanceCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAttendanceCode(code);
    localStorage.setItem(`att_code_${eventId}`, code);
    toast.success("Nuevo código generado");
  };

  useEffect(() => {
    if (event && !attendanceCode) {
      const saved = localStorage.getItem(`att_code_${eventId}`);
      if (saved) setAttendanceCode(saved);
      else generateAttendanceCode();
    }
  }, [event]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartEvent = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "EN_CURSO",
      });
      setEvent(updated);
      toast.success("¡El evento ha iniciado!");
    } catch (err: any) {
      toast.error("Error al iniciar el evento", { description: err.message });
    }
  };

  const handleStartExit = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "EN_CURSO_SALIDA",
      });
      setEvent(updated);
      toast.success("¡Etapa de salida iniciada! QR de salida habilitado.");
    } catch (err: any) {
      toast.error("Error al iniciar salida", { description: err.message });
    }
  };

  const handleEndEvent = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "FINALIZADO",
      });
      setEvent(updated);
      toast.success("¡El evento ha finalizado!");
    } catch (err: any) {
      toast.error("Error al finalizar el evento", { description: err.message });
    }
  };

  const handleSendToVoae = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "PENDIENTE_APROBACION",
      });
      setEvent(updated);
      toast.success("Evento enviado a VOAE para revisión");
    } catch (err: any) {
      toast.error("Error al enviar a VOAE", { description: err.message });
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;
    try {
      await api.delete(`/eventos/${event.id}`);
      toast.success("Evento descartado con éxito");
      navigate("/tutor/eventos");
    } catch (err: any) {
      toast.error("Error al descartar evento", { description: err.message });
    }
  };

  const handlePortadaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Usa JPG, PNG o WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 5MB" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const updated = await api.put<any>(`/eventos/${event.id}`, {
          ...event,
          portada_url: base64
        });
        setEvent(updated);
        toast.success("Imagen de portada actualizada");
      } catch (err: any) {
        toast.error("Error al actualizar portada", { description: err.message });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSignature = (signatureDataUrl: string) => {
    if (!pdfStudent || !event) return;
    setShowSignatureModal(false);
    setFirmadasSet((prev) => new Set(prev).add(pdfStudent.estudiante_id));
    localStorage.setItem(`cert_signed_${event.id}_${pdfStudent.estudiante_id}`, signatureDataUrl);
    toast.success("Firma estampada con éxito");
  };

  const handleDownloadPDF = async (s: any) => {
    if (!event) return;
    const evDate = new Date(event.fecha_inicio);
    const today = new Date();
    await downloadConstanciaPdf({
      estudiante_nombre: s.estudiante_nombre,
      estudiante_carrera: s.estudiante_carrera || "Carrera de Estudiante",
      estudiante_cuenta: s.estudiante_cuenta,
      tutor_nombre: event.tutor_nombre || "Tutor Responsable",
      evento_nombre: event.titulo,
      evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
      horas: event.duracion_horas,
      categoria: CATEGORY_LABEL[event.categoria] || event.categoria,
      voae_nombre: "Tutor Responsable",
      voae_cargo: "Coordinador de Eventos",
      voae_departamento: "VOAE",
      voae_codigo: `VOAE-${event.id}`,
      fecha_dia: today.getDate(),
      fecha_mes: MESES[today.getMonth()],
      fecha_anio: today.getFullYear(),
      constancia_id: `const-${s.estudiante_cuenta}-${event.id}`,
    });
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground font-medium">Cargando panel del evento...</div>;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="size-12 mx-auto text-red-500 mb-3 animate-bounce" />
        <p className="text-sm font-semibold">Evento no encontrado.</p>
        <Link to="/tutor/eventos" className="text-xs text-[#004B87] underline mt-2 block hover:text-[#003366]">Volver a mis eventos</Link>
      </div>
    );
  }

  if (isEditing) {
    return <EventForm initialEvent={event} onClose={() => { setIsEditing(false); fetchEventDetails(); }} />;
  }

  const isEntryActive = event.estado === "EN_CURSO";
  const isExitActive = event.estado === "EN_CURSO_SALIDA";
  const isFinalized = event.estado === "FINALIZADO";

  const entryQrText = isFinalized
    ? "Evento finalizado"
    : event.estado === "BORRADOR" || event.estado === "PENDIENTE_APROBACION"
      ? "Se habilita cuando inicie el evento"
      : event.estado === "PROGRAMADO"
        ? "Evento no iniciado"
        : event.estado === "EN_CURSO_SALIDA"
          ? "Registro de entrada cerrado"
          : event.estado === "EN_CURSO"
            ? "QR de entrada activo"
            : "";

  const exitQrText = isFinalized
    ? "Evento finalizado"
    : event.estado === "BORRADOR" || event.estado === "PENDIENTE_APROBACION" || event.estado === "PROGRAMADO" || event.estado === "EN_CURSO"
      ? "Se habilita al iniciar salida"
      : event.estado === "EN_CURSO_SALIDA"
        ? "QR de salida activo"
        : "";

  const entryQrValue = `https://conectapumas.app/asistencia/${event.id}?type=ENTRADA&code=${attendanceCode}`;
  const exitQrValue = `https://conectapumas.app/asistencia/${event.id}?type=SALIDA&code=${attendanceCode}`;

  const downloadQrCode = (canvasId: string, filename: string) => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      toast.success("Código QR descargado");
    } else {
      toast.error("No se pudo descargar el código QR");
    }
  };

  const toggleAttendance = async (studentId: string, isChecked: boolean) => {
    const student = students.find((s) => s.id === studentId || s.estudiante_id === studentId);
    if (!student) return;
    try {
      const newStatus = isChecked ? "ASISTIDO" : "INSCRITO";
      await api.put<any>(`/inscripciones/${student.id}/estado`, {
        estado: newStatus
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, estado: newStatus } : s))
      );
      toast.success(isChecked ? `Asistencia registrada para ${student.estudiante_nombre}` : `Asistencia revocada para ${student.estudiante_nombre}`);
    } catch (err: any) {
      toast.error("Error al actualizar asistencia", { description: err.message });
    }
  };

  const markAllAttended = async () => {
    try {
      const promises = students
        .filter((s) => s.estado !== "ASISTIDO")
        .map((s) => api.put<any>(`/inscripciones/${s.id}/estado`, { estado: "ASISTIDO" }));
      await Promise.all(promises);
      setStudents((prev) => prev.map((s) => ({ ...s, estado: "ASISTIDO" })));
      toast.success("Todos los estudiantes han sido marcados como asistidos");
    } catch (err: any) {
      toast.error("Error al registrar asistencias", { description: err.message });
    }
  };

  const triggerQrScanner = () => {
    toast.info("Simulador de Escáner QR de Asistencia", {
      description: "Escaneando código QR de estudiante...",
      action: {
        label: "Simular Entrada",
        onClick: () => {
          const next = students.find((s) => s.estado !== "ASISTIDO");
          if (next) toggleAttendance(next.id, true);
          else toast.error("No hay estudiantes pendientes");
        }
      }
    });
  };

  const downloadPdfReport = () => {
    const rows = students
      .map(
        (s) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd">${s.estudiante_nombre}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;font-family:monospace;font-size:12px">${s.estudiante_cuenta}</td>
        <td style="padding:8px 12px;border:1px solid #ddd">${s.estudiante_cuenta}@unah.hn</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">
          ${s.estado === "ASISTIDO" ? '<span style="color:#22c55e;font-weight:600">Asistió</span>' : '<span style="color:#ef4444;font-weight:600">No asistió</span>'}
        </td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${s.estado === "ASISTIDO" ? new Date(s.inscrito_at || Date.now()).toLocaleTimeString("es-HN", { hour: '2-digit', minute: '2-digit' }) : "-"}</td>
      </tr>
    `
      )
      .join("");

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Asistencias - ${event.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
          h2 { font-size: 20px; margin-bottom: 4px; color: #004B87; }
          .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f1f5f9; padding: 8px 12px; text-align: left; border: 1px solid #ddd; font-size: 11px; text-transform: uppercase; color: #64748b; }
        </style>
      </head>
      <body>
        <h2>${event.titulo}</h2>
        <div class="meta">Tutor: ${event.tutor_nombre || "Tutor Responsable"} &mdash; Fecha: ${new Date(event.fecha_inicio).toLocaleDateString()}</div>
        <table>
          <thead>
            <tr>
              <th>Estudiante</th><th>Número de Cuenta</th><th>Email</th><th>Estado</th><th>Hora Llegada</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const steps = [
    { label: "Creado", isCompleted: true, isActive: false },
    {
      label: "Enviado a VOAE",
      isCompleted: event.estado !== "BORRADOR" && event.estado !== "RECHAZADO",
      isActive: event.estado === "PENDIENTE_APROBACION"
    },
    {
      label: "Aprobado",
      isCompleted: ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA", "FINALIZADO"].includes(event.estado),
      isActive: event.estado === "PROGRAMADO"
    },
    {
      label: "En curso",
      isCompleted: ["EN_CURSO", "EN_CURSO_SALIDA", "FINALIZADO"].includes(event.estado),
      isActive: ["EN_CURSO", "EN_CURSO_SALIDA"].includes(event.estado)
    },
    {
      label: "Finalizado",
      isCompleted: event.estado === "FINALIZADO",
      isActive: event.estado === "FINALIZADO"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        to="/tutor/eventos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#004B87] transition font-medium"
      >
        <ArrowLeft className="size-4" /> Volver
      </Link>

      {/* Header bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{event.titulo}</h1>
            <Badge className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5" style={{
              backgroundColor:
                event.estado === "BORRADOR" ? "#64748b" :
                event.estado === "PENDIENTE_APROBACION" ? "#f59e0b" :
                event.estado === "PROGRAMADO" ? "#3b82f6" :
                event.estado === "EN_CURSO" ? "#22c55e" :
                event.estado === "FINALIZADO" ? "#10b981" : "#ef4444"
            }}>
              {STATUS_LABEL[event.estado] || event.estado}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {event.estado === "BORRADOR" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 border-blue-200 text-[#004B87] hover:bg-blue-50"
              >
                <Pen className="size-4" /> Editar
              </Button>
              {(() => {
                const isRecreacion = event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS" || parseFloat(event.duracion_horas) === 0;
                if (isRecreacion) {
                  return (
                    <Button
                      size="sm"
                      onClick={() => setPublishConfirmOpen(true)}
                      className="gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-sm font-semibold"
                    >
                      <CheckCircle2 className="size-4" /> Publicar
                    </Button>
                  );
                }
                return (
                  <Button
                    size="sm"
                    onClick={() => setSendVoaeConfirmOpen(true)}
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  >
                    <Send className="size-4" /> Enviar a VOAE
                  </Button>
                );
              })()}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEvent}
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" /> Descartar
              </Button>
            </>
          )}

          {event.estado === "RECHAZADO" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-1.5 border-blue-200 text-[#004B87] hover:bg-blue-50"
              >
                <Pen className="size-4" /> Corregir y Reenviar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEvent}
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" /> Descartar
              </Button>
            </>
          )}

          {event.estado === "PROGRAMADO" && (
            <Button onClick={handleStartEvent} className="bg-green-600 hover:bg-green-700 text-white gap-1.5 shadow-sm font-semibold">
              <Play className="size-4" /> Iniciar Evento
            </Button>
          )}

          {event.estado === "EN_CURSO" && (
            <Button onClick={handleStartExit} className="bg-[#004B87] hover:bg-[#003366] text-white gap-1.5 shadow-sm font-semibold">
              <LogOut className="size-4" /> Iniciar Salida
            </Button>
          )}

          {event.estado === "EN_CURSO_SALIDA" && (
            <Button onClick={handleEndEvent} className="bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm font-semibold">
              <Square className="size-4" /> Finalizar Evento
            </Button>
          )}
        </div>
      </div>

      {/* Banners */}
      {event.estado === "BORRADOR" && (
        <div className="rounded-xl border bg-slate-50 border-slate-200/80 p-4 text-sm flex items-start gap-3 text-slate-600">
          <Info className="size-5 shrink-0 text-slate-400 mt-0.5" />
          <span>Este evento está en borrador. Puedes editarlo antes de publicarlo.</span>
        </div>
      )}

      {event.estado === "RECHAZADO" && (
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm flex items-start gap-3 text-amber-800">
          <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-900">Este evento fue rechazado por VOAE</span>
            <p className="mt-1 text-amber-700 font-medium bg-white/60 p-2.5 rounded-lg border border-amber-200/50 mt-2">
              <span className="font-bold">Motivo: </span>
              {event.motivo_rechazo || "No se especificó un motivo de rechazo."}
            </p>
          </div>
        </div>
      )}

      {/* Portada + Ubicacion dynamic boxes */}
      <div className="grid grid-cols-1 md:grid-cols-10 gap-5">
        {/* Left: Portada box */}
        <div className="md:col-span-5 rounded-xl overflow-hidden border bg-card shadow-sm relative group h-52 flex flex-col justify-center">
          {event.estado === "BORRADOR" && (
            <>
              <input
                ref={portadaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePortadaFileChange}
              />
              <button
                type="button"
                onClick={() => portadaInputRef.current?.click()}
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer"
                aria-label="Cambiar imagen de portada"
              >
                <div className="size-10 rounded-full bg-white/90 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Camera className="size-5 text-slate-700" />
                </div>
              </button>
              <p className="absolute bottom-2 left-2 z-10 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded">
                Toca para cambiar la portada
              </p>
            </>
          )}

          {event.portada_url || event.imagen_url ? (
            <img src={event.portada_url || event.imagen_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ backgroundColor: PLACEHOLDER_BG[event.categoria] || "#f1f5f9" }}
            >
              <div
                className="size-20 rounded-full grid place-items-center"
                style={{
                  backgroundColor: PLACEHOLDER_INITIALS_BG[event.categoria] || "#e2e8f0",
                }}
              >
                <div
                  className="text-3xl font-bold"
                  style={{ color: PLACEHOLDER_TEXT[event.categoria] || "#64748b" }}
                >
                  {CATEGORY_LABEL[event.categoria]?.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Maps / Link box */}
        <div className="md:col-span-5">
          {event.tipo_actividad === "Virtual" ? (
            <div className="rounded-xl border bg-blue-50/50 border-blue-200/80 p-5 flex flex-col justify-between h-52 shadow-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                  <Eye className="size-4" /> Modalidad Virtual
                </div>
                <h4 className="font-bold text-lg text-slate-800">Evento por Videoconferencia</h4>
                <p className="text-xs text-muted-foreground">Se transmitirá de forma digital</p>
              </div>

              {event.enlace_virtual ? (
                <Button
                  type="button"
                  className="w-full gap-1.5 h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
                  onClick={() => window.open(event.enlace_virtual, "_blank")}
                >
                  <Eye className="size-4" /> Ir a la reunión virtual
                </Button>
              ) : (
                <div className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200/50 text-center font-medium">
                  Enlace de videoconferencia no configurado.
                </div>
              )}
            </div>
          ) : (
            (() => {
              const loc = event.lugar || event.ubicacion || "";
              const [bName, bLink] = loc.includes("|")
                ? loc.split("|")
                : [loc, loc ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc + " " + (event.centro_regional || "Ciudad Universitaria"))}` : ""];

              if (!bName) {
                return (
                  <div className="rounded-xl border bg-slate-50/50 border-slate-200 h-52 flex flex-col items-center justify-center text-sm text-slate-400">
                    <MapPin className="size-8 mb-1.5 opacity-40" />
                    <span>Ubicación no disponible</span>
                  </div>
                );
              }

              const isHibrido = event.tipo_actividad === "Híbrido";

              return (
                <div className="rounded-xl border bg-white border-slate-200/80 p-5 flex flex-col justify-between h-52 shadow-sm relative group hover:border-[#004B87]/40 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#004B87] font-semibold uppercase tracking-wider">
                      <MapPin className="size-4" /> {isHibrido ? "Ubicación Híbrida" : "Ubicación Física"}
                    </div>
                    <h4 className="font-bold text-lg text-slate-800 line-clamp-2">{bName}</h4>
                    <p className="text-xs text-muted-foreground">{event.centro_regional || "Ciudad Universitaria"}</p>
                  </div>

                  <div className="flex gap-2">
                    {bLink && (
                      <Button
                        type="button"
                        className="flex-1 gap-1.5 h-11 text-white shadow-sm transition hover:scale-[1.01] font-semibold text-xs"
                        style={{ backgroundColor: "#004B87" }}
                        onClick={() => window.open(bLink, "_blank")}
                      >
                        <Share2 className="size-4" /> Google Maps
                      </Button>
                    )}
                    {isHibrido && event.enlace_virtual && (
                      <Button
                        type="button"
                        className="flex-1 gap-1.5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition hover:scale-[1.01] font-semibold text-xs"
                        onClick={() => window.open(event.enlace_virtual, "_blank")}
                      >
                        <Eye className="size-4" /> Enlace Virtual
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Galería de imágenes adicionales */}
      {event.imagenes_adicionales && event.imagenes_adicionales.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-[#003366] uppercase tracking-wider flex items-center gap-2">
            <Camera className="size-4 text-[#004B87]" /> Imágenes Adicionales del Evento
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
            {event.imagenes_adicionales.map((img: string, idx: number) => (
              <div key={idx} className="relative size-32 rounded-xl overflow-hidden border shrink-0 group hover:border-[#004B87]/50 transition shadow-sm cursor-zoom-in" onClick={() => setActiveLightboxImg(img)}>
                <img src={img} alt={`Imagen ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stepper Timeline */}
      {event.tipo_evento === "HORAS_VOAE" && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between relative max-w-3xl mx-auto">
            {/* Connector Line behind steps */}
            <div className="absolute left-6 right-6 top-4 h-[2px] bg-slate-200 -z-0" />
            {steps.map((step, idx) => (
              <TimelineStep key={idx} label={step.label} isCompleted={step.isCompleted} isActive={step.isActive} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs list (Control de asistencia, Participantes, Detalle) */}
      <Tabs defaultValue="control" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="control">Control de Asistencia</TabsTrigger>
          <TabsTrigger value="participantes">Participantes ({students.length})</TabsTrigger>
          <TabsTrigger value="detalle">Detalle del Evento</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          {["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA", "FINALIZADO"].includes(event.estado) ? (
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 pb-3">
                <CardTitle className="text-[#003366] text-base font-bold">Paneles de Códigos QR de Asistencia</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* QR de Inscripción (Entrada) */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div
                      className="size-36 shrink-0 rounded-2xl border bg-white flex items-center justify-center p-2.5 shadow-sm cursor-pointer"
                      onClick={() => isEntryActive && setEntryQrOpen(true)}
                    >
                      {isEntryActive ? (
                        <QRCodeCanvas id="entry-qr-canvas" value={entryQrValue} size={120} level="M" />
                      ) : (
                        <Lock className="size-10 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                        <QrCode className="size-4 text-[#004B87]" /> QR de Inscripción
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{entryQrText}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs font-semibold"
                        disabled={!isEntryActive}
                        onClick={() => downloadQrCode("entry-qr-canvas", "qr-entrada.png")}
                      >
                        <Download className="size-3.5" /> Descargar QR
                      </Button>
                    </div>
                  </div>

                  {/* QR de Finalización (Salida) */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div
                      className="size-36 shrink-0 rounded-2xl border bg-white flex items-center justify-center p-2.5 shadow-sm cursor-pointer"
                      onClick={() => isExitActive && setExitQrOpen(true)}
                    >
                      {isExitActive ? (
                        <QRCodeCanvas id="exit-qr-canvas" value={exitQrValue} size={120} level="M" />
                      ) : (
                        <Lock className="size-10 text-slate-400" />
                      )}
                    </div>
                    <div className="space-y-2 text-center sm:text-left flex-1">
                      <h4 className="font-bold text-sm text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" /> QR de Finalización
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{exitQrText}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 h-8 text-xs font-semibold"
                        disabled={!isExitActive}
                        onClick={() => downloadQrCode("exit-qr-canvas", "qr-salida.png")}
                      >
                        <Download className="size-3.5" /> Descargar QR
                      </Button>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-slate-200 bg-white">
              <CardContent className="py-12 text-center text-muted-foreground text-sm font-medium">
                {event.estado === "BORRADOR"
                  ? "Este evento aún es un borrador. Debes enviarlo a VOAE y esperar su aprobación para poder habilitar el control de asistencia."
                  : event.estado === "PENDIENTE_APROBACION"
                  ? "El evento está en revisión por VOAE. Una vez aprobado, podrás iniciar el control de asistencia."
                  : event.estado === "RECHAZADO"
                  ? "Este evento fue rechazado. Corrige los detalles para enviarlo a revisión de nuevo."
                  : "El evento ha finalizado y el control de asistencia ya no está activo."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participantes">
          <Tabs defaultValue="enrolled" className="space-y-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex-wrap gap-3">
              <TabsList className="bg-slate-100 p-1 rounded-xl">
                <TabsTrigger value="enrolled">Matriculados ({students.length})</TabsTrigger>
                <TabsTrigger value="attendance">Asistencias ({students.filter((s) => s.estado === "ASISTIDO").length})</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold text-xs"
                  onClick={markAllAttended}
                >
                  <CheckCircle2 className="size-3.5 text-[#004B87]" /> Marcar todos como asistidos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold text-xs"
                  onClick={triggerQrScanner}
                >
                  <Camera className="size-3.5 text-[#004B87]" /> Escanear QR del estudiante
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-semibold text-xs"
                  onClick={downloadPdfReport}
                >
                  <Download className="size-3.5 text-[#004B87]" /> Descargar lista PDF
                </Button>
              </div>
            </div>

            <TabsContent value="enrolled">
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                  {students.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">No hay estudiantes inscritos en este evento.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="font-semibold text-slate-700">Estudiante</TableHead>
                          <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                          <TableHead className="font-semibold text-slate-700">Email</TableHead>
                          <TableHead className="font-semibold text-slate-700">Inscripción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => (
                          <TableRow key={s.id} className="hover:bg-slate-50/50">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="size-8 rounded-full bg-[#004B87]/15 text-[#004B87] font-bold text-xs flex items-center justify-center">
                                  {s.estudiante_nombre?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800">{s.estudiante_nombre}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">{s.estudiante_cuenta}</TableCell>
                            <TableCell className="text-xs text-slate-500">{s.estudiante_cuenta}@unah.hn</TableCell>
                            <TableCell className="text-xs text-slate-500">{s.inscrito_at ? new Date(s.inscrito_at).toLocaleDateString() : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card className="shadow-sm border-slate-200">
                <CardContent className="p-0">
                  {students.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">No hay estudiantes registrados.</div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead className="font-semibold text-slate-700">Estudiante</TableHead>
                          <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                          <TableHead className="font-semibold text-slate-700">Hora de Llegada</TableHead>
                          <TableHead className="font-semibold text-slate-700">Hora de Salida</TableHead>
                          <TableHead className="text-center font-semibold text-slate-700">Certificado</TableHead>
                          <TableHead className="text-center font-semibold text-slate-700">Enviar</TableHead>
                          <TableHead className="text-center font-semibold text-slate-700">Auditar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => {
                          const isAssisted = s.estado === "ASISTIDO";
                          const isSigned = firmadasSet.has(s.estudiante_cuenta) || 
                            !!localStorage.getItem(`cert_signed_${event.id}_${s.estudiante_cuenta}`);
                          return (
                            <TableRow key={s.id} className="hover:bg-slate-50/50">
                              <TableCell>
                                <Checkbox
                                  checked={isAssisted}
                                  onCheckedChange={(checked) => toggleAttendance(s.id, checked === true)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className="size-8 rounded-full bg-[#004B87]/15 text-[#004B87] font-bold text-xs flex items-center justify-center">
                                    {s.estudiante_nombre?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-slate-800">{s.estudiante_nombre}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-slate-600">{s.estudiante_cuenta}</TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {isAssisted ? new Date(s.inscrito_at || Date.now()).toLocaleTimeString("es-HN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">
                                {isAssisted ? (
                                  event.estado === "FINALIZADO" ? (
                                    new Date(event.fecha_fin).toLocaleTimeString("es-HN", { hour: '2-digit', minute: '2-digit' })
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-100">
                                      Sin registrar salida
                                    </span>
                                  )
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={event.estado !== "FINALIZADO"}
                                  className="gap-1 text-xs h-7 px-2 border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5"
                                  onClick={() => {
                                    setPdfStudent(s);
                                    setShowSignatureModal(true);
                                  }}
                                >
                                  <FileText className="size-3.5" /> {isSigned ? "Firmado" : "Firmar"}
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="size-7 p-0 border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5"
                                  onClick={() => {
                                    toast.success(`Código de asistencia reenviado a ${s.estudiante_nombre} por correo`);
                                  }}
                                >
                                  <Mail className="size-3.5" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-xs h-7 px-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                                  onClick={() => {
                                    setAuditoriaStudent(s);
                                    setAuditoriaIndex(students.indexOf(s));
                                  }}
                                >
                                  <Eye className="size-3" /> Verificar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="detalle">
          <Card className="shadow-sm border-slate-200/80 bg-white">
            <CardHeader className="border-b border-slate-100 pb-3.5">
              <CardTitle className="text-base text-[#003366] font-bold">Ficha Técnica del Evento</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5 text-sm">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Título del evento</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{event.titulo}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Categorías / Ámbitos</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {event.distribucion_horas && event.distribucion_horas.length > 0 ? (
                      event.distribucion_horas.map((dh: any) => `${CATEGORY_LABEL[dh.categoria] || dh.categoria} (${dh.horas} hrs)`).join(", ")
                    ) : (
                      CATEGORY_LABEL[event.categoria] || event.categoria
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Tipo de evento</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {event.tipo_evento === "HORAS_VOAE" ? "🎓 Horas VOAE" : "🎉 Recreación"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Fecha y Hora</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {formatLocalEventTimeRange(event.fecha_inicio, event.fecha_fin)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Tipo de actividad</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{event.tipo_actividad || "Presencial"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Centro regional</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{event.centro_regional || "Ciudad Universitaria"}</span>
                </div>
                {event.tipo_actividad !== "Virtual" && (
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Ubicación / Lugar</span>
                    <span className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="size-4 text-[#004B87] shrink-0" />
                      {(() => {
                        const loc = event.lugar || event.ubicacion || "No especificado";
                        if (loc.includes("|")) {
                          const [bName, bLink] = loc.split("|");
                          return (
                            <a
                              href={bLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#004B87] hover:underline"
                            >
                              {bName}
                            </a>
                          );
                        }
                        return <span>{loc}</span>;
                      })()}
                    </span>
                  </div>
                )}
                {event.tipo_actividad !== "Presencial" && event.enlace_virtual && (
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Enlace de acceso</span>
                    <a
                      href={event.enlace_virtual}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#004B87] hover:underline mt-0.5 block truncate"
                    >
                      {event.enlace_virtual}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Cupo máximo</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{event.cupo_maximo || 50} estudiantes</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Audiencia</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {event.audiencia === "TODO_PUBLICO"
                      ? "Todo público"
                      : event.audiencia === "SOLO_ESTUDIANTES"
                        ? "Solo estudiantes"
                        : "Solo empleados"}
                  </span>
                </div>

                {event.duracion_horas > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Horas de duración</span>
                    <span className="font-semibold text-slate-800 mt-0.5 block">{event.duracion_horas} hrs ({event.tipo_duracion === "TOTALES" ? "totales" : "diarias"})</span>
                  </div>
                )}
                <div className="sm:col-span-2 md:col-span-3 border-t border-slate-100 pt-3">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block">Descripción del evento</span>
                  <p className="text-slate-700 leading-relaxed mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">{event.descripcion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          open={showSignatureModal}
          onCancel={() => setShowSignatureModal(false)}
          onConfirm={handleConfirmSignature}
        />
      )}

      {/* Direct publish confirmation modal */}
      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">¿Estás seguro de publicar este evento?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Al ser un evento de recreación (sin horas VOAE), no requiere revisión de VOAE y se publicará directamente como programado para los estudiantes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setPublishConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: "#004B87" }}
              onClick={handlePublishDirect}
            >
              Sí, publicar directamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to VOAE confirmation modal */}
      <Dialog open={sendVoaeConfirmOpen} onOpenChange={setSendVoaeConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">Confirmar envío a VOAE</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium mt-2">
              ¿Está seguro de que desea enviar este evento a VOAE para revisión? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="font-semibold" onClick={() => setSendVoaeConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white font-semibold"
              style={{ backgroundColor: "#004B87" }}
              onClick={async () => {
                await handleSendToVoae();
                setSendVoaeConfirmOpen(false);
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Entry Zoom Modal */}
      <Dialog open={entryQrOpen} onOpenChange={setEntryQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-slate-800 font-bold">QR de Inscripción</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Comparte este código para que más usuarios registren su entrada
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 justify-center">
            <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
              <QRCodeCanvas id="entry-qr-modal-canvas" value={entryQrValue} size={280} level="M" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 font-semibold"
              onClick={() => downloadQrCode("entry-qr-modal-canvas", "qr-entrada-grande.png")}
            >
              <Download className="size-4" /> Descargar Imagen QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Exit Zoom Modal */}
      <Dialog open={exitQrOpen} onOpenChange={setExitQrOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-slate-800 font-bold">QR de Finalización</DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              Comparte este código para que los asistentes registren su salida
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 justify-center">
            <div className="p-6 bg-white border-2 border-slate-200 rounded-3xl shadow-sm">
              <QRCodeCanvas id="exit-qr-modal-canvas" value={exitQrValue} size={280} level="M" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-1.5 font-semibold"
              onClick={() => downloadQrCode("exit-qr-modal-canvas", "qr-salida-grande.png")}
            >
              <Download className="size-4" /> Descargar Imagen QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auditoría Modal */}
      <Dialog
        open={auditoriaStudent !== null}
        onOpenChange={(v) => {
          if (!v) setAuditoriaStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {auditoriaStudent && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-4">
                <div
                  className="size-[80px] rounded-full grid place-items-center text-lg font-bold shrink-0 border-2"
                  style={{ borderColor: "#004B87", backgroundColor: "#004B8720", color: "#004B87" }}
                >
                  {auditoriaStudent.estudiante_nombre
                    ?.split(" ")
                    .map((p: string) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{auditoriaStudent.estudiante_nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {auditoriaStudent.estudiante_cuenta} · {auditoriaStudent.estudiante_carrera || "Carrera de Estudiante"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4" style={{ color: "#166534" }} />
                    <span className="text-sm font-semibold" style={{ color: "#166534" }}>
                      Entrada
                    </span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: "#166534" }}>
                    {auditoriaStudent.estado === "ASISTIDO"
                      ? new Date(auditoriaStudent.inscrito_at || Date.now()).toLocaleTimeString("es-HN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                  <div className="mt-2 rounded-lg p-2 text-xs bg-emerald-50 text-emerald-800">
                    <MapPin className="size-3 inline mr-1" />
                    Dentro del rango
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-4" style={{ color: "#1e40af" }} />
                    <span className="text-sm font-semibold" style={{ color: "#1e40af" }}>
                      Salida
                    </span>
                  </div>
                  <div className="text-lg font-bold" style={{ color: "#1e40af" }}>
                    {auditoriaStudent.estado === "ASISTIDO" && event.estado === "FINALIZADO"
                      ? new Date(event.fecha_fin).toLocaleTimeString("es-HN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </div>
                  <div className="mt-2 rounded-lg p-2 text-xs bg-blue-50 text-blue-800">
                    {auditoriaStudent.estado === "ASISTIDO" ? (
                      event.estado === "FINALIZADO" ? (
                        <>
                          <MapPin className="size-3 inline mr-1" />
                          Salida registrada
                        </>
                      ) : (
                        <span className="text-amber-800">Sin registrar salida</span>
                      )
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: "#f8f9fa", border: "1px solid #e2e8f0" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="size-4" style={{ color: "#64748b" }} />
                    <span className="text-sm font-semibold" style={{ color: "#334155" }}>
                      Ubicación
                    </span>
                  </div>
                  <div className="rounded-lg p-2 text-xs text-slate-600 bg-slate-100">
                    {event.lugar?.split("|")[0] || "Aula física"}
                  </div>
                  <div className="mt-2 text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                    ✓ Validado por GPS
                  </div>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <Button
                  className="w-full text-white gap-1.5"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={() => {
                    toggleAttendance(auditoriaStudent.id, true);
                    setAuditoriaStudent(null);
                  }}
                >
                  <CheckCircle2 className="size-4" /> Aprobar Asistencia
                </Button>
                <Button
                  className="w-full gap-1.5 text-white"
                  style={{ backgroundColor: "#ef4444" }}
                  onClick={() => {
                    toggleAttendance(auditoriaStudent.id, false);
                    setAuditoriaStudent(null);
                  }}
                >
                  <XCircle className="size-4" /> Rechazar Asistencia
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Modal */}
      <Dialog
        open={activeLightboxImg !== null}
        onOpenChange={(v) => {
          if (!v) setActiveLightboxImg(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl p-1 bg-slate-900 border-none shadow-none flex items-center justify-center rounded-2xl overflow-hidden">
          {activeLightboxImg && (
            <div className="relative max-h-[85vh] w-full flex items-center justify-center p-2">
              <img
                src={activeLightboxImg}
                alt="Vista ampliada"
                className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setActiveLightboxImg(null)}
                className="absolute top-4 right-4 size-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white font-bold transition hover:scale-105"
              >
                ✕
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
