import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, FileText, X, Pen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  MESES,
  downloadConstanciaPdf,
  generateSealCanvasDataUrl,
  type ConstanciaData,
} from "@/lib/constancia-pdf";
import { CATEGORY_LABEL_LONG } from "@/lib/mock-data";
import { QRCodeCanvas } from "qrcode.react";

/* ─── SIGNATURE SUB-MODAL ─── */
export function SignatureModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: (dataURL: string) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!open) {
      setHasDrawn(false);
      return;
    }
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 300;
      canvas.height = 100;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      }
    }, 50);
  }, [open]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    setHasDrawn(true);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawingRef.current = false;
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
    setHasDrawn(false);
  };

  const confirmar = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toast.error("Error al obtener el canvas de firma");
        return;
      }
      const dataURL = canvas.toDataURL("image/png");
      if (!dataURL || dataURL === "data:,") {
        toast.error("No se pudo generar la firma. Intenta de nuevo.");
        return;
      }
      onConfirm(dataURL);
    } catch (error) {
      console.error("Error al confirmar firma:", error);
      toast.error("Ocurrió un error al procesar la firma.");
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onCancel();
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Firma digital</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-card overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-24 cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={limpiar}>
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancelar
              </Button>
              {hasDrawn && (
                <Button
                  size="sm"
                  className="text-white"
                  style={{ backgroundColor: "#1e3a5f" }}
                  onClick={confirmar}
                >
                  Confirmar firma
                </Button>
              )}
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ─── ANIMATED SEAL STAMP ─── */
function SealStamp({
  stampKey,
  signatureDataURL,
  studentId,
  onSealComplete,
}: {
  stampKey: number;
  signatureDataURL: string | null;
  studentId: string;
  onSealComplete: (studentId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"hidden" | "impact" | "settle">("hidden");

  useEffect(() => {
    if (!signatureDataURL || stampKey === 0) return;
    setPhase("hidden");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 130;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.warn("No se pudo obtener el contexto 2D del canvas del sello");
      return;
    }
    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, SIZE, SIZE);
          ctx.save();
          const rotation = ((Math.random() * 4 - 2) * Math.PI) / 180;
          ctx.translate(SIZE / 2, SIZE / 2);
          ctx.rotate(rotation);
          ctx.translate(-SIZE / 2, -SIZE / 2);
          ctx.globalAlpha = 0.85;
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          ctx.restore();
          setPhase("impact");
        } catch (err) {
          console.error("Error dibujando sello:", err);
        }
      };
      img.onerror = () => {
        console.warn("No se pudo cargar la imagen del sello");
      };
      img.src = "/sello-voae.png";
    }, 50);
    return () => clearTimeout(timer);
  }, [stampKey, signatureDataURL]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center"
      animate={
        phase === "impact"
          ? { scale: 1.0, opacity: 1.0 }
          : phase === "settle"
            ? { scale: 1.0, opacity: 0.85 }
            : { scale: 1.4, opacity: 0 }
      }
      transition={
        phase === "impact"
          ? { duration: 0.08, ease: "easeOut" }
          : { duration: 0.2, ease: "easeOut" }
      }
      onAnimationComplete={() => {
        if (phase === "impact") {
          setPhase("settle");
        } else if (phase === "settle") {
          onSealComplete(studentId);
        }
      }}
    >
      <canvas ref={canvasRef} width={130} height={130} className="size-[130px]" />
    </motion.div>
  );
}

/* ─── PDF MODAL ─── */
interface PdfModalEstudiante {
  estudiante_nombre: string;
  estudiante_id: string;
  estudiante_carrera: string;
  estudiante_foto_url?: string;
}

interface PdfModalEvent {
  titulo: string;
  fecha_inicio: string;
  duracion_horas: number;
  categoria: string;
  tutor_nombre: string;
}

interface PdfModalUser {
  name: string;
  cargo?: string;
  departamento?: string;
  codigo_firma?: string;
  firma_url?: string;
}

