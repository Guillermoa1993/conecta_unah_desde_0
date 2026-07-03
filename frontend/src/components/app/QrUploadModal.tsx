import { useState, useRef } from "react";
import { X, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsQR from "jsqr";

type QrUploadModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
};

export function QrUploadModal({ open, onClose, eventId }: QrUploadModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Solo PNG o JPG" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImage(dataUrl);
      setStatus("processing");

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setStatus("error");
          setStatusMsg("Error al procesar la imagen");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          const content = code.data;
          // Check if QR content contains the event ID
          if (content.includes(eventId)) {
            setStatus("success");
            setStatusMsg("¡Inscripción exitosa! El QR corresponde a este evento.");
            toast.success("¡Inscrito exitosamente mediante QR!", {
              style: { backgroundColor: "#22c55e", color: "white" },
            });
          } else {
            setStatus("error");
            setStatusMsg("Este QR no corresponde a ningún evento activo.");
          }
        } else {
          setStatus("error");
          setStatusMsg("No se pudo leer el código QR. Intenta con otra imagen.");
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImage(null);
    setStatus("idle");
    setStatusMsg("");
  };

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
          Sube el QR del evento para inscribirte
        </h2>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Sube una foto del código QR físico para inscribirte automáticamente.
        </p>

        <div className="mt-5">
          {image && status !== "idle" ? (
            <div className="space-y-4">
              <img
                src={image}
                alt="QR"
                className="w-40 h-40 object-contain mx-auto rounded-xl border"
              />
              <div
                className="flex items-center justify-center gap-2 text-sm font-medium"
                style={{
                  color:
                    status === "success"
                      ? "#22c55e"
                      : status === "error"
                        ? "#ef4444"
                        : "var(--puma-blue)",
                }}
              >
                {status === "processing" && (
                  <span className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
                )}
                {status === "success" && <CheckCircle2 className="size-5" />}
                {status === "error" && <AlertCircle className="size-5" />}
                {statusMsg}
              </div>
              {status === "success" ? (
                <Button
                  className="w-full"
                  style={{ backgroundColor: "var(--puma-blue)" }}
                  onClick={onClose}
                >
                  Cerrar
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={reset}>
                    Reintentar
                  </Button>
                  <Button
                    className="flex-1 text-white"
                    style={{ backgroundColor: "#ef4444" }}
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                processImage(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer"
              style={{
                borderColor: dragOver ? "var(--puma-blue)" : "#e2e8f0",
                backgroundColor: dragOver ? "#004B8708" : "transparent",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) processImage(f);
                }}
              />
              <Upload className="size-8 mx-auto" style={{ color: "#94a3b8" }} />
              <div className="text-sm font-medium mt-2">
                Arrastra el QR aquí o haz clic para seleccionar imagen
              </div>
              <div className="text-xs text-muted-foreground mt-1">PNG o JPG</div>
            </div>
          )}
        </div>

        {status === "idle" && !image && (
          <Button
            variant="outline"
            className="w-full mt-4"
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
            onClick={onClose}
          >
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
