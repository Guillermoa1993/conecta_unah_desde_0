import { useState, useEffect, useRef } from "react";
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
  FileText,
  Zap,
  CheckCircle2,
  XCircle,
  Share2,
  Camera,
  Plus,
  Megaphone,
} from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { EventForm } from "../../components/app/EventForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { cn } from "../../../lib/utils";

function ShareQrModal({ isOpen, onClose, event }: { isOpen: boolean; onClose: () => void; event: any }) {
  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center space-y-4">
        <DialogHeader>
          <DialogTitle className="text-[#004B87] text-lg font-bold">Compartir Evento y Código QR</DialogTitle>
          <DialogDescription>Escanea este código para acceder e inscribirte en el evento.</DialogDescription>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center justify-center space-y-3 bg-slate-50 rounded-xl border">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + "/tutor/event/" + (event?.id || ""))}`}
            alt="QR Code"
            className="size-44 rounded-lg shadow-xs bg-white p-2 border"
          />
          <p className="text-xs font-bold text-slate-700">{event?.titulo}</p>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="w-full font-semibold">
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
    try {
      const isRec =
        event.tipo_evento === "RECREACION" ||
        event.tipo_evento === "SIN_HORAS" ||
        parseFloat(event.duracion_horas || "0") === 0;
      const newEstado = isRec ? "PROGRAMADO" : "PENDIENTE_APROBACION_DEPTO";
      const payload = {
        ...event,
        estado: newEstado,
      };
      await api.put(`/eventos/${event.id_evento || event.id}`, payload);
      toast.success(
        isRec
          ? "¡Evento publicado automáticamente!"
          : "¡Evento enviado a Coordinación de Departamento para revisión!"
      );
      setPublishConfirm(false);
      onRefresh();
    } catch (err: any) {
      toast.error("Error al publicar el evento", { description: err.message });
    }
  };

  const handleCancelRequest = async () => {
    try {
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
        {/* Portada compacta / cuadrada en móvil (como recuadros verdes de Imagen 226) */}
        <div className="relative h-28 sm:h-40 group">
          {localPortadaUrl ? (
            <img
              src={localPortadaUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ backgroundColor: catColor + "20" }}
            >
              <span className="text-xl sm:text-3xl font-bold text-white opacity-60">
                {(CATEGORY_LABEL as any)[event.categoria]
                  ?.slice(0, 2)
                  .toUpperCase() || "EV"}
              </span>
            </div>
          )}

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
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition text-xs font-semibold"
              >
                <Camera className="size-3.5" /> Cambiar
              </button>
            </>
          )}

          <span
            className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.label}
          </span>
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-4 flex-1 flex flex-col gap-1.5 sm:gap-2 min-w-0">
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm leading-snug truncate text-slate-800">
              {event.titulo}
            </h3>
          </div>

          {/* Date, time, location */}
          <div className="space-y-0.5 text-[10px] sm:text-xs text-muted-foreground font-medium min-w-0">
            <div className="flex items-center gap-1 truncate">
              <CalendarDays className="size-3 shrink-0 text-slate-500" />
              <span className="truncate">{eventDateDisplay}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3 shrink-0 text-slate-500" />
              <span>
                {event.fecha_inicio.slice(11, 16)} — {event.fecha_fin.slice(11, 16)}
              </span>
            </div>
            {/* Ubicación Física */}
            {event.tipo_actividad !== "Virtual" && (event.lugar || event.ubicacion) && (
              <div className="flex items-center gap-1 text-[#004B87] font-semibold truncate">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{(event.lugar || event.ubicacion).split("|")[0]}</span>
              </div>
            )}
          </div>

          {/* Type badge */}
          <div>
            <span
              className="text-[9px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full inline-block truncate max-w-full"
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
              <div className="h-1 sm:h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: pct + "%",
                    backgroundColor: catColor,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {inscritos} / {cupo} cupos
              </p>
            </div>
          )}

          {/* Rejection banner */}
          {event.estado === "RECHAZADO" &&
            (event.motivo_rechazo || eventRejectionReasons[event.id]) && (
              <div
                className="rounded-md p-1.5 text-[10px] leading-snug mt-1"
                style={{
                  backgroundColor: "#fef3c7",
                  borderLeft: "3px solid #f59e0b",
                  color: "#92400e",
                }}
              >
                {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").length > 50 ? (
                  <>
                    {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").slice(0, 50)}...
                  </>
                ) : (
                  event.motivo_rechazo || eventRejectionReasons[event.id]
                )}
              </div>
            )}

          {/* Actions */}
          <div className="flex items-center gap-1 mt-auto pt-1 flex-wrap">
            {event.estado === "BORRADOR" && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 flex-1 justify-center"
                >
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3" /> Ver
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 flex-1 justify-center"
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3" /> Editar
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 text-white shadow-xs flex-1 justify-center"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => setPublishConfirm(true)}
                >
                  {isRecreacion ? (
                    <>
                      <Megaphone className="size-3" /> Publicar
                    </>
                  ) : (
                    <>
                      <Send className="size-3" /> Enviar
                    </>
                  )}
                </Button>
              </>
            )}
            {(event.estado === "PROGRAMADO" ||
              event.estado === "EN_CURSO" ||
              event.estado === "EN_CURSO_SALIDA") && (
              <>
                <Button
                  size="sm"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 text-white shadow-xs flex-1 justify-center"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => navigate(`/tutor/event/${event.id_evento || event.id}`)}
                >
                  <Eye className="size-3" /> Gestionar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 flex-1 justify-center"
                  style={{ borderColor: "#004B87", color: "#004B87" }}
                  onClick={() => setShareQrOpen(true)}
                >
                  <Share2 className="size-3" /> QR
                </Button>
              </>
            )}
            {event.estado === "PENDIENTE_APROBACION" && (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 flex-1 justify-center"
                >
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3" /> Detalle
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 text-amber-600 hover:text-amber-700 flex-1 justify-center"
                  onClick={() => setCancelVoaeConfirm(true)}
                >
                  <XCircle className="size-3" /> Cancelar
                </Button>
              </>
            )}
            {event.estado === "FINALIZADO" && (
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 flex-1 justify-center"
              >
                <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                  <Eye className="size-3" /> Detalle
                </Link>
              </Button>
            )}
            {event.estado === "RECHAZADO" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => setRejectModal(true)}
                >
                  <AlertCircle className="size-3" /> Motivo
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-1.5 sm:px-2.5 text-white shadow-xs"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3" /> Reenviar
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
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await api.delete(`/eventos/${event.id_evento || event.id}`);
                  toast.success("Borrador eliminado");
                  setDeleteConfirm(false);
                  onRefresh();
                } catch (err: any) {
                  toast.error("Error al eliminar borrador", { description: err.message });
                }
              }}
            >
              Eliminar
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
            <Button variant="outline" onClick={() => setCancelVoaeConfirm(false)}>
              No, mantener solicitud
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              onClick={handleCancelRequest}
            >
              Sí, devolver a borrador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Confirm Modal */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#004B87]">
              {isRecreacion ? "Publicar evento recreativo" : "Enviar propuesta para revisión"}
            </DialogTitle>
            <DialogDescription>
              {isRecreacion
                ? "Este evento recreativo no requiere acreditación de horas VOAE y se publicará inmediatamente."
                : "Se enviará la propuesta a la Coordinación de Departamento para su revisión inicial."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPublishConfirm(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white font-bold"
              style={{ backgroundColor: "#004B87" }}
              onClick={handlePublish}
            >
              {isRecreacion ? "Confirmar publicación" : "Confirmar envío"}
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

export function TutorEventos() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [tab, setTab] = useState<TabType>("borradores");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get<any[]>("/eventos?limit=200");
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

  const filteredEvents = allEvents.filter((e) => {
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
      {/* Header card */}
      <div className="rounded-xl bg-white shadow-xs p-4 sm:p-5 w-full min-w-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <CalendarIllustration />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "#004B87" }}>
                Gestión de eventos
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Gestiona y da seguimiento a tus eventos.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="gap-1.5 text-white shadow-xs w-full sm:w-auto shrink-0 font-semibold"
            style={{ backgroundColor: "#004B87" }}
          >
            <Link to="/tutor/create-event">
              <Plus className="size-4" /> Crear evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs bar como botones pastilla responsivos (Círculo rojo de Imagen 226) */}
      <div className="w-full max-w-full overflow-x-auto bg-white rounded-xl border border-slate-200/80 p-1 flex items-center gap-1 shrink-0 scrollbar-none shadow-2xs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium transition rounded-lg shrink-0 whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-[#004B87] text-white font-bold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="size-3.5 sm:size-4" />
              <span>{t.label}</span>
              {count > 0 && (
                <span
                  className={cn(
                    "text-[10px] sm:text-[11px] font-bold px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-white/20 text-white"
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

      {/* Content Grid (2 columnas compactas en móvil como cuadraditos verdes de Imagen 226) */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 w-full min-w-0">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card overflow-hidden animate-pulse min-w-0"
            >
              <div className="h-28 sm:h-40 bg-gray-200" />
              <div className="p-2.5 sm:p-4 space-y-2">
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
                <Plus className="size-4" /> Crear evento
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 w-full min-w-0">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id || event.id_evento}
              event={event}
              onDelete={() => {}}
              onEdit={handleEdit}
              onRefresh={fetchEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
}
