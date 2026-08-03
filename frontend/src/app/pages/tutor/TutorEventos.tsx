import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import {
  CalendarDays,
  Clock,
  MapPin,
  Pencil,
  Trash2,
  Send,
  Eye,
  AlertCircle,
  Zap,
  CheckCircle2,
  XCircle,
  Share2,
  Camera,
  Plus,
  Megaphone,
  QrCode,
  Copy,
  Download,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { EventForm } from "../../components/app/EventForm";
import { EventCoverBanner } from "../../components/app/EventCoverBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { cn } from "../../../lib/utils";

function ShareQrModal({
  isOpen,
  onClose,
  event,
}: {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}) {
  if (!isOpen) return null;
  const eventId = event?.id || "";
  const shareUrl = `${window.location.origin}/student/events?highlight=${eventId}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("¡Enlace del evento copiado al portapapeles!");
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `QR_${(event?.titulo || "Evento").replace(/\s+/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Descargando código QR...");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center space-y-4 rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[#004B87] text-lg font-bold flex items-center justify-center gap-2">
            <QrCode className="size-5 text-[#004B87]" /> Código QR del Evento
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            Escanea este código QR con la cámara del celular para acceder e inscribirte directamente en el evento.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200">
            <img
              src={qrImageUrl}
              alt="Código QR del Evento"
              className="size-48 object-contain"
            />
          </div>
          <div className="space-y-1 text-center px-4">
            <p className="text-sm font-bold text-slate-800">{event?.titulo}</p>
            {event?.lugar && (
              <p className="text-xs text-slate-500 font-semibold flex items-center justify-center gap-1">
                <MapPin className="size-3 text-[#004B87]" /> {event.lugar}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            className="text-xs font-semibold gap-1.5 border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5"
            onClick={handleCopyLink}
          >
            <Copy className="size-3.5" /> Copiar Enlace
          </Button>
          <Button
            className="text-xs font-semibold gap-1.5 bg-[#004B87] hover:bg-[#003366] text-white"
            onClick={handleDownloadQr}
          >
            <Download className="size-3.5" /> Descargar QR
          </Button>
        </div>

        <DialogFooter className="pt-1">
          <Button variant="ghost" onClick={onClose} className="w-full text-xs font-semibold text-slate-500">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
  RECREACION: "Recreativo",
};

const CATEGORY_PLACEHOLDER_COLORS: Record<string, string> = {
  ACADEMICO: "#003366",
  CULTURAL: "#d97706",
  DEPORTIVO: "#059669",
  SOCIAL: "#7c3aed",
  RECREACION: "#8b5cf6",
};

const STATUS_BADGE: Record<
  string,
  { label: string; bg: string; text: string; color?: string }
> = {
  BORRADOR: {
    label: "Borrador",
    bg: "#f1f5f9",
    text: "#475569",
    color: "#64748b",
  },
  PENDIENTE_APROBACION_DEPTO: {
    label: "Pendiente Depto",
    bg: "#e0f2fe",
    text: "#0369a1",
    color: "#0284c7",
  },
  PENDIENTE_APROBACION_VOAE: {
    label: "Pendiente VOAE",
    bg: "#fef3c7",
    text: "#b45309",
    color: "#d97706",
  },
  PENDIENTE_APROBACION: {
    label: "Pendiente Aprobación",
    bg: "#fef3c7",
    text: "#b45309",
    color: "#d97706",
  },
  PROGRAMADO: {
    label: "Programado",
    bg: "#dcfce7",
    text: "#15803d",
    color: "#16a34a",
  },
  EN_CURSO: {
    label: "En Curso",
    bg: "#dbeafe",
    text: "#1d4ed8",
    color: "#2563eb",
  },
  EN_CURSO_SALIDA: {
    label: "En Curso (Salida)",
    bg: "#e0e7ff",
    text: "#4338ca",
    color: "#4f46e5",
  },
  FINALIZADO: {
    label: "Finalizado",
    bg: "#f3e8ff",
    text: "#6b21a8",
    color: "#9333ea",
  },
  RECHAZADO: {
    label: "Rechazado",
    bg: "#fee2e2",
    text: "#b91c1c",
    color: "#dc2626",
  },
};

const eventRejectionReasons: Record<string, string> = {
  "ev-rech-1":
    "La justificación del evento no cumple con los objetivos del Artículo 140 para el ámbito seleccionado.",
  "ev-rech-2":
    "Falta adjuntar el plan de trabajo detallado y la firma del coordinador académico.",
};

const mockInscripcionesCount: Record<string, number> = {
  "ev-1": 12,
  "ev-2": 5,
  "ev-3": 45,
  "ev-4": 8,
  "ev-5": 20,
  "ev-6": 15,
  "ev-rech-1": 0,
};

function getEventInscripciones(eventId: string): number {
  return mockInscripcionesCount[eventId] ?? 0;
}

function formatDate(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  return d.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${dateStr} ${timeStr}`;
}

type TabType =
  | "borradores"
  | "programados"
  | "pendientes_depto"
  | "pendientes_voae"
  | "finalizados"
  | "rechazados";

const TABS: {
  key: TabType;
  label: string;
  icon: any;
  activeColor: string;
}[] = [
  {
    key: "borradores",
    label: "Borradores",
    icon: Pencil,
    activeColor: "#64748b",
  },
  {
    key: "programados",
    label: "Programados",
    icon: Zap,
    activeColor: "#16a34a",
  },
  {
    key: "pendientes_depto",
    label: "Pendiente Depto",
    icon: Clock,
    activeColor: "#0284c7",
  },
  {
    key: "pendientes_voae",
    label: "Pendiente VOAE",
    icon: Clock,
    activeColor: "#d97706",
  },
  {
    key: "finalizados",
    label: "Finalizados",
    icon: CheckCircle2,
    activeColor: "#9333ea",
  },
  {
    key: "rechazados",
    label: "Rechazados",
    icon: XCircle,
    activeColor: "#dc2626",
  },
];

function EventCard({
  event,
  onDelete,
  onEdit,
  onRefresh,
}: {
  event: any;
  onDelete: (id: string) => void;
  onEdit: (event: any) => void;
  onRefresh: () => void;
}) {
  const inscritos =
    event.inscritos_count !== undefined
      ? event.inscritos_count
      : getEventInscripciones(event.id);
  const cupo = event.cupo_maximo || 1;
  const pct = Math.min(Math.round((inscritos / cupo) * 100), 100);
  const catColor =
    (CATEGORY_PLACEHOLDER_COLORS as any)[event.categoria] || "#64748b";
  const isConHoras = event.tipo_evento === "HORAS_VOAE";
  const isRecreacion =
    event.tipo_evento === "RECREACION" ||
    event.tipo_evento === "SIN_HORAS" ||
    parseFloat(event.duracion_horas || "0") === 0;

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [shareQrOpen, setShareQrOpen] = useState(false);
  const [cancelVoaeConfirm, setCancelVoaeConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const navigate = useNavigate();

  const [localPortadaUrl, setLocalPortadaUrl] = useState<string | undefined>(
    event.portada_url || event.imagen_url
  );
  useEffect(() => {
    setLocalPortadaUrl(event.portada_url || event.imagen_url);
  }, [event.portada_url, event.imagen_url]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusStyle = STATUS_BADGE[event.estado] || STATUS_BADGE.BORRADOR;

  const handlePublish = async () => {
    if (isPublishing) return;
    try {
      setIsPublishing(true);
      const payload = {
        ...event,
        estado: "PENDIENTE_APROBACION_DEPTO",
      };
      await api.put(`/eventos/${event.id_evento || event.id}`, payload);
      toast.success("¡Evento enviado a Coordinación de Departamento para revisión!");
      setPublishConfirm(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Error al enviar evento a Coordinación", { description: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (isCanceling) return;
    try {
      setIsCanceling(true);
      const payload = {
        ...event,
        estado: "BORRADOR",
      };
      await api.put(`/eventos/${event.id_evento || event.id}`, payload);
      toast.success("Solicitud cancelada. El evento ha vuelto a Borradores.");
      setCancelVoaeConfirm(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Error al cancelar la solicitud", { description: err.message });
    } finally {
      setIsCanceling(false);
    }
  };

  const eventDateDisplay = (() => {
    const start = new Date(event.fecha_inicio);
    const end = new Date(event.fecha_fin);
    if (start.toDateString() === end.toDateString()) {
      return formatDateTime(event.fecha_inicio);
    }
    return `Del ${formatDate(event.fecha_inicio)} al ${formatDate(event.fecha_fin)}`;
  })();

  return (
    <>
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden flex flex-col w-full min-w-0">
        {/* Portada del Evento Ilustrada Dinámica por Ámbito */}
        <div className="relative aspect-[4/3] sm:aspect-video h-48 sm:h-44 group w-full overflow-hidden">
          <EventCoverBanner event={{ ...event, portada_url: localPortadaUrl }} heightClass="h-full" showDetailsOverlay={false} />

          {/* Status badge overlay */}
          {event.estado === "BORRADOR" && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async () => {
                    const dataUrl = reader.result as string;
                    setLocalPortadaUrl(dataUrl);
                    try {
                      await api.put(`/eventos/${event.id_evento || event.id}`, {
                        ...event,
                        portada_url: dataUrl,
                        imagen_url: dataUrl,
                      });
                      toast.success("Portada del evento actualizada");
                      onRefresh();
                    } catch (err: any) {
                      toast.error("Error al actualizar la portada", {
                        description: err.message,
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition text-xs font-semibold"
              >
                <Camera className="size-4" /> Cambiar portada
              </button>
            </>
          )}

          <span
            className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="font-bold text-sm leading-snug truncate text-slate-800">
              {event.titulo}
            </h3>
          </div>

          {/* Date, time, location */}
          <div className="space-y-1 text-xs text-muted-foreground font-medium min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <CalendarDays className="size-3.5 shrink-0 text-slate-500" />
              <span className="truncate">{eventDateDisplay}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0 text-slate-500" />
              <span>
                {event.fecha_inicio.slice(11, 16)} — {event.fecha_fin.slice(11, 16)}
              </span>
            </div>
            {/* Ubicación Física */}
            {event.tipo_actividad !== "Virtual" && (event.lugar || event.ubicacion) && (
              <div className="flex items-center gap-1.5 text-[#004B87] font-semibold truncate">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{(event.lugar || event.ubicacion).split("|")[0]}</span>
              </div>
            )}
          </div>

          {/* Type badge */}
          <div>
            <span
              className="text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full inline-block truncate max-w-full"
              style={{
                backgroundColor: isConHoras ? "#dbeafe" : "#f1f5f9",
                color: isConHoras ? "#1e40af" : "#64748b",
              }}
            >
              {isConHoras ? (
                <>
                  🎓 Horas VOAE
                  {(() => {
                    const catMap = CATEGORY_LABEL as Record<string, string>;
                    const ambitos =
                      event.distribucion_horas &&
                      event.distribucion_horas.length > 0
                        ? event.distribucion_horas
                            .map((dh: any) => catMap[dh.categoria] || dh.categoria)
                            .join(" / ")
                        : catMap[event.categoria] || event.categoria;
                    return ambitos ? ` — ${ambitos}` : "";
                  })()}
                </>
              ) : (
                "🎉 Recreación"
              )}
            </span>
          </div>

          {/* Capacity bar */}
          {cupo > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: pct + "%",
                    backgroundColor: catColor,
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                {inscritos} / {cupo} cupos
              </p>
            </div>
          )}

          {/* Rejection banner */}
          {event.estado === "RECHAZADO" &&
            (event.motivo_rechazo || eventRejectionReasons[event.id]) && (
              <div
                className="rounded-md p-2 text-xs leading-snug mt-1"
                style={{
                  backgroundColor: "#fef3c7",
                  borderLeft: "3px solid #f59e0b",
                  color: "#92400e",
                }}
              >
                {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").length > 60 ? (
                  <>
                    {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").slice(0, 60)}...
                  </>
                ) : (
                  event.motivo_rechazo || eventRejectionReasons[event.id]
                )}
              </div>
            )}

          {/* Actions */}
          <div className="flex items-center gap-1.5 mt-auto pt-2 flex-wrap w-full">
            {event.estado === "BORRADOR" && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 flex-1 justify-center font-semibold"
                >
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3.5" /> Ver
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 flex-1 justify-center font-semibold"
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3.5" /> Editar
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 px-2.5 text-white shadow-xs flex-1 justify-center font-semibold"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => setPublishConfirm(true)}
                >
                  <Send className="size-3.5" /> Enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 flex-1 justify-center font-semibold"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="size-3.5" /> Descartar
                </Button>
              </>
            )}
            {(event.estado === "PROGRAMADO" ||
              event.estado === "EN_CURSO" ||
              event.estado === "EN_CURSO_SALIDA") && (
              <>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 px-2.5 text-white shadow-xs flex-1 justify-center font-semibold"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => navigate(`/tutor/event/${event.id_evento || event.id}`)}
                >
                  <Eye className="size-3.5" /> Gestionar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 flex-1 justify-center font-semibold"
                  style={{ borderColor: "#004B87", color: "#004B87" }}
                  onClick={() => setShareQrOpen(true)}
                >
                  <Share2 className="size-3.5" /> QR
                </Button>
              </>
            )}
            {(event.estado === "PENDIENTE_APROBACION" ||
              event.estado === "PENDIENTE_APROBACION_DEPTO" ||
              event.estado === "PENDIENTE_APROBACION_VOAE") && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 flex-1 justify-center font-semibold"
                >
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3.5" /> Detalle
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-300 flex-1 justify-center font-semibold"
                  onClick={() => setCancelVoaeConfirm(true)}
                >
                  <XCircle className="size-3.5" /> Cancelar solicitud
                </Button>
              </>
            )}
            {event.estado === "FINALIZADO" && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1 text-xs h-8 px-2.5 flex-1 justify-center font-semibold"
              >
                <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                  <Eye className="size-3.5" /> Detalle
                </Link>
              </Button>
            )}
            {event.estado === "RECHAZADO" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8 px-2.5 font-semibold"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => setRejectModal(true)}
                >
                  <AlertCircle className="size-3.5" /> Motivo
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 px-2.5 text-white shadow-xs font-semibold"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3.5" /> Reenviar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm modal */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Eliminar borrador?</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar este borrador? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" disabled={isDeleting} onClick={() => setDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              className="gap-1.5"
              onClick={async () => {
                if (isDeleting) return;
                try {
                  setIsDeleting(true);
                  await api.delete(`/eventos/${event.id_evento || event.id}`);
                  toast.success("Borrador eliminado");
                  setDeleteConfirm(false);
                  onRefresh();
                } catch (err: any) {
                  toast.error("Error al eliminar borrador", { description: err.message });
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting && <Loader2 className="size-4 animate-spin" />}
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel VOAE Request Confirm Modal */}
      <Dialog open={cancelVoaeConfirm} onOpenChange={setCancelVoaeConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-800 flex items-center gap-2">
              <AlertCircle className="size-5 text-amber-600" /> Cancelar solicitud de aprobación
            </DialogTitle>
            <DialogDescription>
              ¿Deseas cancelar la revisión de este evento? Volverá al estado de Borrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" disabled={isCanceling} onClick={() => setCancelVoaeConfirm(false)}>
              No, mantener solicitud
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5"
              disabled={isCanceling}
              onClick={handleCancelRequest}
            >
              {isCanceling && <Loader2 className="size-4 animate-spin" />}
              {isCanceling ? "Cancelando..." : "Sí, devolver a borrador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Coordinación Confirm Modal */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#004B87] font-bold">
              Confirmar envío a Coordinación
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium mt-2">
              ¿Está seguro de que desea enviar este evento a la Coordinación de Departamento para revisión? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="font-semibold" disabled={isPublishing} onClick={() => setPublishConfirm(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white font-bold gap-1.5"
              style={{ backgroundColor: "#004B87" }}
              disabled={isPublishing}
              onClick={handlePublish}
            >
              {isPublishing && <Loader2 className="size-4 animate-spin" />}
              {isPublishing ? "Enviando..." : "Confirmar envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share QR Modal */}
      <ShareQrModal
        isOpen={shareQrOpen}
        onClose={() => setShareQrOpen(false)}
        event={{
          id: event.id_evento || event.id,
          titulo: event.titulo,
          fecha: event.fecha_inicio,
          lugar: (event.lugar || event.ubicacion || "").split("|")[0],
          tipo_evento: event.tipo_evento,
          categoria: event.categoria,
          duracion_horas: event.duracion_horas,
        }}
      />

      {/* Reject reason modal */}
      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" /> Motivo de Rechazo
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200 font-medium">
            {event.motivo_rechazo ||
              eventRejectionReasons[event.id] ||
              "No se especificó un motivo de rechazo."}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CalendarIllustration() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 72 72"
      fill="none"
      className="shrink-0 hidden sm:block"
      aria-hidden="true"
    >
      <rect
        x="10"
        y="14"
        width="52"
        height="46"
        rx="6"
        fill="#004B87"
        fillOpacity="0.08"
        stroke="#004B87"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="14"
        width="52"
        height="14"
        rx="6"
        fill="#004B87"
        fillOpacity="0.15"
      />
      <circle cx="24" cy="21" r="2.5" fill="#004B87" />
      <circle cx="48" cy="21" r="2.5" fill="#004B87" />
      <rect x="18" y="34" width="8" height="6" rx="1.5" fill="#004B87" />
      <rect
        x="32"
        y="34"
        width="8"
        height="6"
        rx="1.5"
        fill="#004B87"
        fillOpacity="0.4"
      />
      <rect
        x="46"
        y="34"
        width="8"
        height="6"
        rx="1.5"
        fill="#004B87"
        fillOpacity="0.4"
      />
      <rect
        x="18"
        y="45"
        width="8"
        height="6"
        rx="1.5"
        fill="#004B87"
        fillOpacity="0.4"
      />
      <rect
        x="32"
        y="45"
        width="8"
        height="6"
        rx="1.5"
        fill="#004B87"
        fillOpacity="0.4"
      />
      <circle cx="50" cy="48" r="7" fill="#FFD100" />
      <path
        d="M47 48L49 50L53 46"
        stroke="#003366"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const AMBITO_OPTIONS = [
  { value: "", label: "Todos los Ámbitos", emoji: "🌐" },
  { value: "ACADEMICO", label: "Académico", emoji: "🎓" },
  { value: "CULTURAL", label: "Cultural", emoji: "🎭" },
  { value: "DEPORTIVO", label: "Deportivo", emoji: "⚽" },
  { value: "SOCIAL", label: "Social", emoji: "🤝" },
  { value: "RECREACION", label: "Recreativo", emoji: "🎪" },
];

const PAGE_SIZE_OPTIONS = [3, 6, 9, 12];

export function TutorEventos() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [tab, setTab] = useState<TabType>("borradores");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Busqueda y filtros
  const [search, setSearch] = useState("");
  const [ambitoFilter, setAmbitoFilter] = useState("");

  // Paginación inteligente
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get<any[]>("/eventos/mis-eventos");
      setAllEvents(data || []);
    } catch (err) {
      console.error("Error fetching tutor events:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Al cambiar de tab, se resetea la búsqueda, filtro y página
  const handleTabChange = (newTab: TabType) => {
    setTab(newTab);
    setSearch("");
    setAmbitoFilter("");
    setPage(1);
  };

  const counts: Record<TabType, number> = {
    borradores: allEvents.filter((e) => e.estado === "BORRADOR").length,
    programados: allEvents.filter((e) =>
      ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA"].includes(e.estado)
    ).length,
    pendientes_depto: allEvents.filter(
      (e) => e.estado === "PENDIENTE_APROBACION_DEPTO"
    ).length,
    pendientes_voae: allEvents.filter(
      (e) =>
        e.estado === "PENDIENTE_APROBACION_VOAE" ||
        e.estado === "PENDIENTE_APROBACION"
    ).length,
    finalizados: allEvents.filter((e) => e.estado === "FINALIZADO").length,
    rechazados: allEvents.filter((e) => e.estado === "RECHAZADO").length,
  };

  // Filtrado por tab + búsqueda + ámbito
  const filteredEvents = useMemo(() => {
    const byTab = allEvents.filter((e) => {
      if (tab === "borradores") return e.estado === "BORRADOR";
      if (tab === "programados")
        return ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA"].includes(e.estado);
      if (tab === "pendientes_depto")
        return e.estado === "PENDIENTE_APROBACION_DEPTO";
      if (tab === "pendientes_voae")
        return (
          e.estado === "PENDIENTE_APROBACION_VOAE" ||
          e.estado === "PENDIENTE_APROBACION"
        );
      if (tab === "finalizados") return e.estado === "FINALIZADO";
      if (tab === "rechazados") return e.estado === "RECHAZADO";
      return false;
    });

    const q = search.trim().toLowerCase();

    return byTab.filter((e) => {
      // Filtro por nombre
      const matchName = !q || (e.titulo || "").toLowerCase().includes(q);

      // Filtro por ámbito: chequea categoria principal o distribucion_horas
      let matchAmbito = true;
      if (ambitoFilter) {
        const mainCat = String(e.categoria || e.tipo_evento || "").toUpperCase();
        const distCats = Array.isArray(e.distribucion_horas)
          ? e.distribucion_horas.map((d: any) => String(d.categoria || "").toUpperCase())
          : [];
        matchAmbito =
          mainCat === ambitoFilter ||
          distCats.includes(ambitoFilter);
      }

      return matchName && matchAmbito;
    });
  }, [allEvents, tab, search, ambitoFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = filteredEvents.slice((page - 1) * pageSize, page * pageSize);

  // Resetear página si los filtros cambian
  useEffect(() => {
    setPage(1);
  }, [search, ambitoFilter, tab]);

  const handleEdit = (event: any) => {
    setEditingEvent(event);
  };

  const handleRetry = () => {
    fetchEvents();
  };

  if (editingEvent) {
    return (
      <EventForm
        initialEvent={editingEvent}
        onClose={() => setEditingEvent(null)}
      />
    );
  }

  const currentTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
      {/* Header card (Cuadro rojo de Imagen 228) */}
      <div className="rounded-xl bg-white shadow-xs p-4 sm:p-5 w-full min-w-0 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <CalendarIllustration />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#004B87]">
                Gestión de eventos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Gestiona y da seguimiento a tus eventos.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="gap-1.5 text-white shadow-xs w-full sm:w-auto flex justify-center text-center font-bold py-2.5 px-4"
            style={{ backgroundColor: "#004B87" }}
          >
            <Link to="/tutor/create-event">
              <Plus className="size-4" /> Crear propuesta de evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs bar en 2 filas de 3 botones para teléfonos (Cuadro verde de Imagen 228) */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 p-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs w-full min-w-0">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center text-center px-2 py-2 rounded-lg text-[11px] sm:text-sm font-semibold transition cursor-pointer min-w-0 leading-tight",
                isActive
                  ? "bg-[#004B87] text-white shadow-xs font-bold"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
              )}
            >
              <div className="flex items-center gap-1 truncate justify-center">
                <Icon className="size-3.5 sm:size-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </div>
              {count > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.2 rounded-full mt-0.5 sm:mt-0 sm:ml-1 shrink-0",
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Barra de Búsqueda + Filtro de Ámbito ── */}
      <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
        {/* Buscador por nombre */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento por nombre..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-[#004B87]/30 focus:border-[#004B87] transition placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Filtro por Ámbito */}
        <div className="relative min-w-[160px] sm:min-w-[180px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          <select
            value={ambitoFilter}
            onChange={(e) => setAmbitoFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-[#004B87]/30 focus:border-[#004B87] transition font-medium text-slate-700 appearance-none cursor-pointer"
          >
            {AMBITO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.emoji} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de tamaño de página */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold hidden sm:inline">Ver:</span>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => { setPageSize(size); setPage(1); }}
              className={cn(
                "text-[11px] font-black px-2 py-0.5 rounded-lg transition",
                pageSize === size
                  ? "bg-[#004B87] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Badge de resultados */}
      {(search || ambitoFilter) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">
            {filteredEvents.length === 0
              ? "Sin resultados"
              : `${filteredEvents.length} resultado${filteredEvents.length !== 1 ? "s" : ""}`}
          </span>
          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#004B87]/10 text-[#004B87] px-2.5 py-0.5 rounded-full">
              🔍 "{search}"
              <button onClick={() => setSearch("")}><X className="size-3" /></button>
            </span>
          )}
          {ambitoFilter && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full">
              {AMBITO_OPTIONS.find(o => o.value === ambitoFilter)?.emoji} {AMBITO_OPTIONS.find(o => o.value === ambitoFilter)?.label}
              <button onClick={() => setAmbitoFilter("")}><X className="size-3" /></button>
            </span>
          )}
        </div>
      )}

      {/* Content Grid (1 columna con tarjetas más cuadradas en móvil como cuadro celeste de Imagen 228) */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card overflow-hidden animate-pulse min-w-0"
            >
              <div className="h-48 sm:h-44 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-24 text-center">
          <div className="size-16 mx-auto rounded-full bg-red-50 grid place-items-center mb-4">
            <AlertCircle className="size-8 text-red-400" />
          </div>
          <p className="text-base text-muted-foreground font-medium">
            No se pudieron cargar tus eventos
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">Intenta de nuevo.</p>
          <Button variant="outline" className="mt-6" onClick={handleRetry}>
            Reintentar
          </Button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border p-8">
          <div className="size-16 mx-auto rounded-full bg-slate-100 grid place-items-center mb-4">
            <currentTab.icon className="size-8 text-slate-400" />
          </div>
          <p className="text-base text-slate-700 font-semibold">
            {tab === "borradores"
              ? "Aún no tienes borradores"
              : tab === "programados"
                ? "No hay eventos programados"
                : tab === "pendientes_depto"
                  ? "No hay eventos pendientes de aprobación en Coordinación"
                  : tab === "pendientes_voae"
                    ? "No hay eventos pendientes de aprobación en Dirección VOAE"
                    : tab === "finalizados"
                      ? "No hay eventos finalizados"
                      : "No hay eventos rechazados"}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {tab === "borradores"
              ? "Crea un nuevo evento para empezar."
              : "Los eventos de esta sección aparecerán aquí cuando estén disponibles."}
          </p>
          {tab === "borradores" && (
            <Button
              asChild
              className="mt-6 gap-1.5 text-white shadow-xs font-bold"
              style={{ backgroundColor: "#004B87" }}
            >
              <Link to="/tutor/create-event">
                <Plus className="size-4" /> Crear propuesta de evento
              </Link>
            </Button>
          )}
        </div>
      ) : filteredEvents.length === 0 && (search || ambitoFilter) ? (
        <div className="py-16 text-center bg-white rounded-xl border p-8">
          <div className="size-16 mx-auto rounded-full bg-slate-100 grid place-items-center mb-4">
            <Search className="size-8 text-slate-400" />
          </div>
          <p className="text-base text-slate-700 font-semibold">No se encontraron eventos</p>
          <p className="text-sm text-slate-500 mt-1">
            Intenta con otro nombre o ámbito.
          </p>
          <button
            onClick={() => { setSearch(""); setAmbitoFilter(""); }}
            className="mt-4 text-sm font-semibold text-[#004B87] hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0">
            {paginatedEvents.map((event) => (
              <EventCard
                key={event.id || event.id_evento}
                event={event}
                onDelete={() => {}}
                onEdit={handleEdit}
                onRefresh={fetchEvents}
              />
            ))}
          </div>

          {/* ── Paginación Inteligente (siempre visible) ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xs w-full min-w-0">
            {/* Info izquierda */}
            <span className="text-xs text-slate-500 font-semibold shrink-0 order-2 sm:order-1">
              <span className="hidden sm:inline">Mostrando </span>
              <span className="text-slate-800 font-black">{Math.min((page - 1) * pageSize + 1, filteredEvents.length)}–{Math.min(page * pageSize, filteredEvents.length)}</span>
              <span className="text-slate-500"> de </span>
              <span className="text-slate-800 font-black">{filteredEvents.length}</span>
              <span className="hidden sm:inline text-slate-500"> eventos</span>
            </span>

            {/* Controles de páginas */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
              {/* Botón Primera Página */}
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="hidden sm:flex size-8 items-center justify-center rounded-lg border text-xs font-black text-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                title="Primera página"
              >
                «
              </button>

              {/* Botón Anterior */}
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 h-8 rounded-lg border text-xs font-bold text-slate-700 transition disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 hover:border-slate-300"
                title="Página anterior"
              >
                <ChevronLeft className="size-3.5" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              {/* Números de página */}
              {totalPages > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="size-8 flex items-center justify-center text-xs text-slate-400">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={cn(
                        "size-8 flex items-center justify-center rounded-lg text-xs font-black transition border",
                        page === p
                          ? "bg-[#004B87] text-white border-[#004B87] shadow-sm"
                          : "text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {p}
                    </button>
                  )
                )}

              {/* Botón Siguiente */}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 h-8 rounded-lg border text-xs font-bold text-slate-700 transition disabled:opacity-35 disabled:cursor-not-allowed hover:bg-slate-100 hover:border-slate-300"
                title="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="size-3.5" />
              </button>

              {/* Botón Última Página */}
              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="hidden sm:flex size-8 items-center justify-center rounded-lg border text-xs font-black text-slate-600 transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100"
                title="Última página"
              >
                »
              </button>
            </div>

            {/* Página actual */}
            <span className="text-xs text-slate-500 font-semibold shrink-0 order-3">
              Pág. <span className="text-slate-800 font-black">{page}</span>/<span className="text-slate-800 font-black">{totalPages}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
