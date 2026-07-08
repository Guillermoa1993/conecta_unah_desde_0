import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  QrCode,
  Download,
  Play,
  Square,
  RefreshCw,
  Copy,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../../services/api";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { downloadConstanciaPdf, MESES } from "../../../lib/constancia-pdf";
import { SignatureModal, PdfModal } from "../../components/app/ConstanciaModal";

const CATEGORY_LABEL: Record<string, string> = {
  ACADEMICO: "Académico",
  CULTURAL: "Cultural",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const CATEGORY_COLORS: Record<string, string> = {
  ACADEMICO: "#3b82f6",
  CULTURAL: "#8b5cf6",
  DEPORTIVO: "#22c55e",
  SOCIAL: "#f59e0b",
};

function formatDate(iso: string) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ManageEvent() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Controls state
  const [qrTimer, setQrTimer] = useState(120);
  const [qrType, setQrType] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [attendanceCode, setAttendanceCode] = useState("");
  
  // Constancia Modals state
  const [pdfStudent, setPdfStudent] = useState<any>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [firmadasSet, setFirmadasSet] = useState<Set<string>>(new Set());

  const fetchEventDetails = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const evData = await api.get<any>(`/eventos/${eventId}`);
      setEvent(evData);
      
      const insData = await api.get<any[]>(`/inscripciones/evento/${eventId}`);
      setStudents(insData || []);
    } catch (err: any) {
      toast.error("Error al cargar detalles del evento", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (qrTimer > 0 && event?.estado === "EN_CURSO") {
      const interval = setInterval(() => setQrTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [qrTimer, event?.estado]);

  const generateAttendanceCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setAttendanceCode(code);
    localStorage.setItem(`att_code_${eventId}`, code);
    toast.success("Nuevo código generado");
  };

  useEffect(() => {
    if (event && !attendanceCode) {
      const saved = localStorage.getItem(`att_code_${eventId}`);
      if (saved) setAttendanceCode(saved);
      else generateAttendanceCode();
    }
  }, [event]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartEvent = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "EN_CURSO",
      });
      setEvent(updated);
      toast.success("¡El evento ha iniciado!");
    } catch (err: any) {
      toast.error("Error al iniciar el evento", { description: err.message });
    }
  };

  const handleEndEvent = async () => {
    if (!event) return;
    try {
      const updated = await api.put<any>(`/eventos/${event.id}`, {
        ...event,
        estado: "FINALIZADO",
      });
      setEvent(updated);
      toast.success("¡El evento ha finalizado!");
    } catch (err: any) {
      toast.error("Error al finalizar el evento", { description: err.message });
    }
  };

  const handleConfirmSignature = (signatureDataUrl: string) => {
    if (!pdfStudent || !event) return;
    setShowSignatureModal(false);
    setFirmadasSet((prev) => new Set(prev).add(pdfStudent.estudiante_id));
    localStorage.setItem(`cert_signed_${event.id}_${pdfStudent.estudiante_id}`, signatureDataUrl);
    toast.success("Firma estampada con éxito");
  };

  const handleDownloadPDF = async (s: any) => {
    if (!event) return;
    const evDate = new Date(event.fecha_inicio);
    const today = new Date();
    await downloadConstanciaPdf({
      estudiante_nombre: s.estudiante_nombre,
      estudiante_carrera: s.estudiante_carrera || "Carrera de Estudiante",
      estudiante_cuenta: s.estudiante_cuenta,
      tutor_nombre: event.tutor_nombre || "Tutor Responsable",
      evento_nombre: event.titulo,
      evento_mes_anio: `${MESES[evDate.getMonth()]} ${evDate.getFullYear()}`,
      horas: event.duracion_horas,
      categoria: CATEGORY_LABEL[event.categoria] || event.categoria,
      voae_nombre: "Tutor Responsable",
      voae_cargo: "Coordinador de Eventos",
      voae_departamento: "VOAE",
      voae_codigo: `VOAE-${event.id}`,
      fecha_dia: today.getDate(),
      fecha_mes: MESES[today.getMonth()],
      fecha_anio: today.getFullYear(),
      constancia_id: `const-${s.estudiante_cuenta}-${event.id}`,
    });
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Cargando panel del evento...</div>;
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="size-12 mx-auto text-red-500 mb-3" />
        <p className="text-sm font-semibold">Evento no encontrado.</p>
        <Link to="/tutor/eventos" className="text-xs text-[#004B87] underline mt-2 block">Volver a mis eventos</Link>
      </div>
    );
  }

  const qrValue = `https://conectapumas.app/asistencia/${event.id}?type=${qrType}&code=${attendanceCode}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/tutor/eventos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver a mis eventos
      </Link>

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003366]">{event.titulo}</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión del Evento y Asistencias</p>
        </div>
        <div className="flex items-center gap-2">
          {event.estado === "PROGRAMADO" && (
            <Button onClick={handleStartEvent} className="bg-green-600 hover:bg-green-700 gap-1.5">
              <Play className="size-4" /> Iniciar Evento
            </Button>
          )}
          {event.estado === "EN_CURSO" && (
            <Button onClick={handleEndEvent} className="bg-red-600 hover:bg-red-700 gap-1.5">
              <Square className="size-4" /> Finalizar Evento
            </Button>
          )}
          <Badge className="text-xs px-2.5 py-1" style={{ backgroundColor: CATEGORY_COLORS[event.categoria] || "#64748b" }}>
            {event.estado}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Estudiantes Inscritos</p>
                <h3 className="text-2xl font-bold mt-1 text-[#003366]">{students.length}</h3>
              </div>
              <Users className="size-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Categoría</p>
                <h3 className="text-lg font-bold mt-1 text-[#003366] truncate">{CATEGORY_LABEL[event.categoria] || event.categoria}</h3>
              </div>
              <CalendarDays className="size-8 text-indigo-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Horas Otorgadas</p>
                <h3 className="text-2xl font-bold mt-1 text-[#003366]">{event.duracion_horas} horas</h3>
              </div>
              <Clock className="size-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="control" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="control">Control de Asistencia</TabsTrigger>
          <TabsTrigger value="participantes">Participantes ({students.length})</TabsTrigger>
          <TabsTrigger value="detalle">Detalle del Evento</TabsTrigger>
        </TabsList>

        <TabsContent value="control" className="space-y-4">
          {event.estado === "EN_CURSO" ? (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#003366] text-base">QR de Asistencia Dinámico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl">
                      <QRCodeCanvas value={qrValue} size={220} level="M" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">Se regenera en:</span>
                      <p className="text-lg font-bold text-[#003366]">{formatTime(qrTimer)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-sm">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Tipo de registro QR</Label>
                      <div className="flex gap-2 mt-1">
                        <Button
                          variant={qrType === "ENTRADA" ? "default" : "outline"}
                          onClick={() => setQrType("ENTRADA")}
                          className="flex-1"
                          style={qrType === "ENTRADA" ? { backgroundColor: "#004B87" } : {}}
                        >
                          Entrada
                        </Button>
                        <Button
                          variant={qrType === "SALIDA" ? "default" : "outline"}
                          onClick={() => setQrType("SALIDA")}
                          className="flex-1"
                          style={qrType === "SALIDA" ? { backgroundColor: "#004B87" } : {}}
                        >
                          Salida
                        </Button>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-semibold text-[#003366] block">Código manual alternativo:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-mono font-bold tracking-widest text-[#003366] bg-white border px-3 py-1 rounded-lg">
                          {attendanceCode}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => {
                          navigator.clipboard.writeText(attendanceCode);
                          toast.success("Código copiado");
                        }}>
                          <Copy className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={generateAttendanceCode}>
                          <RefreshCw className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                {event.estado === "PROGRAMADO"
                  ? "Inicia el evento en la parte superior derecha para habilitar el control de asistencia."
                  : "El evento ha finalizado y el control de asistencia ya no está activo."}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="participantes">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-[#003366]">Estudiantes Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No hay estudiantes inscritos en este evento.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Número de Cuenta</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Certificado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const isSigned = firmadasSet.has(student.estudiante_cuenta) || 
                        !!localStorage.getItem(`cert_signed_${event.id}_${student.estudiante_cuenta}`);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="font-semibold">{student.estudiante_nombre}</TableCell>
                          <TableCell className="font-mono text-xs">{student.estudiante_cuenta}</TableCell>
                          <TableCell>
                            <Badge variant={student.estado === "INSCRITO" ? "secondary" : "outline"}>
                              {student.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right flex items-center justify-end gap-2">
                            {event.estado === "FINALIZADO" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPdfStudent(student);
                                    setShowSignatureModal(true);
                                  }}
                                >
                                  {isSigned ? "Firmado" : "Firmar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={!isSigned}
                                  onClick={() => handleDownloadPDF(student)}
                                >
                                  Descargar PDF
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detalle">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-[#003366]">Ficha Técnica del Evento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">Fecha y Hora</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(event.fecha_inicio)} ({event.hora_inicio} - {event.hora_fin})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-medium block">Ubicación / Lugar</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="size-4 text-[#004B87] shrink-0" />
                    {(() => {
                      const loc = event.lugar || event.ubicacion || "No especificado";
                      if (loc.includes("|")) {
                        const [bName, bLink] = loc.split("|");
                        return (
                          <a
                            href={bLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#004B87] hover:underline"
                          >
                            {bName}
                          </a>
                        );
                      }
                      return <span>{loc}</span>;
                    })()}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground font-medium block">Descripción</span>
                  <p className="text-slate-700 leading-relaxed mt-1">{event.descripcion}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signature and PDF preview modals */}
      {showSignatureModal && (
        <SignatureModal
          open={showSignatureModal}
          onCancel={() => setShowSignatureModal(false)}
          onConfirm={handleConfirmSignature}
        />
      )}
    </div>
  );
}
