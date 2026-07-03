import { useRef } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

type PersonalQrModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  studentId: string;
  studentName: string;
};

export function PersonalQrModal({
  open,
  onClose,
  eventId,
  studentId,
  studentName,
}: PersonalQrModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const qrValue = `${eventId}-${studentId}-${crypto.randomUUID()}`;

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) {
      toast.error("Error al descargar");
      return;
    }
    const link = document.createElement("a");
    link.download = `qr-${eventId}-${studentId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR descargado");
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
          Tu código QR personal
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          El tutor puede escanear este código para confirmar tu presencia.
        </p>

        <div
          className="mt-5 mx-auto w-56 aspect-square rounded-xl border-2 p-3 grid place-items-center"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
          ref={canvasRef}
        >
          <QRCodeCanvas value={qrValue} size={200} level="M" />
        </div>

        <div className="mt-3 font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
          {studentName}
        </div>

        <div className="flex gap-3 mt-5">
          <Button
            className="flex-1 gap-1.5"
            style={{ backgroundColor: "var(--puma-blue)" }}
            onClick={handleDownload}
          >
            <Download className="size-4" /> Descargar QR
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
