import { useState, useRef } from "react";
import { X, FileText, Upload, CheckCircle2, User } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { api } from "../../../services/api";

export type EnrolledStudent = {
  id: string;
  studentName: string;
  studentId: string;
  attended: boolean;
  fotoUrl?: string;
};

export type VoaeDrawerProps = {
  open: boolean;
  onClose: () => void;
  tutorName: string;
  eventTitle: string;
  eventDate: string;
  totalAsistentes: number;
  horasPorEstudiante: number;
  asistentesList: EnrolledStudent[];
  eventId: string;
  eventObj?: any;
  onSubmitted?: () => void;
};

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
  eventObj,
  onSubmitted,
}: VoaeDrawerProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      toast.error("Formato no válido", { description: "Solo se aceptan archivos PDF" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 10MB" });
      return;
    }
    setPdfFile(file);
    toast.success(`Archivo "${file.name}" cargado como respaldo`);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (eventId && eventObj) {
        await api.put(`/eventos/${eventId}`, {
          ...eventObj,
          estado: "FINALIZADO",
          pdf_asistencia_url: pdfFile ? pdfFile.name : (eventObj.pdf_asistencia_url || null)
        });
      }
      localStorage.setItem(`certificados_estado_${eventId}`, "EN_REVISION");
      toast.success("Solicitud enviada a VOAE exitosamente");
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err: any) {
      toast.error("Error al enviar la solicitud a VOAE", { description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        className="relative h-full overflow-y-auto bg-white border-l shadow-2xl z-10 flex flex-col transition-all duration-300"
        style={{ width: "40%", minWidth: "480px", maxWidth: "640px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-[#003366]">
            Enviar a revisión VOAE
          </h2>
          <button
            onClick={onClose}
            className="size-8 rounded-full grid place-items-center hover:bg-red-50 text-red-500 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Event info */}
          <div className="rounded-xl p-5 space-y-2.5 text-sm bg-slate-50 border border-slate-200/60">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Tutor:</span>
              <span className="font-bold text-slate-800">{tutorName || "Profesor UNAH"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Evento:</span>
              <span className="font-bold text-slate-800">{eventTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Fecha del evento:</span>
              <span className="font-bold text-slate-800">{eventDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Total de asistentes confirmados:</span>
              <span className="font-bold text-emerald-600">{totalAsistentes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Horas a acreditar por estudiante:</span>
              <span className="font-bold text-[#003366]">{horasPorEstudiante}h</span>
            </div>
          </div>

          {/* Attendance list */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center justify-between">
              <span>Lista de asistencia</span>
              <span className="text-xs text-slate-500 font-normal">({asistentesList.length} registrados)</span>
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">
                      Estudiante
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600">
                      No. Cuenta
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {asistentesList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-center text-xs text-slate-400">
                        No hay registros de asistencia en la lista aún.
                      </td>
                    </tr>
                  ) : (
                    asistentesList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-800 flex items-center gap-2">
                          {s.fotoUrl ? (
                            <img
                              src={s.fotoUrl}
                              alt=""
                              className="size-6 rounded-full object-cover"
                            />
                          ) : (
                            <User className="size-4 text-slate-400" />
                          )}
                          <span className="truncate max-w-[160px]">{s.studentName}</span>
                        </td>
                        <td className="px-4 py-2 text-xs font-mono text-slate-500">
                          {s.studentId}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              s.attended
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {s.attended ? "Asistió" : "No asistió"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PDF upload */}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-1">Subir PDF de asistencia</h3>
            <p className="text-xs text-slate-500 mb-3">
              Opcional — sube el PDF con las firmas físicas como respaldo.
            </p>
            {pdfFile ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="size-10 rounded-lg grid place-items-center bg-emerald-100 text-emerald-600 shrink-0">
                  <FileText className="size-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">{pdfFile.name}</div>
                  <div className="text-xs text-slate-500">
                    {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfFile(null)}
                  className="size-7 rounded-full grid place-items-center hover:bg-rose-100 text-rose-500 transition-colors shrink-0"
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
                className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? "border-[#003366] bg-[#003366]/5"
                    : "border-slate-300 hover:border-[#003366] bg-slate-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileDrop(e.target.files?.[0])}
                />
                <Upload className="size-8 mx-auto text-slate-400 mb-2" />
                <div className="text-sm font-semibold text-slate-700">
                  Arrastra el PDF de asistencia firmado aquí
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  o haz clic para seleccionar
                </div>
                <div className="text-[11px] text-slate-400 mt-2">PDF · Máximo 10MB</div>
              </div>
            )}
            <div className="mt-3 rounded-lg p-3 text-xs flex items-start gap-2 bg-[#003366]/5 border border-[#003366]/10 text-[#003366]">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-[#003366]" />
              <span>
                El PDF es un respaldo adicional. VOAE revisará la lista digital de asistencia para aprobar las horas.
              </span>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6">
          <Button
            className="w-full text-white gap-2 h-11 text-sm font-semibold bg-[#004B87] hover:bg-[#003366] transition-colors shadow-md"
            disabled={submitting}
            onClick={handleSubmit}
          >
            <Upload className="size-4" /> {submitting ? "Enviando a VOAE..." : "Enviar a VOAE para revisión"}
          </Button>
        </div>
      </div>
    </div>
  );
}
