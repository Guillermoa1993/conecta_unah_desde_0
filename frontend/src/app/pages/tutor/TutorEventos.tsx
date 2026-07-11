import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { Link, useNavigate } from "react-router";
import { api } from "../../../services/api";
import {
  Pencil,
  Send,
  Trash2,
  Eye,
  Megaphone,
  Plus,
  AlertCircle,
  Clock,
  XCircle,
  Lock,
  Zap,
  Share2,
  FileText,
  Download,
  CalendarDays,
  MapPin,
  Camera,
  CheckCircle2,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useRole } from "../../../lib/role-context";
import {
  EVENTS,
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  getEventInscripciones,
  NOVEDADES,
  type UniEvent,
  type EventStatus,
} from "../../../lib/mock-data";
import { eventRejectionReasons, eventQrTokens } from "../../../lib/event-store";
import { CENTROS_REGIONALES } from "../../../lib/mock-data";
import { EventForm } from "../../components/app/EventForm";
import { LocationPicker } from "../../components/app/LocationPicker";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { cn } from "../../../lib/utils";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";



type Tab = "borradores" | "programados" | "pendientes" | "finalizados" | "rechazados";

interface TabConfig {
  key: Tab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeColor: string;
  estados: EventStatus[];
}

const TABS: TabConfig[] = [
  {
    key: "borradores",
    label: "Borradores",
    icon: Pencil,
    activeColor: "#9ca3af",
    estados: ["BORRADOR"],
  },
  {
    key: "programados",
    label: "Programados",
    icon: Zap,
    activeColor: "#22c55e",
    estados: ["PROGRAMADO", "EN_CURSO", "EN_CURSO_SALIDA"],
  },
  {
    key: "pendientes",
    label: "Pendientes de aprobación",
    icon: Clock,
    activeColor: "#f59e0b",
    estados: ["PENDIENTE_APROBACION"],
  },
  {
    key: "finalizados",
    label: "Finalizados",
    icon: Lock,
    activeColor: "#6b7280",
    estados: ["FINALIZADO"],
  },
  {
    key: "rechazados",
    label: "Rechazados",
    icon: XCircle,
    activeColor: "#ef4444",
    estados: ["RECHAZADO"],
  },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  BORRADOR: { bg: "#f1f5f9", text: "#64748b", label: "Borrador" },
  PROGRAMADO: { bg: "#dbeafe", text: "#1e40af", label: "Programado" },
  EN_CURSO: { bg: "#dcfce7", text: "#166534", label: "En curso" },
  EN_CURSO_SALIDA: { bg: "#dcfce7", text: "#166534", label: "En curso (salida)" },
  PENDIENTE_APROBACION: { bg: "#fef3c7", text: "#92400e", label: "Pendiente de aprobación" },
  FINALIZADO: { bg: "#f1f5f9", text: "#64748b", label: "Finalizado" },
  RECHAZADO: { bg: "#fee2e2", text: "#991b1b", label: "Rechazado" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })
  );
}

