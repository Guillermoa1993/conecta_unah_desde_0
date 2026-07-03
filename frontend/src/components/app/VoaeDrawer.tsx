import { useState, useRef } from "react";
import { X, FileText, Upload, Download, CheckCircle2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type EnrolledStudent = {
  id: string;
  studentName: string;
  studentId: string;
  attended: boolean;
  fotoUrl?: string;
};

type VoaeDrawerProps = {
  open: boolean;
  onClose: () => void;
  tutorName: string;
  eventTitle: string;
  eventDate: string;
  totalAsistentes: number;
  horasPorEstudiante: number;
  asistentesList: EnrolledStudent[];
  eventId: string;
  onSubmitted?: () => void;
};

function getCertificadosStore(eventId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`certificados_${eventId}`) || "[]");
  } catch {
    return [];
  }
}

export function VoaeDrawer({
  open,
  onClose,
  tutorName,
  eventTitle,
  eventDate,
  totalAsistentes,
  horasPorEstudiante,
  asistentesList,
  eventId,
  onSubmitted,
}: VoaeDrawerProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Formato no válido", { description: "Solo se aceptan archivos PDF" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 10MB" });
      return;
    }
    setPdfFile(file);
  };

  const handleSubmit = () => {
    localStorage.setItem(`certificados_estado_${eventId}`, "EN_REVISION");
    toast.success("Solicitud enviada a VOAE exitosamente", {
      style: { backgroundColor: "var(--puma-blue)", color: "white" },
    });
    if (onSubmitted) onSubmitted();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative h-full overflow-y-auto bg-card border-l shadow-xl animate-in slide-in-from-right duration-300"
        style={{ width: "40%", minWidth: "480px", maxWidth: "640px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-lg font-bold" style={{ color: "var(--puma-dark)" }}>
            Enviar a revisión VOAE
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full grid place-items-center hover:bg-red-50 transition"
            style={{ color: "#ef4444" }}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event info */}
          <div
            className="rounded-xl p-5 space-y-2.5 text-sm"
            style={{ backgroundColor: "#f1f5f9" }}
          >
            <div>
              <span className="text-muted-foreground">Tutor: </span>
              <span className="font-bold">{tutorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Evento: </span>
              <span className="font-bold">{eventTitle}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Fecha del evento: </span>
              <span className="font-bold">{eventDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total de asistentes confirmados: </span>
              <span className="font-bold">{totalAsistentes}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Horas a acreditar por estudiante: </span>
              <span className="font-bold">{horasPorEstudiante}</span>
            </div>
          </div>

          {/* Attendance list */}
          <div>
            <h3 className="font-semibold mb-3">Lista de asistencia</h3>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Estudiante
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      No. Cuenta
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {asistentesList.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 font-medium">{s.studentName}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                        {s.studentId}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className="text-[10px] px-2 py-1 rounded-full font-medium"
                          style={{
                            backgroundColor: s.attended ? "#22c55e20" : "#ef444420",
                            color: s.attended ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {s.attended ? "Asistió" : "No asistió"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Certificates generated */}
          {eventId && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="size-4" style={{ color: "#22c55e" }} /> Certificados
                generados automáticamente
              </h3>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Estudiante
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        No. Cuenta
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                        Certificado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(() => {
                      const certificados = getCertificadosStore(eventId);
                      return asistentesList
                        .filter((s) => certificados.includes(s.studentId))
                        .map((s) => (
                          <tr key={s.id}>
                            <td className="px-4 py-2.5 font-medium flex items-center gap-2">
                              {s.fotoUrl ? (
                                <img
                                  src={s.fotoUrl}
                                  alt=""
                                  className="size-6 rounded-full object-cover"
                                />
                              ) : (
                                <User className="size-5" style={{ color: "#9ca3af" }} />
                              )}
                              {s.studentName}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">
                              {s.studentId}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <CheckCircle2
                                className="size-4 inline-block"
                                style={{ color: "#22c55e" }}
                              />
                            </td>
                          </tr>
                        ));
                    })()}
                    {getCertificadosStore(eventId).length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-6 text-center text-sm text-muted-foreground"
                        >
                          Ningún estudiante ha escaneado el QR de finalización aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PDF upload */}
          <div>
            <h3 className="font-semibold mb-2">Subir PDF de asistencia</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Opcional — sube el PDF con las firmas físicas como respaldo.
            </p>
            {pdfFile ? (
              <div className="flex items-center gap-3 rounded-xl border p-4">
                <div
                  className="size-10 rounded-lg grid place-items-center"
                  style={{ backgroundColor: "#ef444420" }}
                >
                  <FileText className="size-5" style={{ color: "#ef4444" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{pdfFile.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  onClick={() => setPdfFile(null)}
                  className="size-7 rounded-full grid place-items-center hover:bg-red-50 transition shrink-0"
                  style={{ color: "#ef4444" }}
                >
                  <X className="size-4" />
                </button>
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
                  handleFileDrop(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer"
                style={{
                  borderColor: dragOver ? "var(--puma-blue)" : "oklch(0.87 0.01 250)",
                  backgroundColor: dragOver ? "#004B8708" : "transparent",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileDrop(e.target.files?.[0])}
                />
                <Upload className="size-8 mx-auto" style={{ color: "oklch(0.6 0.03 250)" }} />
                <div className="text-sm font-medium mt-2">
                  Arrastra el PDF de asistencia firmado aquí
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  o haz clic para seleccionar
                </div>
                <div className="text-xs text-muted-foreground mt-2">PDF · Máximo 10MB</div>
              </div>
            )}
            <div
              className="mt-3 rounded-lg p-3 text-xs flex items-start gap-2"
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
              <span>
                El PDF es un respaldo adicional. VOAE revisará la lista digital de asistencia para
                aprobar las horas.
              </span>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="sticky bottom-0 bg-card border-t p-6">
          <Button
            className="w-full text-white gap-2 h-12 text-base"
            style={{ backgroundColor: "var(--puma-blue)" }}
            onClick={handleSubmit}
          >
            <Upload className="size-4" /> Enviar a VOAE para revisión
          </Button>
        </div>
      </div>
    </div>
  );
}
