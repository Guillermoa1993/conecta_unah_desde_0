import { useRef } from "react";
import { X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { eventQrData, eventQrTokens } from "@/lib/event-store";
import { toast } from "sonner";

type EventQrModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  eventDate: string;
};

export function EventQrModal({ open, onClose, eventId, eventTitle, eventDate }: EventQrModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInfo = eventQrData[eventId];
  const tokenInfo = eventQrTokens[eventId];
  const qrValue = tokenInfo?.qrUrl || `https://conectapumas.app/inscribirse/${eventId}`;

  const handleDownload = () => {
    if (qrInfo?.type === "uploaded" && qrInfo.imageUrl) {
      const link = document.createElement("a");
      link.download = `qr-${eventId}.png`;
      link.href = qrInfo.imageUrl;
      link.click();
      toast.success("QR descargado");
      return;
    }
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("Error al descargar");
      return;
    }
    const link = document.createElement("a");
    link.download = `qr-${eventId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR descargado");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: eventTitle,
        text: `Únete al evento: ${eventTitle}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard?.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-7 rounded-full grid place-items-center hover:bg-red-50 transition"
          style={{ color: "#ef4444" }}
        >
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-bold mt-1" style={{ color: "var(--puma-dark)" }}>
          Únete a este evento
        </h2>

        <div
          className="mt-3 rounded-lg p-3 text-sm flex items-start gap-2"
          style={{ backgroundColor: "#004B8710", color: "var(--puma-blue)" }}
        >
          <svg
            className="size-4 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-left">
            Comparte este QR para que más personas se unan al evento.
          </span>
        </div>

        <div
          className="mt-5 mx-auto w-56 aspect-square rounded-xl border-2 p-3 grid place-items-center"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
          ref={qrRef}
        >
          {qrInfo?.type === "uploaded" && qrInfo.imageUrl ? (
            <img
              src={qrInfo.imageUrl}
              alt="QR del evento"
              className="w-full h-full object-contain"
            />
          ) : (
            <QRCodeCanvas value={qrValue} size={200} level="M" />
          )}
        </div>

        <div className="mt-3 font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
          {eventTitle}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{eventDate}</div>

        <div className="flex gap-3 mt-5">
          <Button
            className="flex-1 gap-1.5"
            style={{ backgroundColor: "var(--puma-blue)" }}
            onClick={handleDownload}
          >
            <Download className="size-4" /> Descargar QR
          </Button>
          <Button variant="outline" className="flex-1 gap-1.5" onClick={handleShare}>
            <Share2 className="size-4" /> Compartir
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Escanea este QR con tu cámara para inscribirte al evento.
        </p>
      </div>
    </div>
  );
}