const CATEGORY_PLACEHOLDER_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

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
  const inscritos = event.inscritos_count !== undefined ? event.inscritos_count : getEventInscripciones(event.id);
  const cupo = event.cupo_maximo || 1;
  const pct = Math.min(Math.round((inscritos / cupo) * 100), 100);
  const catColor = (CATEGORY_PLACEHOLDER_COLORS as any)[event.categoria] || "#64748b";
  const isConHoras = event.tipo_evento === "HORAS_VOAE";
  const isRecreacion = event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS" || parseFloat(event.duracion_horas || "0") === 0;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [shareQrOpen, setShareQrOpen] = useState(false);
  const [cancelVoaeConfirm, setCancelVoaeConfirm] = useState(false);
  const navigate = useNavigate();

  const [localPortadaUrl, setLocalPortadaUrl] = useState<string | undefined>(event.portada_url || event.imagen_url);
  useEffect(() => {
    setLocalPortadaUrl(event.portada_url || event.imagen_url);
  }, [event.portada_url, event.imagen_url]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusStyle = STATUS_BADGE[event.estado] || STATUS_BADGE.BORRADOR;

  const handlePublish = async () => {
    try {
      const isRecreacion = event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS" || parseFloat(event.duracion_horas || "0") === 0;
      const newEstado = isRecreacion ? "PROGRAMADO" : "PENDIENTE_APROBACION";
      const payload = {
        ...event,
        estado: newEstado
      };
      await api.put(`/eventos/${event.id_evento || event.id}`, payload);
      toast.success(
        isRecreacion
          ? "¡Evento publicado automáticamente!"
          : "¡Evento enviado a VOAE para revisión!"
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
        estado: "BORRADOR"
      };
      await api.put(`/eventos/${event.id_evento || event.id}`, payload);
      toast.success("Solicitud de aprobación cancelada. El evento ha vuelto a Borradores.");
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
      <div className="rounded-xl border bg-card shadow-soft overflow-hidden flex flex-col">
        {/* Portada / Placeholder */}
        <div className="relative h-40 group">
          {localPortadaUrl ? (
            <img src={localPortadaUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ backgroundColor: catColor + "20" }}
            >
              <span className="text-3xl font-bold text-white opacity-60">
                {(CATEGORY_LABEL as any)[event.categoria]?.slice(0, 2).toUpperCase() || "EV"}
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
                    const base64Img = reader.result as string;
                    try {
                      const idToUpdate = event.id_evento || event.id;
                      await api.put(`/eventos/${idToUpdate}`, {
                        ...event,
                        portada_url: base64Img,
                      });
                      setLocalPortadaUrl(base64Img);
                      toast.success("Imagen de portada actualizada y guardada con éxito.");
                      onRefresh();
                    } catch (err: any) {
                      toast.error("Error al guardar la portada", { description: err.message });
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer"
                aria-label="Cambiar imagen de portada"
              >
                <div className="size-9 rounded-full bg-white/90 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                  <Camera className="size-4" style={{ color: "var(--puma-dark, #1e3a5f)" }} />
                </div>
              </button>
            </>
          )}
          <span
            className="absolute top-3 right-3 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
          >
            {statusStyle.label}
          </span>
        </div>
        {/* Info */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-snug">
              <span className="truncate inline-block max-w-[calc(100%-4.5rem)] align-middle">
                {event.titulo}
              </span>
              {event.tipo_actividad === "Virtual" && (
                <span
                  className="ml-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 align-middle"
                  style={{ backgroundColor: "#dbeafe", color: "#1e40af" }}
                >
                  Virtual
                </span>
              )}
              {event.tipo_actividad === "Híbrido" && (
                <span
                  className="ml-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 align-middle"
                  style={{ backgroundColor: "#ede9fe", color: "#7c3aed" }}
                >
                  Híbrido
                </span>
              )}
            </h3>
          </div>
          {/* Date, time, location */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              <span>{eventDateDisplay}</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-medium text-muted-foreground/70">
                {event.tipo_actividad || "Presencial"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock className="size-3.5 shrink-0" />
              <span>
                {event.fecha_inicio.slice(11, 16)} — {event.fecha_fin.slice(11, 16)}
              </span>
            </div>
            {/* Ubicación Física */}
            {event.tipo_actividad !== "Virtual" && (() => {
              const loc = event.ubicacion || event.lugar;
              if (!loc) return null;
              if (loc.includes("|")) {
                const [bName, bLink] = loc.split("|");
                return (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 text-[#004B87]" />
                    <a
                      href={bLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#004B87] hover:underline font-semibold truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {bName}
                    </a>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{loc}</span>
                </div>
              );
            })()}

            {/* Acceso a Reunión Virtual */}
            {event.tipo_actividad !== "Presencial" && event.enlace_virtual && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Eye className="size-3.5 shrink-0 text-emerald-600" />
                <a
                  href={event.enlace_virtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline font-semibold truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ir a reunión virtual
                </a>
              </div>
            )}
          </div>
          {/* Type badge */}
          <div>
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full inline-block"
              style={{
                backgroundColor: isConHoras ? "#dbeafe" : "#f1f5f9",
                color: isConHoras ? "#1e40af" : "#64748b",
              }}
            >
              {isConHoras ? "\uD83C\uDF93 Horas VOAE" : "\uD83C\uDF89 Recreación"}
            </span>
          </div>
          {/* Capacity bar */}
          {cupo > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: pct + "%",
                    backgroundColor: catColor,
                  }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {inscritos} / {cupo} cupos
              </p>
            </div>
          )}
          {/* Rejection banner — only for RECHAZADO, before actions */}
          {event.estado === "RECHAZADO" &&
            (event.motivo_rechazo || eventRejectionReasons[event.id]) && (
              <div
                className="rounded-md p-2.5 text-[11px] leading-snug"
                style={{
                  backgroundColor: "#fef3c7",
                  borderLeft: "3px solid #f59e0b",
                  color: "#92400e",
                }}
              >
                {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").length > 80 ? (
                  <>
                    {(event.motivo_rechazo || eventRejectionReasons[event.id] || "").slice(0, 80)}
                    ...{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRejectModal(true);
                      }}
                      className="underline font-medium"
                      style={{ color: "#92400e" }}
                    >
                      Ver motivo completo
                    </button>
                  </>
                ) : (
                  event.motivo_rechazo || eventRejectionReasons[event.id] || ""
                )}
              </div>
            )}
          {/* Actions */}
          <div className="flex items-center gap-2 mt-auto pt-1 flex-wrap">
            {event.estado === "BORRADOR" && (
              <>
                <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3.5" /> Ver detalle
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8"
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3.5" /> Editar
                </Button>
                 <Button
                  size="sm"
                  className="gap-1 text-xs h-8 text-white shadow-sm"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => setPublishConfirm(true)}
                >
                  {isRecreacion ? (
                    <>
                      <Megaphone className="size-3.5" /> Publicar
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" /> Enviar
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs h-8 text-red-500 hover:text-red-700"
                  onClick={() => setDeleteConfirm(true)}
                >
                  <Trash2 className="size-3.5" /> Descartar
                </Button>
              </>
            )}
            {(event.estado === "PROGRAMADO" || event.estado === "EN_CURSO" || event.estado === "EN_CURSO_SALIDA") && (
              <>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 text-white shadow-sm"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => navigate(`/tutor/event/${event.id_evento || event.id}`)}
                >
                  <Eye className="size-3.5" /> Gestionar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8"
                  style={{ borderColor: "#004B87", color: "#004B87" }}
                  onClick={() => setShareQrOpen(true)}
                >
                  <Share2 className="size-3.5" /> Compartir
                </Button>
              </>
            )}
             {event.estado === "PENDIENTE_APROBACION" && (
               <>
                 <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                   <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                     <Eye className="size-3.5" /> Ver detalle
                   </Link>
                 </Button>
                 <Button
                   size="sm"
                   variant="ghost"
                   className="gap-1 text-xs h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                   onClick={() => setCancelVoaeConfirm(true)}
                 >
                   <XCircle className="size-3.5" /> Cancelar solicitud
                 </Button>
               </>
             )}
            {event.estado === "FINALIZADO" && (
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                  <Eye className="size-3.5" /> Ver detalle
                </Link>
              </Button>
            )}
            {event.estado === "RECHAZADO" && (
              <>
                <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                  <Link to={`/tutor/event/${event.id_evento || event.id}`}>
                    <Eye className="size-3.5" /> Ver detalle
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs h-8"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => setRejectModal(true)}
                >
                  <AlertCircle className="size-3.5" /> Ver motivo
                </Button>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 text-white shadow-sm"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onClick={() => onEdit(event)}
                >
                  <Pencil className="size-3.5" /> Editar y reenviar
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
            <DialogTitle>Eliminar borrador?</DialogTitle>
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

      {/* Publish confirm modal */}
      <Dialog open={publishConfirm} onOpenChange={setPublishConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">
              {event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS"
                ? "Confirmar publicación"
                : "Confirmar envío a VOAE"}
            </DialogTitle>
            <DialogDescription className="text-sm mt-2 text-slate-500 font-medium">
              {event.tipo_evento === "RECREACION" || event.tipo_evento === "SIN_HORAS"
                ? "¿Está seguro de que desea publicar este evento? Esta acción hará el evento visible inmediatamente."
                : "¿Está seguro de que desea enviar este evento a VOAE para revisión? Esta acción no se puede deshacer."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="font-semibold" onClick={() => setPublishConfirm(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white font-semibold"
              style={{ backgroundColor: "#004B87" }}
              onClick={handlePublish}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel VOAE Request Confirmation Modal */}
      <Dialog open={cancelVoaeConfirm} onOpenChange={setCancelVoaeConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">¿Seguro de cancelar la solicitud?</DialogTitle>
            <DialogDescription className="text-sm mt-2 text-slate-500 font-medium">
              Esta acción retirará el evento de la revisión de VOAE y lo devolverá a tus borradores para que puedas editarlo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button variant="outline" className="font-semibold cursor-pointer" onClick={() => setCancelVoaeConfirm(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white font-semibold cursor-pointer"
              style={{ backgroundColor: "#d97706" }}
              onClick={handleCancelRequest}
            >
              Sí, cancelar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share QR modal (Activos) */}
      <Dialog open={shareQrOpen} onOpenChange={setShareQrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Comparte este código QR</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="size-64 rounded-xl border-2 p-3 grid place-items-center"
              style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
            >
              {eventQrTokens[event.id]?.qrUrl ? (
                <QRCodeCanvas value={eventQrTokens[event.id].qrUrl} size={230} level="M" />
              ) : (
                <div className="text-sm text-muted-foreground">QR no disponible</div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Los asistentes pueden escanear este código para inscribirse al evento.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShareQrOpen(false)}>
              Cerrar
            </Button>
            <Button
              className="text-white gap-1.5"
              style={{ backgroundColor: "#004B87" }}
              onClick={() => {
                const canvas = document.querySelector(".size-64 canvas") as HTMLCanvasElement;
                if (canvas) {
                  const link = document.createElement("a");
                  link.download = `qr-${event.id}.png`;
                  link.href = canvas.toDataURL("image/png");
                  link.click();
                  toast.success("QR descargado");
                } else {
                  toast.error("Error al descargar el QR");
                }
              }}
            >
              <Download className="size-4" /> Descargar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject reason modal */}
      <Dialog open={rejectModal} onOpenChange={setRejectModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de rechazo</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700 leading-relaxed">
            {event.motivo_rechazo ||
              eventRejectionReasons[event.id] ||
              "El VOAE no especificó un motivo."}
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
      width="72"
      height="72"
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
      <rect x="10" y="14" width="52" height="13" rx="6" fill="#004B87" fillOpacity="0.15" />
      <rect x="10" y="20" width="52" height="7" fill="#004B87" fillOpacity="0.15" />
      <rect x="18" y="33" width="10" height="8" rx="2" fill="#004B87" fillOpacity="0.6" />
      <rect x="30" y="33" width="10" height="8" rx="2" fill="#004B87" fillOpacity="0.3" />
      <rect x="42" y="33" width="10" height="8" rx="2" fill="#004B87" fillOpacity="0.3" />
      <rect x="18" y="43" width="10" height="8" rx="2" fill="#FFD100" fillOpacity="0.9" />
      <rect x="30" y="43" width="10" height="8" rx="2" fill="#004B87" fillOpacity="0.3" />
      <rect x="42" y="43" width="10" height="8" rx="2" fill="#004B87" fillOpacity="0.3" />
      <path d="M22 11 C22 7, 50 7, 50 11" stroke="#004B87" strokeWidth="1.5" fill="none" />
      <circle cx="62" cy="10" r="7" fill="#FFD100" fillOpacity="0.9" />
      <path
        d="M60 10 L62 12 L66 8"
        stroke="#004B87"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TutorEventos() {
  const { user } = useRole();
  const [tab, setTab] = useState<Tab>("borradores");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get<any[]>('/eventos/mis-eventos');
      setEvents(data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user.id]);

  const tutorEvents = events;

  const currentTab = TABS.find((t) => t.key === tab)!;
  const filteredEvents = useMemo(
    () => tutorEvents.filter((e) => currentTab.estados.includes(e.estado)),
    [tutorEvents, currentTab],
  );

  const counts = useMemo(() => {
    const c: Record<Tab, number> = {
      borradores: 0,
      programados: 0,
      pendientes: 0,
      finalizados: 0,
      rechazados: 0,
    };
    tutorEvents.forEach((e) => {
      for (const t of TABS) {
        if (t.estados.includes(e.estado)) {
          c[t.key]++;
          break;
        }
      }
    });
    return c;
  }, [tutorEvents]);

  const handleEdit = (ev: UniEvent) => {
    setEditingEvent(ev);
  };
  const handleRetry = () => {
    fetchEvents();
  };

  if (editingEvent) {
    return <EventForm initialEvent={editingEvent} onClose={() => setEditingEvent(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header card */}
      <div className="rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <CalendarIllustration />
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "#004B87" }}>
                Gestión de eventos
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gestiona y da seguimiento a tus eventos.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="gap-1.5 text-white shadow-md shrink-0"
            style={{ backgroundColor: "#004B87" }}
          >
            <Link to="/tutor/create-event">
              <Plus className="size-4" /> Crear evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto bg-white rounded-t-lg">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px shrink-0 whitespace-nowrap",
                isActive
                  ? "border-current"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
              style={isActive ? { color: t.activeColor, borderColor: t.activeColor } : {}}
            >
              <Icon className="size-4" />
              {t.label}
              {count > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? t.activeColor + "20" : "#f1f5f9",
                    color: isActive ? t.activeColor : "#64748b",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-2 bg-gray-200 rounded w-full mt-2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-8 bg-gray-200 rounded w-16" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
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
        <div className="py-24 text-center">
          <div className="size-16 mx-auto rounded-full bg-gray-100 grid place-items-center mb-4">
            <currentTab.icon className="size-8 text-muted-foreground/40" />
          </div>
          <p className="text-base text-muted-foreground font-medium">
            {tab === "borradores"
              ? "Aún no tienes borradores"
              : tab === "programados"
                ? "No hay eventos programados"
                : tab === "pendientes"
                  ? "No hay eventos pendientes"
                  : tab === "finalizados"
                    ? "No hay eventos finalizados"
                    : "No hay eventos rechazados"}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {tab === "borradores"
              ? "Crea un nuevo evento para empezar."
              : tab === "programados"
                ? "Los eventos programados aparecerán aquí."
                : tab === "pendientes"
                  ? "Los eventos enviados a VOAE aparecerán aquí."
                  : tab === "finalizados"
                    ? "Los eventos finalizados aparecerán aquí."
                    : "Los eventos rechazados por VOAE aparecerán aquí."}
          </p>
          {tab === "borradores" && (
            <Button
              asChild
              className="mt-6 gap-1.5 text-white shadow-md"
              style={{ backgroundColor: "#004B87" }}
            >
              <Link to="/tutor/create-event">
                <Plus className="size-4" /> Crear evento
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id || event.id_evento} event={event} onDelete={() => {}} onEdit={handleEdit} onRefresh={fetchEvents} />
          ))}
        </div>
      )}
    </div>
  );
}

