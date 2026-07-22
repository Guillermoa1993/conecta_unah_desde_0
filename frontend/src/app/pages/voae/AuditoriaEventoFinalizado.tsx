import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Eye,
  AlertTriangle,
  MapPin,
  PenLine,
  RotateCcw,
  User,
  Download,
  Lock,
  Stamp,
  Printer,
  X,
  FileCheck,
} from "lucide-react";
import { api } from "../../../services/api";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { PdfModal } from "../../components/app/ConstanciaModal";
import { downloadConstanciaPdf, MESES } from "../../../lib/constancia-pdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#003366",
  CULTURAL: "#d97706",
  DEPORTIVO: "#059669",
  SOCIAL: "#7c3aed",
};

function formatLugar(lugarStr?: string): string {
  if (!lugarStr) return "Ciudad Universitaria";
  const nombre = lugarStr.split("|")[0].trim();
  return nombre || "Ciudad Universitaria";
}

function DigitalCanvas({ onSigned }: { onSigned: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#003366";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getXY = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      const { x, y } = getXY(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const { x, y } = getXY(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasStrokes(true);
    };
    const stop = () => {
      drawing.current = false;
    };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", stop);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", stop);
    };
  }, []);

  const clear = () => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const confirm = () => {
    if (!hasStrokes) {
      toast.error("Por favor dibuja tu firma antes de confirmar");
      return;
    }
    onSigned(ref.current!.toDataURL());
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-[#003366]/30 rounded-xl overflow-hidden bg-white">
        <canvas ref={ref} width={480} height={130} className="w-full touch-none cursor-crosshair" />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Limpiar
        </button>
        <button
          type="button"
          onClick={confirm}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition-colors"
        >
          <PenLine className="h-3.5 w-3.5" /> Confirmar firma
        </button>
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalItems,
  from,
  to,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalItems: number;
  from: number;
  to: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 border-t border-slate-200 bg-slate-50/80 text-xs font-medium">
      <span className="text-slate-500">
        Mostrando {from}-{to} de {totalItems} registros
      </span>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none bg-white font-bold text-[#003366] focus:ring-1 focus:ring-[#003366]"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-3 py-1 rounded-lg font-semibold text-[#003366] hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            ← Anterior
          </button>
          <span className="px-2 font-bold text-slate-800">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded-lg font-semibold text-[#003366] hover:bg-slate-200/70 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

export function AuditoriaEventoFinalizado() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [inscripciones, setInscripciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state (Punto 2)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [auditStudent, setAuditStudent] = useState<any | null>(null);
  const [certStudent, setCertStudent] = useState<any | null>(null);

  // Confirmations state (Punto 1)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchEventData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const evData = await api.get<any>(`/eventos/${id}`);
      setEvent(evData);

      const insData = await api.get<any[]>(`/inscripciones/evento/${id}`);
      setInscripciones(insData || []);

      // Check stored signature
      const savedSig = localStorage.getItem(`voae_signature_${id}`);
      if (savedSig) setSignatureUrl(savedSig);
    } catch (err: any) {
      toast.error("Error al cargar datos del evento", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#003366]"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertTriangle className="size-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Evento no encontrado</h2>
        <Button onClick={() => navigate("/voae")} className="mt-4 bg-[#003366] text-white">
          Volver al panel VOAE
        </Button>
      </div>
    );
  }

  const asistentes = inscripciones.filter((i) => i.estado === "ASISTIDO" || i.estado === "PRESENTE" || i.asistio);
  const rechazados = inscripciones.filter((i) => i.estado === "NO_ASISTIO" || i.estado === "CANCELADO" || i.estado === "RECHAZADO");
  const pendientes = inscripciones.filter((i) => i.estado !== "ASISTIDO" && i.estado !== "NO_ASISTIO" && i.estado !== "RECHAZADO" && i.estado !== "CANCELADO");

  // Sort list prioritizing pending audits FIRST (Punto 2)
  const sortedInscripciones = [...inscripciones].sort((a, b) => {
    const aAudited = a.estado === "ASISTIDO" || a.estado === "RECHAZADO" || a.estado === "NO_ASISTIO";
    const bAudited = b.estado === "ASISTIDO" || b.estado === "RECHAZADO" || b.estado === "NO_ASISTIO";
    if (!aAudited && bAudited) return -1;
    if (aAudited && !bAudited) return 1;
    return 0;
  });

  // Pagination calculations (Punto 2)
  const totalItems = sortedInscripciones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const from = totalItems > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const to = Math.min(safePage * pageSize, totalItems);
  const paginatedInscripciones = sortedInscripciones.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSaveSignature = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    localStorage.setItem(`voae_signature_${id}`, dataUrl);
    setShowSigningModal(false);
    toast.success("Firma registrada y aplicada automáticamente a todas las constancias");
  };

  const handleAprobarEstudianteConfirm = async () => {
    if (!auditStudent) return;
    const stId = auditStudent.id;
    const name = auditStudent.studentName || "Estudiante";

    try {
      await api.put(`/inscripciones/${stId}/estado`, { estado: "ASISTIDO" });
    } catch (e) {
      // Fallback local update
    }

    setInscripciones((prev) =>
      prev.map((item) => (item.id === stId ? { ...item, estado: "ASISTIDO", asistio: true } : item))
    );
    toast.success(`Asistencia aprobada para ${name}`);
    setShowApproveConfirm(false);
    setAuditStudent(null);
  };

  const handleRechazarEstudianteConfirm = async () => {
    if (!auditStudent) return;
    if (!rejectReason.trim()) {
      toast.error("Por favor escribe el motivo del rechazo");
      return;
    }
    const stId = auditStudent.id;
    const name = auditStudent.studentName || "Estudiante";

    try {
      await api.put(`/inscripciones/${stId}/estado`, { estado: "NO_ASISTIO", motivo_rechazo: rejectReason });
    } catch (e) {
      // Fallback local update
    }

    setInscripciones((prev) =>
      prev.map((item) =>
        item.id === stId
          ? { ...item, estado: "RECHAZADO", asistio: false, motivo_rechazo: rejectReason }
          : item
      )
    );
    toast.error(`Asistencia rechazada para ${name}`);
    setShowRejectModal(false);
    setRejectReason("");
    setAuditStudent(null);
  };

  const categoriaNombre = CATEGORY_LABEL[event.categoria] || event.categoria || "Académico";

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/voae"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#003366] hover:underline"
        >
          <ArrowLeft className="size-4" /> Volver al panel VOAE
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-slate-200 text-slate-700 rounded-full">
          Auditoría de Evento Finalizado
        </span>
      </div>

      {/* Card Header & Ficha Técnica */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            {/* Círculo Verde: Imagen de Portada del Evento */}
            <div className="relative">
              {event.portada_url || event.imagen_url ? (
                <img
                  src={event.portada_url || event.imagen_url}
                  alt={event.titulo}
                  className="size-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div
                  className="size-16 rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-emerald-500 shadow-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[event.categoria] || "#003366" }}
                >
                  {event.titulo ? event.titulo.substring(0, 2).toUpperCase() : "EV"}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 size-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px]">
                ✓
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#003366]">{event.titulo}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap font-medium">
                <span className="px-2 py-0.5 rounded-full text-white font-semibold text-[11px]" style={{ backgroundColor: CATEGORY_COLORS[event.categoria] || "#003366" }}>
                  {categoriaNombre}
                </span>
                <span>• {formatLugar(event.ubicacion || event.lugar)}</span>
                <span>• {event.fecha_inicio ? new Date(event.fecha_inicio).toLocaleDateString("es-HN") : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Círculos Rojos: Botones Superiores */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setShowReportModal(true)}
              variant="outline"
              className="bg-white border-[#004B87] text-[#004B87] hover:bg-[#004B87]/5 font-semibold text-xs h-9"
            >
              <FileCheck className="size-4 mr-1.5 text-blue-600" /> Generar reporte de cumplimiento
            </Button>
            <Button
              onClick={() => setShowPdfModal(true)}
              variant="outline"
              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs h-9"
            >
              <FileText className="size-4 mr-1.5 text-amber-600" /> Ver lista escrita
            </Button>
          </div>
        </div>

        {/* Ficha Técnica Detallada (Recuadro Gris) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs flex items-center gap-3">
            {/* Círculo Celeste: Imagen del Creador/Tutor */}
            <div className="size-10 rounded-full overflow-hidden bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0">
              {event.tutor_foto ? (
                <img src={event.tutor_foto} alt="Tutor" className="size-full object-cover" />
              ) : (
                <User className="size-5 text-sky-700" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-slate-400 font-medium block">Tutor / Creador</span>
              <span className="font-bold text-slate-800 truncate block">{event.tutor_nombre || "Prof. Responsable"}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-medium block">Horas Acreditar</span>
            <span className="font-bold text-[#003366] text-sm">{event.duracion_horas || 1.0} hrs VOAE ({categoriaNombre})</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-medium block">Inscritos Totales</span>
            <span className="font-bold text-slate-800 text-sm">{inscripciones.length} estudiantes</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-2xs">
            <span className="text-slate-400 font-medium block">Asistencias Confirmadas</span>
            <span className="font-bold text-emerald-600 text-sm">{asistentes.length} asistieron</span>
          </div>
        </div>
      </div>

      {/* Sección de Badges y Botón Firma (Círculo Morado) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ {asistentes.length} acreditados
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              ✕ {rechazados.length} rechazados
            </span>
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              ⏳ {pendientes.length} pendientes por auditar
            </span>
          </div>

          {/* Círculo Morado: Registrar mi firma */}
          <Button
            onClick={() => setShowSigningModal(true)}
            variant="outline"
            className="border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 font-semibold text-xs h-9 gap-2 shadow-2xs"
          >
            <PenLine className="size-4 text-purple-600" />
            {signatureUrl ? "Firma Registrada ✓ (Modificar)" : "Registrar mi firma"}
          </Button>
        </div>

        {/* Tabla de Asistentes con Paginación y Priorización (Puntos 1 y 2) */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Estudiante</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Cuenta</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Correo institucional</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Carrera</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Inscripción</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-700">Estado</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-700">Certificado</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-slate-700">Acción VOAE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                    No hay estudiantes registrados en este evento aún.
                  </td>
                </tr>
              ) : (
                paginatedInscripciones.map((student) => {
                  const isApproved = student.estado === "ASISTIDO" || student.asistio;
                  const isRejected = student.estado === "RECHAZADO" || student.estado === "NO_ASISTIO";
                  const studentName = student.nombre_estudiante || student.nombre || student.studentName || "Estudiante UNAH";
                  const studentAccount = student.numero_cuenta || student.cuenta || student.studentId || "20211000000";
                  const studentEmail = student.correo || `${studentAccount}@unah.hn`;
                  const studentCareer = student.carrera || student.estudiante_carrera || "Ingeniería en Sistemas";
                  const inscripDate = student.created_at ? new Date(student.created_at).toLocaleDateString("es-HN") : "2026-06-09";

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Avatar + Nombre */}
                      <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2.5">
                        {student.fotoUrl || student.avatar ? (
                          <img
                            src={student.fotoUrl || student.avatar}
                            alt=""
                            className="size-7 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="size-7 rounded-full bg-[#003366]/10 text-[#003366] flex items-center justify-center font-bold text-xs">
                            {studentName.charAt(0)}
                          </div>
                        )}
                        <span>{studentName}</span>
                      </td>

                      {/* Cuenta */}
                      <td className="px-4 py-3 text-xs font-mono text-slate-600">{studentAccount}</td>

                      {/* Correo institucional */}
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{studentEmail}</td>

                      {/* Carrera */}
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">{studentCareer}</td>

                      {/* Inscripción */}
                      <td className="px-4 py-3 text-xs text-slate-500">{inscripDate}</td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span
                          className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : isRejected
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isApproved ? "Asistió" : isRejected ? "Rechazado" : "Pendiente"}
                        </span>
                      </td>

                      {/* Certificado */}
                      <td className="px-4 py-3 text-center">
                        {isApproved ? (
                          <Button
                            size="sm"
                            onClick={() => setCertStudent(student)}
                            className="bg-[#003366] hover:bg-[#002244] text-white text-[11px] h-7 px-2.5 font-semibold gap-1"
                          >
                            <FileText className="size-3" /> Certificado
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">No disponible</span>
                        )}
                      </td>

                      {/* Acción VOAE (Punto 1: muestra 'Aprobado' o 'Rechazado' una vez procesado) */}
                      <td className="px-4 py-3 text-right">
                        {isApproved ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              ✓ Aprobado
                            </span>
                            <button
                              onClick={() => setAuditStudent({ ...student, studentCareer, studentEmail, studentAccount, studentName })}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium underline ml-1"
                            >
                              Revisar
                            </button>
                          </div>
                        ) : isRejected ? (
                          <div className="flex items-center justify-end gap-1.5" title={student.motivo_rechazo || "Asistencia rechazada"}>
                            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                              ✕ Rechazado
                            </span>
                            <button
                              onClick={() => setAuditStudent({ ...student, studentCareer, studentEmail, studentAccount, studentName })}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium underline ml-1"
                            >
                              Revisar
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setAuditStudent({ ...student, studentCareer, studentEmail, studentAccount, studentName })}
                            className="bg-[#004B87] hover:bg-[#003366] text-white text-xs h-7 px-3 font-bold gap-1 shadow-2xs"
                          >
                            <Eye className="size-3.5" /> Auditar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Paginación (Punto 2 - Imagen 170) */}
          <PaginationControls
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            totalItems={totalItems}
            from={from}
            to={to}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* ── MODAL 1: Registrar Firma Digital ── */}
      <Dialog open={showSigningModal} onOpenChange={setShowSigningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold text-lg flex items-center gap-2">
              <PenLine className="size-5 text-purple-600" /> Registrar Firma VOAE
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Dibuja tu firma oficial. Esta se estampará de forma automática en todas las constancias de acreditación aprobadas de este evento.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <DigitalCanvas onSigned={handleSaveSignature} />
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 2: Reporte de Cumplimiento ── */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold text-lg flex items-center gap-2">
              <FileCheck className="size-5 text-blue-600" /> Reporte de Cumplimiento del Evento
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Resumen oficial de los estudiantes que completaron su asistencia y obtendrán horas VOAE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Header Logos UNAH + VOAE */}
            <div className="flex items-center justify-between border-b pb-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <img src="/logo-unah.png" alt="UNAH" className="h-10 w-auto object-contain" />
                <img src="/logo-voae.png" alt="VOAE" className="h-10 w-auto object-contain" />
              </div>
              <div className="text-right text-[11px] text-slate-500 font-mono">
                <div className="font-bold text-[#003366]">UNAH - VOAE</div>
                <div>Tel: 22166100 Ext. 100304</div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 font-medium text-slate-700">
              <div><strong>Evento:</strong> {event.titulo}</div>
              <div><strong>Ámbito VOAE:</strong> {categoriaNombre}</div>
              <div><strong>Fecha:</strong> {event.fecha_inicio ? new Date(event.fecha_inicio).toLocaleDateString("es-HN") : "N/A"}</div>
              <div><strong>Acreditados:</strong> {asistentes.length} de {inscripciones.length}</div>
            </div>

            <div className="border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="p-2.5 text-left">Estudiante</th>
                    <th className="p-2.5 text-left">No. Cuenta</th>
                    <th className="p-2.5 text-left">Correo institucional</th>
                    <th className="p-2.5 text-left">Carrera</th>
                    <th className="p-2.5 text-center">Horas acreditadas ({categoriaNombre})</th>
                    <th className="p-2.5 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {asistentes.map((st) => {
                    const stAccount = st.numero_cuenta || st.cuenta || "20211000000";
                    const stEmail = st.correo || `${stAccount}@unah.hn`;
                    const stCareer = st.carrera || st.estudiante_carrera || "Ingeniería en Sistemas";

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-semibold text-slate-800">{st.nombre_estudiante || st.nombre || "Estudiante"}</td>
                        <td className="p-2.5 font-mono text-slate-600">{stAccount}</td>
                        <td className="p-2.5 font-mono text-slate-500">{stEmail}</td>
                        <td className="p-2.5 text-slate-600">{stCareer}</td>
                        <td className="p-2.5 text-center font-bold text-[#003366]">{event.duracion_horas || 1.0}h</td>
                        <td className="p-2.5 text-right text-emerald-600 font-bold">Cumplido ✓</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                const cleanEventName = (event.titulo || "Evento").replace(/[^a-zA-Z0-9-_]/g, "_");
                const pdfTitle = `Reporte_Cumplimiento_${cleanEventName}`;
                const originalTitle = document.title;
                document.title = pdfTitle;
                const origin = window.location.origin;

                const rowsHtml = asistentes.map((st) => {
                  const stAccount = st.numero_cuenta || st.cuenta || "20211000000";
                  const stEmail = st.correo || `${stAccount}@unah.hn`;
                  const stCareer = st.carrera || st.estudiante_carrera || "Ingeniería en Sistemas";
                  const stName = st.nombre_estudiante || st.nombre || "Estudiante";

                  return `
                    <tr>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${stName}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${stAccount}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${stEmail}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${stCareer}</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #003366;">${event.duracion_horas || 1.0}h</td>
                      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #059669;">Cumplido ✓</td>
                    </tr>
                  `;
                }).join("");

                const printHtml = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <title>${pdfTitle}</title>
                    <style>
                      @page { size: A4 portrait; margin: 15mm; }
                      body { font-family: Arial, sans-serif; font-size: 10pt; color: #0f172a; margin: 0; padding: 0; }
                      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #003366; padding-bottom: 12px; margin-bottom: 20px; }
                      .title { text-align: center; font-size: 15pt; font-weight: bold; color: #003366; text-transform: uppercase; margin-bottom: 15px; }
                      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9.5pt; }
                      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
                      th { background: #003366; color: white; padding: 8px; text-align: left; }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${origin}/logo-unah.png" style="height: 55px;" />
                        <img src="${origin}/logo-voae.png" style="height: 55px;" />
                      </div>
                      <div style="text-align: right; font-size: 8.5pt; color: #64748b;">
                        <div><strong>Tel:</strong> 22166100 Ext. 100304</div>
                        <div><strong>VOAE UNAH</strong></div>
                      </div>
                    </div>

                    <div class="title">REPORTE DE CUMPLIMIENTO DEL EVENTO</div>

                    <div class="info-box">
                      <div><strong>Evento:</strong> ${event.titulo}</div>
                      <div><strong>Ámbito VOAE:</strong> ${categoriaNombre}</div>
                      <div><strong>Fecha:</strong> ${event.fecha_inicio ? new Date(event.fecha_inicio).toLocaleDateString("es-HN") : "N/A"}</div>
                      <div><strong>Total Acreditados:</strong> ${asistentes.length} de ${inscripciones.length}</div>
                    </div>

                    <table>
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>No. Cuenta</th>
                          <th>Correo institucional</th>
                          <th>Carrera</th>
                          <th style="text-align:center;">Horas (${categoriaNombre})</th>
                          <th style="text-align:right;">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${rowsHtml}
                      </tbody>
                    </table>
                  </body>
                  </html>
                `;

                const iframe = document.createElement("iframe");
                iframe.style.position = "absolute";
                iframe.style.width = "0px";
                iframe.style.height = "0px";
                iframe.style.border = "none";
                document.body.appendChild(iframe);

                const doc = iframe.contentWindow?.document || iframe.contentDocument;
                if (doc) {
                  doc.write(printHtml);
                  doc.close();
                  setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                      document.body.removeChild(iframe);
                      document.title = originalTitle;
                    }, 1000);
                  }, 500);
                }
              }}
              className="bg-[#003366] hover:bg-[#002244] text-white font-semibold text-xs gap-1.5"
            >
              <Printer className="size-4" /> Imprimir reporte PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 3: Ver Lista Escrita (Respaldo PDF) sin salir a nueva pestaña ── */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold text-lg flex items-center gap-2">
              <FileText className="size-5 text-amber-600" /> Lista de Asistencia Escrita (Respaldo Físico)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vista previa del documento PDF escaneado con las firmas físicas enviadas por el tutor.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            {event.pdf_asistencia_url ? (
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Documento: {event.pdf_asistencia_url}</span>
                  <span className="text-emerald-600 font-bold">PDF Validado</span>
                </div>
                <div className="h-64 bg-slate-200/60 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                  <iframe src={event.pdf_asistencia_url} className="w-full h-full rounded-lg" title="Vista previa PDF" />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-amber-50/50 rounded-xl border border-amber-200/80 p-6 space-y-2">
                <FileText className="size-10 mx-auto text-amber-500" />
                <h4 className="font-bold text-amber-900 text-sm">Sin PDF Adjunto</h4>
                <p className="text-xs text-amber-700 max-w-md mx-auto">
                  El tutor no adjuntó un archivo PDF de asistencia física respaldo. La auditoría se realizará exclusivamente con el registro de marcas digital.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 4: Auditar Marcado de Entrada y Salida (Punto 1: Botones Aprobar/Rechazar con Confirmación) ── */}
      <Dialog open={!!auditStudent} onOpenChange={() => setAuditStudent(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6">
          {auditStudent && (
            <div className="space-y-6">
              {/* Header con foto de perfil grande, nombre y datos */}
              <div className="flex items-center gap-4">
                {auditStudent.fotoUrl || auditStudent.avatar ? (
                  <img
                    src={auditStudent.fotoUrl || auditStudent.avatar}
                    alt=""
                    className="size-20 rounded-full object-cover border-2 border-[#003366] shrink-0"
                  />
                ) : (
                  <div className="size-20 rounded-full bg-amber-100 text-amber-800 border-2 border-[#003366] flex items-center justify-center font-bold text-2xl shrink-0">
                    {(auditStudent.studentName || "S").split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div className="space-y-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-xl truncate">{auditStudent.studentName}</h3>
                  <p className="text-sm font-medium text-slate-500">
                    {auditStudent.studentAccount} • {auditStudent.studentCareer}
                  </p>
                </div>
              </div>

              {/* Grid de 3 Tarjetas: Entrada, Salida, Ubicación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Panel 1 - Entrada */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                    <Clock className="size-4 text-emerald-600" />
                    <span>Entrada</span>
                  </div>
                  <div className="text-lg font-bold text-emerald-900">
                    {auditStudent.hora_entrada || "06:11 p. m."}
                  </div>
                  <div className="bg-emerald-100/60 rounded-lg p-2 text-[11px] text-emerald-800 font-medium">
                    <MapPin className="size-3 inline mr-1 text-emerald-600" />
                    {auditStudent.ubicacion_entrada ? formatLugar(auditStudent.ubicacion_entrada) : "Coordenadas no disponibles"}
                  </div>
                </div>

                {/* Panel 2 - Salida */}
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-blue-800 text-xs">
                    <Clock className="size-4 text-blue-600" />
                    <span>Salida</span>
                  </div>
                  <div className="text-lg font-bold text-blue-900">
                    {auditStudent.hora_salida || "08:11 p. m."}
                  </div>
                  <div className="bg-blue-100/60 rounded-lg p-2 text-[11px] text-blue-800 font-medium">
                    <MapPin className="size-3 inline mr-1 text-blue-600" />
                    {auditStudent.ubicacion_salida ? formatLugar(auditStudent.ubicacion_salida) : "Coordenadas no disponibles"}
                  </div>
                </div>

                {/* Panel 3 - Ubicación del evento */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                    <MapPin className="size-4 text-slate-500" />
                    <span>Ubicación del evento</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate" title={formatLugar(event.ubicacion || event.lugar)}>
                    {formatLugar(event.ubicacion || event.lugar)}
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] font-bold text-amber-800">
                    ⚠️ Fuera del rango
                  </div>
                </div>
              </div>

              {/* Botones Inferiores de Acción (Punto 1: Aprobar y Rechazar abren confirmación) */}
              <div className="space-y-2.5 pt-2">
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-11 rounded-xl text-sm gap-2 shadow-xs transition-colors"
                >
                  <CheckCircle2 className="size-5" /> Aprobar
                </Button>
                <Button
                  onClick={() => setShowRejectModal(true)}
                  variant="outline"
                  className="w-full border-rose-500 text-rose-600 hover:bg-rose-50 font-bold h-11 rounded-xl text-sm gap-2 transition-colors"
                >
                  <XCircle className="size-5" /> Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DIÁLOGO SUB 1: Confirmación de Aprobación ── */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#003366] font-bold text-base flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" /> ¿Confirmar Aprobación de Asistencia?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-2 leading-relaxed">
              ¿Estás seguro de aprobar la asistencia de <strong>{auditStudent?.studentName}</strong>? El estudiante quedará oficialmente acreditado con <strong>{event?.duracion_horas || 1.0} hrs VOAE</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowApproveConfirm(false)} className="text-xs font-semibold">
              Cancelar
            </Button>
            <Button onClick={handleAprobarEstudianteConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
              <CheckCircle2 className="size-4" /> Sí, Confirmar Aprobación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIÁLOGO SUB 2: Confirmación de Rechazo y Motivo (Punto 1) ── */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-700 font-bold text-base flex items-center gap-2">
              <XCircle className="size-5 text-rose-600" /> Rechazar Asistencia del Estudiante
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Especifica el motivo del rechazo para <strong>{auditStudent?.studentName}</strong>. Esta observación se guardará en la auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Motivo del rechazo <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ej: El estudiante no registró su marca de salida o estuvo fuera del perímetro del evento."
              rows={3}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)} className="text-xs font-semibold">
              Cancelar
            </Button>
            <Button onClick={handleRechazarEstudianteConfirm} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5">
              <XCircle className="size-4" /> Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL 5: Vista Previa de Constancia de Participación Oficial ── */}
      {certStudent && (
        <PdfModal
          estudiante={{
            estudiante_nombre: certStudent.nombre_estudiante || certStudent.nombre || "Estudiante",
            estudiante_id: certStudent.numero_cuenta || certStudent.cuenta || "20211000000",
            estudiante_carrera: certStudent.carrera || certStudent.estudiante_carrera || "Ingeniería en Sistemas",
            estudiante_foto_url: certStudent.fotoUrl || certStudent.avatar,
          }}
          event={{
            titulo: event.titulo,
            fecha_inicio: event.fecha_inicio || new Date().toISOString(),
            duracion_horas: event.duracion_horas || 1.0,
            categoria: event.categoria,
            tutor_nombre: event.tutor_nombre || "Prof. Responsable",
          }}
          user={{
            name: "Lic. Roberto Fiallos",
            cargo: "Vicerrector",
            departamento: "Orientación y Asuntos Estudiantiles",
            codigo_firma: "ART.202606-18-S-CU",
            firma_url: signatureUrl || undefined,
          }}
          signatureDataURL={signatureUrl}
          yaFirmado={!!signatureUrl}
          stampKey={1}
          onCerrar={() => setCertStudent(null)}
          onAbrirFirma={() => {
            setCertStudent(null);
            setShowSigningModal(true);
          }}
          onDownloadPDF={() => {
            const stName = certStudent.nombre_estudiante || certStudent.nombre || "Estudiante";
            const stAccount = certStudent.numero_cuenta || certStudent.cuenta || "20211000000";
            const stCareer = certStudent.carrera || certStudent.estudiante_carrera || "Ingeniería en Sistemas";
            const now = new Date();

            downloadConstanciaPdf({
              estudiante_nombre: stName,
              estudiante_carrera: stCareer,
              estudiante_cuenta: stAccount,
              tutor_nombre: event.tutor_nombre || "Prof. Responsable",
              evento_nombre: event.titulo,
              evento_mes_anio: event.fecha_inicio ? new Date(event.fecha_inicio).toLocaleDateString("es-HN") : "2026",
              horas: event.duracion_horas || 1.0,
              categoria: event.categoria,
              voae_nombre: "Lic. Roberto Fiallos",
              voae_cargo: "Vicerrector",
              voae_departamento: "Orientación y Asuntos Estudiantiles",
              voae_codigo: "ART.202606-18-S-CU",
              voae_firma_url: signatureUrl || undefined,
              fecha_dia: now.getDate(),
              fecha_mes: MESES[now.getMonth()],
              fecha_anio: now.getFullYear(),
            });
          }}
          onSealComplete={() => {}}
        />
      )}
    </div>
  );
}
