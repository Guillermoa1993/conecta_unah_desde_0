import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { useRole } from "@/lib/role-context";
import {
  EVENTS,
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  getEventInscripciones,
  NOVEDADES,
  type UniEvent,
  type EventStatus,
} from "@/lib/mock-data";
import { eventRejectionReasons, eventQrTokens } from "@/lib/event-store";
import { CENTROS_REGIONALES } from "@/lib/mock-data";
import { LocationPicker } from "@/components/app/LocationPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

export const Route = createFileRoute("/_app/empleado/eventos")({
  component: GestionEventosPage,
});

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
}: {
  event: UniEvent;
  onDelete: (id: string) => void;
  onEdit: (event: UniEvent) => void;
}) {
  const inscritos = getEventInscripciones(event.id);
  const cupo = event.cupo_maximo || 1;
  const pct = Math.min(Math.round((inscritos / cupo) * 100), 100);
  const catColor = CATEGORY_PLACEHOLDER_COLORS[event.categoria] || "#64748b";
  const isConHoras = event.tipo_evento === "HORAS_VOAE";
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [shareQrOpen, setShareQrOpen] = useState(false);
  const navigate = useNavigate();

  const [localPortadaUrl, setLocalPortadaUrl] = useState<string | undefined>(event.portada_url);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusStyle = STATUS_BADGE[event.estado] || STATUS_BADGE.BORRADOR;

  const handlePublish = () => {
    const idx = EVENTS.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      if (event.tipo_evento === "RECREACION") {
        EVENTS[idx] = {
          ...EVENTS[idx],
          estado: "PROGRAMADO",
          updated_at: new Date().toISOString(),
        };
        toast.success("Evento publicado automáticamente");
      } else {
        EVENTS[idx] = {
          ...EVENTS[idx],
          estado: "PENDIENTE_APROBACION",
          updated_at: new Date().toISOString(),
        };
        toast.success("Evento enviado a VOAE para revisión");
      }
      setPublishConfirm(false);
      window.location.reload();
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
                {CATEGORY_LABEL[event.categoria]?.slice(0, 2).toUpperCase() || "EV"}
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
                  const url = URL.createObjectURL(file);
                  setLocalPortadaUrl(url);
                  const idx = EVENTS.findIndex((e) => e.id === event.id);
                  if (idx !== -1) EVENTS[idx] = { ...EVENTS[idx], portada_url: url };
                  toast.success("Imagen de portada actualizada");
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
            {event.lugar && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{event.lugar}</span>
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
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
                  <Link to="/empleado/events/$id" params={{ id: event.id }}>
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
                  <Send className="size-3.5" /> Confirmar
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
            {event.estado === "PROGRAMADO" && (
              <>
                <Button
                  size="sm"
                  className="gap-1 text-xs h-8 text-white shadow-sm"
                  style={{ backgroundColor: "#004B87" }}
                  onClick={() => navigate({ to: "/empleado/events/$id", params: { id: event.id } })}
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
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                <Link to="/empleado/events/$id" params={{ id: event.id }}>
                  <Eye className="size-3.5" /> Ver detalle
                </Link>
              </Button>
            )}
            {event.estado === "FINALIZADO" && (
              <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                <Link to="/empleado/events/$id" params={{ id: event.id }}>
                  <Eye className="size-3.5" /> Ver detalle
                </Link>
              </Button>
            )}
            {event.estado === "RECHAZADO" && (
              <>
                <Button asChild size="sm" variant="outline" className="gap-1 text-xs h-8">
                  <Link to="/empleado/events/$id" params={{ id: event.id }}>
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
              onClick={() => {
                const idx = EVENTS.findIndex((e) => e.id === event.id);
                if (idx !== -1) {
                  EVENTS.splice(idx, 1);
                  toast.success("Borrador eliminado");
                  window.location.reload();
                }
                setDeleteConfirm(false);
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
            <DialogTitle>¿Estás seguro de publicar este evento?</DialogTitle>
            <DialogDescription>
              {event.tipo_evento === "RECREACION"
                ? "El evento se publicará directamente como Activo."
                : "El evento se enviará a VOAE para su revisión."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPublishConfirm(false)}>
              Cancelar
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: "#004B87" }}
              onClick={handlePublish}
            >
              Sí, publicar
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

function GestionEventosPage() {
  const { user } = useRole();
  const [tab, setTab] = useState<Tab>("borradores");
  const [editingEvent, setEditingEvent] = useState<UniEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      try {
        const events = EVENTS.filter((e) => e.tutor_id === user.id);
        if (events.length === 0 && EVENTS.length > 0) {
          setError(false);
        }
        setLoading(false);
      } catch {
        setError(true);
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [user.id, tab]);

  const tutorEvents = useMemo(() => EVENTS.filter((e) => e.tutor_id === user.id), [user.id]);

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
    setLoading(true);
    setError(false);
    setTimeout(() => setLoading(false), 300);
  };

  if (editingEvent) {
    return <EditEventForm event={editingEvent} onClose={() => setEditingEvent(null)} />;
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
            <Link to="/empleado/create">
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
              <Link to="/empleado/create">
                <Plus className="size-4" /> Crear evento
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onDelete={() => {}} onEdit={handleEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

function EditEventForm({ event, onClose }: { event: UniEvent; onClose: () => void }) {
  const portadaFileRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [imgPortada, setImgPortada] = useState<string | null>(event.portada_url || null);
  const [saving, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const [form, setForm] = useState({
    titulo: event.titulo,
    descripcion: event.descripcion,
    categoria: event.categoria,
    tipo_evento: event.tipo_evento === "RECREACION" ? "SIN_HORAS" : "HORAS_VOAE",
    tipo_actividad: event.tipo_actividad || "Presencial",
    fecha_inicio: event.fecha_inicio.slice(0, 10),
    hora_inicio: event.hora_inicio || event.fecha_inicio.slice(11, 16),
    fecha_fin: event.fecha_fin.slice(0, 10),
    hora_fin: event.hora_fin || event.fecha_fin.slice(11, 16),
    lugar: event.lugar || "",
    enlace_virtual: event.enlace_virtual || "",
    cupo_maximo: String(event.cupo_maximo),
    duracion_horas: String(event.duracion_horas),
    centro_regional: event.centro_regional || "Ciudad Universitaria",
    entidad_organizadora: event.entidad_organizadora || "",
    requiere_inscripcion: event.requiere_inscripcion,
    usa_imagen_personalizada: event.usa_imagen_personalizada,
    audiencia: "TODO_PUBLICO",
    registro_entrada: true,
    registro_salida: true,
    tipo_duracion: (event.tipo_duracion as "TOTALES" | "DIARIAS") || "TOTALES",
    latitud: String(event.latitud ?? ""),
    longitud: String(event.longitud ?? ""),
  });

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const step1Complete =
    form.titulo.trim().length > 0 &&
    form.descripcion.trim().length > 0 &&
    form.descripcion.trim().split(/\s+/).length <= 100;
  const step2Complete = (() => {
    const fields: string[] = [
      "fecha_inicio",
      "hora_inicio",
      "fecha_fin",
      "hora_fin",
      "cupo_maximo",
      "duracion_horas",
    ];
    if (form.tipo_actividad !== "Virtual") fields.push("lugar");
    if (form.tipo_actividad !== "Presencial") fields.push("enlace_virtual");
    return fields.every((f) => {
      const v = (form as any)[f];
      return typeof v === "string" ? v.trim().length > 0 : v !== false;
    });
  })();

  const handleSave = () => {
    if (form.descripcion.trim().split(/\s+/).length > 100) {
      toast.error("La descripci\u00f3n no puede exceder 100 palabras");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (form.fecha_inicio && form.fecha_inicio < today) {
      toast.error("No puedes seleccionar una fecha pasada en Fecha inicio");
      return;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      toast.error("La fecha fin no puede ser anterior a la fecha inicio");
      return;
    }
    if (form.fecha_inicio === form.fecha_fin && form.hora_fin <= form.hora_inicio) {
      toast.error("La hora fin debe ser posterior a la hora inicio");
      return;
    }
    setSaving(true);
    const isRec = form.tipo_evento === "SIN_HORAS";
    const idx = EVENTS.findIndex((e) => e.id === event.id);
    if (idx !== -1) {
      (EVENTS as any)[idx] = {
        ...EVENTS[idx],
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoria: form.categoria,
        tipo_evento: isRec ? "RECREACION" : "HORAS_VOAE",
        tipo_actividad: form.tipo_actividad,
        fecha_inicio: form.fecha_inicio + "T" + form.hora_inicio + ":00",
        fecha_fin: form.fecha_fin + "T" + form.hora_fin + ":00",
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
        lugar: form.lugar,
        enlace_virtual: form.enlace_virtual,
        cupo_maximo: parseInt(form.cupo_maximo) || 0,
        duracion_horas: parseFloat(form.duracion_horas) || 0,
        tipo_duracion: form.tipo_duracion,
        centro_regional: form.centro_regional,
        entidad_organizadora: form.entidad_organizadora,
        requiere_inscripcion: form.requiere_inscripcion,
        portada_url: imgPortada || undefined,
        usa_imagen_personalizada: form.usa_imagen_personalizada,
        audiencia: form.audiencia,
        registro_entrada: form.registro_entrada,
        registro_salida: form.registro_salida,
        latitud: form.latitud ? parseFloat(form.latitud) : undefined,
        longitud: form.longitud ? parseFloat(form.longitud) : undefined,
        estado: event.estado as EventStatus,
        updated_at: new Date().toISOString(),
      };
    }
    setSaving(false);
    toast.success("Cambios guardados");
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pt-4 pb-3 px-4 md:pt-6 md:pb-4 md:px-6 lg:pt-8 lg:pb-5 lg:px-8">
        <div className="mx-auto" style={{ maxWidth: "1000px" }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (form.titulo !== event.titulo || imgPortada !== (event.portada_url || null)) {
                  setShowExitDialog(true);
                } else onClose();
              }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition shrink-0"
              aria-label="Volver"
            >
              <ChevronLeft className="size-5" />
            </button>
            {[
              { icon: FileText, label: "Información básica" },
              { icon: CalendarDays, label: "Fecha, lugar y capacidad" },
              { icon: ImagePlus, label: "Material visual" },
              { icon: CheckCircle2, label: "Revisión y publicación" },
            ].map((step, i) => (
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
                {i < 3 && (
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
        <div className="mx-auto h-full flex flex-col justify-center" style={{ maxWidth: "1000px" }}>
          {currentStep === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">
                  Título del evento <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                  value={form.titulo}
                  maxLength={40}
                  onChange={(e) => set("titulo", e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {form.titulo.length}/40
                </p>
              </div>
              <div>
                <label className="text-xs font-medium">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                  value={form.categoria}
                  onChange={(e) => set("categoria", e.target.value)}
                >
                  {(
                    Object.keys(CATEGORY_LABEL_LONG) as Array<keyof typeof CATEGORY_LABEL_LONG>
                  ).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL_LONG[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium">
                  Tipo de actividad <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                  value={form.tipo_actividad}
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
                  className="w-full rounded-lg border text-sm mt-1 p-3 resize-none"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => {
                    const val = e.target.value;
                    const words = val.trim() ? val.trim().split(/\s+/) : [];
                    if (words.length <= 100) set("descripcion", val);
                  }}
                  placeholder="Máximo 100 palabras"
                />
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">
                  {form.descripcion.trim() ? form.descripcion.trim().split(/\s+/).length : 0} / 100
                  palabras
                </p>
              </div>
              <div>
                <label className="text-xs font-medium">Entidad organizadora</label>
                <input
                  className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                  value={form.entidad_organizadora}
                  maxLength={50}
                  onChange={(e) => set("entidad_organizadora", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium">Tipo de evento</label>
                <select
                  className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                  value={form.tipo_evento}
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
                  value={form.centro_regional}
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
                  value={form.audiencia}
                  onChange={(e) => set("audiencia", e.target.value)}
                >
                  <option value="TODO_PUBLICO">Todo público</option>
                  <option value="SOLO_ESTUDIANTES">Solo estudiantes</option>
                  <option value="SOLO_EMPLEADOS">Solo empleados</option>
                </select>
              </div>
              <div className="flex gap-6 pt-1">
                {form.tipo_evento === "HORAS_VOAE" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.registro_entrada}
                        onChange={(e) => set("registro_entrada", e.target.checked)}
                      />
                      <span>Asistencia de entrada</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.registro_salida}
                        onChange={(e) => set("registro_salida", e.target.checked)}
                      />
                      <span>Asistencia de salida</span>
                    </label>
                  </>
                )}
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium">
                    Fecha inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.fecha_inicio}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set("fecha_inicio", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.hora_inicio}
                    onChange={(e) => set("hora_inicio", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    Fecha fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.fecha_fin}
                    min={form.fecha_inicio || new Date().toISOString().slice(0, 10)}
                    onChange={(e) => set("fecha_fin", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    Hora fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.hora_fin}
                    onChange={(e) => set("hora_fin", e.target.value)}
                  />
                </div>
              </div>
              {form.tipo_actividad !== "Virtual" && (
                <>
                  <div>
                    <label className="text-xs font-medium">
                      Ubicación física <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                      value={form.lugar}
                      onChange={(e) => set("lugar", e.target.value)}
                      placeholder="Salón, edificio, dirección..."
                    />
                  </div>
                  <LocationPicker
                    lat={form.latitud || ""}
                    lng={form.longitud || ""}
                    onLocationChange={(lat, lng) => {
                      set("latitud", lat);
                      set("longitud", lng);
                    }}
                  />
                </>
              )}
              {form.tipo_actividad !== "Presencial" && (
                <div>
                  <label className="text-xs font-medium">
                    Enlace virtual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.enlace_virtual}
                    onChange={(e) => set("enlace_virtual", e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium">
                    Cupo máximo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.cupo_maximo}
                    onChange={(e) => set("cupo_maximo", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    Duración (hrs) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.duracion_horas}
                    onChange={(e) => set("duracion_horas", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">
                    Tipo de duración <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border text-sm mt-1"
                    value={form.tipo_duracion}
                    onChange={(e) => set("tipo_duracion", e.target.value)}
                  >
                    <option value="TOTALES">Horas totales</option>
                    <option value="DIARIAS">Diarias</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.requiere_inscripcion}
                    onChange={(e) => set("requiere_inscripcion", e.target.checked)}
                  />
                  Requiere inscripción previa
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.usa_imagen_personalizada}
                    onChange={(e) => set("usa_imagen_personalizada", e.target.checked)}
                  />
                  Usar imagen personalizada
                </label>
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.usa_imagen_personalizada}
                    onChange={(e) => set("usa_imagen_personalizada", e.target.checked)}
                  />
                  Deseas agregar una imagen de portada?
                </label>
              </div>
              {form.usa_imagen_personalizada && (
                <div>
                  <input
                    ref={portadaFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                        toast.error("Formato no válido");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Archivo muy grande");
                        return;
                      }
                      setImgPortada(URL.createObjectURL(file));
                    }}
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
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG o WEBP · Máximo 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!form.usa_imagen_personalizada && (
                <div className="rounded-lg border bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Se usará un placeholder automático según la categoría del evento.
                  </p>
                </div>
              )}
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Información básica
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Título:</span> {form.titulo}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoría:</span> {form.categoria}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span> {form.tipo_actividad}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entidad:</span>{" "}
                    {form.entidad_organizadora || "—"}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha y lugar
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Inicio:</span> {form.fecha_inicio}{" "}
                    {form.hora_inicio}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fin:</span> {form.fecha_fin}{" "}
                    {form.hora_fin}
                  </div>
                  {form.lugar && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Ubicación:</span> {form.lugar}
                    </div>
                  )}
                  {form.enlace_virtual && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Enlace:</span> {form.enlace_virtual}
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
                    <span className="text-muted-foreground">Cupo:</span> {form.cupo_maximo}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duración:</span> {form.duracion_horas}h
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inscripción:</span>{" "}
                    {form.requiere_inscripcion ? "Sí" : "No"}
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Los cambios se guardarán manteniendo el estado actual del evento.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-3 md:px-6 md:py-4 lg:px-8">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1000px" }}>
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
                className="gap-1.5"
              >
                <ChevronLeft className="size-4" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(s + 1, 4))}
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
                  onClick={onClose}
                  disabled={saving}
                  style={{ borderColor: "#9ca3af", color: "#9ca3af" }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="gap-1.5 text-white"
                  style={{ backgroundColor: "#22c55e" }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Check className="size-4" /> Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Salir sin guardar?</DialogTitle>
            <DialogDescription>
              Los cambios realizados se perderán si sales sin guardar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setShowExitDialog(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              style={{ backgroundColor: "#ef4444" }}
              className="text-white"
              onClick={() => {
                setShowExitDialog(false);
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