export function PdfModal({
  estudiante,
  event,
  user,
  signatureDataURL,
  yaFirmado,
  stampKey,
  showSignature = true,
  onCerrar,
  onAbrirFirma,
  onDownloadPDF,
  onSealComplete,
}: {
  estudiante: PdfModalEstudiante;
  event: PdfModalEvent;
  user: PdfModalUser;
  signatureDataURL: string | null;
  yaFirmado: boolean;
  stampKey: number;
  showSignature?: boolean;
  onCerrar: () => void;
  onAbrirFirma: () => void;
  onDownloadPDF: () => void;
  onSealComplete: (studentId: string) => void;
}) {
  const categoria = event.categoria as keyof typeof CATEGORY_LABEL_LONG;
  const now = new Date();

  const qrData = JSON.stringify({
    estudiante: estudiante.estudiante_nombre,
    cuenta: estudiante.estudiante_id,
    evento: event.titulo,
    fecha: event.fecha_inicio.slice(0, 10),
    horas: event.duracion_horas,
    categoria: event.categoria,
    voae_firmante: user.name,
    codigo_registro: user.codigo_firma || "ART.202606-18-S-CU",
    emitido: now.toISOString().slice(0, 10),
  });

  return (
    <AlertDialog
      open
      onOpenChange={(v) => {
        if (!v) onCerrar();
      }}
    >
      <AlertDialogContent className="max-w-4xl w-[92vw] max-h-[92vh] overflow-y-auto">
        <AlertDialogHeader className="border-b pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <AlertDialogTitle className="text-xl font-semibold" style={{ color: "#1e3a5f" }}>
                {estudiante.estudiante_nombre}
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {event.titulo} · {event.fecha_inicio.slice(0, 10)}
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="size-8 rounded-full grid place-items-center hover:bg-secondary/50 transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </AlertDialogHeader>

        <div
          className="bg-white rounded-lg border p-6 text-sm leading-relaxed"
          style={{ fontFamily: "serif" }}
        >
          <div className="flex items-start justify-between mb-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <img src="/logo-unah.png" alt="UNAH" className="size-[90px] object-contain" />
              <img src="/logo-voae.png" alt="VOAE" className="size-[90px] object-contain" />
            </div>
            <div className="text-right text-[11px] text-muted-foreground leading-tight">
              <div>Tel: 22166100</div>
              <div>Ext. 100304</div>
              <div>voae@unah.edu.hn</div>
            </div>
          </div>

          <h2
            className="text-lg font-bold text-center mb-6 uppercase underline decoration-1 underline-offset-4"
            style={{ color: "#1e3a5f" }}
          >
            CONSTANCIA DE PARTICIPACIÓN
          </h2>

          <p className="mb-4 text-justify">
            La Vicerrectoría de Orientación y Asuntos Estudiantiles de la Universidad Nacional
            Autónoma de Honduras, <strong>HACE CONSTAR QUE</strong>:
          </p>

          <p className="mb-4 text-center font-bold" style={{ fontSize: "1.05rem" }}>
            {estudiante.estudiante_nombre.toUpperCase()}
          </p>

          <div className="mb-4 text-center">
            estudiante de la Carrera de{" "}
            <span className="font-semibold align-middle truncate max-w-[260px] inline-block">
              {estudiante.estudiante_carrera.toUpperCase()}
            </span>
            <br />
            con No. de Cta. <strong>{estudiante.estudiante_id}</strong>
          </div>

          <p className="mb-4 text-justify">
            ha participado durante su proceso formativo en el{" "}
            <strong>"{event.titulo.toUpperCase()}"</strong>, como parte de las actividades
            establecidas en el Artículo 140 de las Normas Académicas de la UNAH; en dicho evento el
            (la) estudiante acumuló <strong>{event.duracion_horas} HORAS</strong> cubriendo así el
            ámbito{" "}
            <strong>
              {CATEGORY_LABEL_LONG[categoria]?.toUpperCase() || event.categoria.toUpperCase()}
            </strong>
            .
          </p>

          <p className="mb-4 text-justify">
            La presente constancia se extiende conforme datos recibidos desde la unidad académica
            responsable del desarrollo de la actividad antes descrita y para fines de trámite de
            graduación.
          </p>

          <p className="mb-6 text-justify">
            Dado en Ciudad Universitaria José Trinidad Reyes a los {now.getDate()} días del mes de{" "}
            {MESES[now.getMonth()]} del año {now.getFullYear()}.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t">
            <div className="text-center">
              {showSignature && (
                <div className="relative" style={{ height: 100, overflow: "hidden" }}>
                  {signatureDataURL && (
                    <img
                      src={signatureDataURL}
                      alt="Firma"
                      style={{
                        position: "absolute",
                        bottom: 8,
                        left: 0,
                        width: "100%",
                        height: "auto",
                        opacity: 0.85,
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  )}
                </div>
              )}
              <div
                className="border-t border-gray-400 mt-1 mb-1"
                style={{ width: 200, marginLeft: "auto", marginRight: "auto" }}
              />
              <p className="text-[10px] font-bold mt-1">{user.name.toUpperCase()}</p>
              <p className="text-[9px] text-muted-foreground">{user.cargo || "Vicerrector"}</p>
              <p className="text-[9px] text-muted-foreground">
                {user.departamento || "Orientación y Asuntos Estudiantiles"}
              </p>
              <p className="text-[9px]" style={{ color: "#1e40af" }}>
                Cód. Reg. {user.codigo_firma || "ART.202606-18-S-CU"}
              </p>
            </div>

            {showSignature ? (
              <SealStamp
                stampKey={stampKey}
                signatureDataURL={signatureDataURL}
                studentId={estudiante.estudiante_id}
                onSealComplete={onSealComplete}
              />
            ) : (
              <div />
            )}

            <div className="flex flex-col items-center justify-center">
              <QRCodeCanvas value={qrData} size={80} />
              <p className="text-[9px] text-muted-foreground mt-1">Escanea para verificar</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          {showSignature && signatureDataURL ? (
            <>
              <span
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white"
                style={{ backgroundColor: "#22c55e" }}
              >
                <CheckCircle2 className="size-4" /> Firmado
              </span>
              <Button
                className="gap-1.5"
                style={{ backgroundColor: "#1e3a5f", color: "white" }}
                onClick={onDownloadPDF}
              >
                <FileText className="size-4" /> Descargar PDF
              </Button>
              <Button variant="outline" onClick={onCerrar}>
                Cerrar
              </Button>
            </>
          ) : showSignature ? (
            <>
              <Button
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#1e3a5f", color: "#1e3a5f" }}
                onClick={onAbrirFirma}
              >
                <Pen className="size-4" /> Firma digital
              </Button>
              <Button
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#004B87", color: "#004B87" }}
                onClick={onDownloadPDF}
              >
                <FileText className="size-4" /> Descargar PDF
              </Button>
              <Button variant="outline" onClick={onCerrar}>
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                className="gap-1.5 text-white"
                style={{ backgroundColor: "#1e3a5f" }}
                onClick={onDownloadPDF}
              >
                <FileText className="size-4" /> Descargar PDF
              </Button>
              <Button variant="outline" onClick={onCerrar}>
                Cerrar
              </Button>
            </>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
