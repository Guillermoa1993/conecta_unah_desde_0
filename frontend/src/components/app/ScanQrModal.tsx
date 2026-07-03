import { useState, useRef, useEffect } from "react";
import { X, Camera, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsQR from "jsqr";

type ScanQrModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
};

export function ScanQrModal({ open, onClose, eventId }: ScanQrModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"scanning" | "success" | "error">("scanning");
  const [statusMsg, setStatusMsg] = useState("");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      return;
    }

    setStatus("scanning");
    setStatusMsg("");

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setStatus("error");
        setStatusMsg("No se pudo acceder a la cámara. Verifica los permisos.");
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (status !== "scanning" || !videoRef.current || !canvasRef.current) return;

    let animId: number;
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animId = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        if (code.data.includes(eventId)) {
          setStatus("success");
          setStatusMsg("¡Inscripción exitosa mediante QR!");
          toast.success("¡Escaneo exitoso!", {
            style: { backgroundColor: "#22c55e", color: "white" },
          });
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          setTimeout(onClose, 1500);
          return;
        } else {
          setStatus("error");
          setStatusMsg("Este QR no corresponde a este evento.");
          if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
          return;
        }
      }

      animId = requestAnimationFrame(scan);
    };
    animId = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(animId);
  }, [status, open, eventId, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 size-7 rounded-full grid place-items-center hover:bg-red-50 transition"
          style={{ color: "#ef4444" }}
        >
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-bold mt-1 text-center" style={{ color: "var(--puma-dark)" }}>
          Escanear QR del Evento
        </h2>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Apunta la cámara al código QR para inscribirte.
        </p>

        <div className="mt-5 rounded-xl overflow-hidden bg-black relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-40 h-40 border-2 border-white/60 rounded-lg" />
            </div>
          )}
        </div>

        {status === "error" && (
          <div
            className="flex items-center justify-center gap-2 mt-4 text-sm font-medium"
            style={{ color: "#ef4444" }}
          >
            <AlertCircle className="size-5" /> {statusMsg}
          </div>
        )}
        {status === "success" && (
          <div
            className="flex items-center justify-center gap-2 mt-4 text-sm font-medium"
            style={{ color: "#22c55e" }}
          >
            <CheckCircle2 className="size-5" /> {statusMsg}
          </div>
        )}

        <Button variant="outline" className="w-full mt-4" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
