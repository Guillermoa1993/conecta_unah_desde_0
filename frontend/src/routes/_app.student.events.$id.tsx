import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  MapPin,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABEL,
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  EVENTS,
  getStudentApprovedActivities,
  getInscripciones,
} from "@/lib/mock-data";
import { studentAttendanceRecords } from "@/lib/event-store";
import { useRole } from "@/lib/role-context";
import { InscriptionModal } from "@/components/app/InscriptionModal";
import { PersonalQrModal } from "@/components/app/PersonalQrModal";
import { useSurvey } from "@/lib/survey-context";
import { sendPushNotification } from "@/lib/notifications";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { generateConstanciaHtml, MESES } from "@/lib/constancia-pdf";
import { toast } from "sonner";
import { OtpModal } from "@/components/app/OtpModal";
import { getCurrentPosition, calculateDistance, TOLERANCE_METERS } from "@/lib/geolocation";

function getCertificadosStore(eventId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`certificados_${eventId}`) || "[]");
  } catch {
    return [];
  }
}
function addCertificado(eventId: string, studentId: string) {
  const list = getCertificadosStore(eventId);
  if (!list.includes(studentId)) {
    list.push(studentId);
    localStorage.setItem(`certificados_${eventId}`, JSON.stringify(list));
  }
}

export const Route = createFileRoute("/_app/student/events/$id")({
  component: EventDetailPage,
});

const CURRENT_STUDENT = "20211002345";

function EventDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useRole();
  const { triggerSurvey } = useSurvey();
  const eventoData = useMemo(() => EVENTS.find((e) => e.id === id), [id]);
  const [currentImg, setCurrentImg] = useState(0);
  const [insModal, setInsModal] = useState(false);
  const [personalQrModal, setPersonalQrModal] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [salidaConfirmOpen, setSalidaConfirmOpen] = useState(false);
  const [attendanceMode, setAttendanceMode] = useState<"asistencia" | "salida">("asistencia");
  const [attendanceLocation, setAttendanceLocation] = useState<{
    latitud_entrada?: number;
    longitud_entrada?: number;
    ubicacion_entrada_validada?: boolean | null;
    latitud_salida?: number;
    longitud_salida?: number;
    ubicacion_salida_validada?: boolean | null;
  }>({});
  const [asistenciaRegistrada, setAsistenciaRegistrada] = useState(
    () => localStorage.getItem(`asistencia_registrada_${id}`) === "true",
  );
  const [salidaRegistrada, setSalidaRegistrada] = useState(
    () => localStorage.getItem(`salida_registrada_${id}`) === "true",
  );

  const handleOpenAttendance = useCallback(
    async (mode: "asistencia" | "salida") => {
      const studentId = user.id || CURRENT_STUDENT;
      const inscripciones = getInscripciones(id, 100);
      const estaInscrito = inscripciones.some((ins) => ins.estudiante_id === studentId);
      if (!estaInscrito) {
        toast.error("No puedes registrar tu asistencia porque no te inscribiste a este evento.");
        return;
      }
      if (
        studentAttendanceRecords[id]?.[studentId] ||
        localStorage.getItem(`asistencia_registrada_${id}`) === "true"
      ) {
        toast.error("Ya registraste tu asistencia para este evento.");
        return;
      }
      setAttendanceMode(mode);
      const position = await getCurrentPosition();
      if (position) {
        const { latitude, longitude } = position.coords;
        let isValid: boolean | null = null;
        if (event?.latitud != null && event?.longitud != null) {
          const distance = calculateDistance(latitude, longitude, eventoData.latitud, eventoData.longitud);
          isValid = distance <= TOLERANCE_METERS;
        }
        if (mode === "asistencia") {
          setAttendanceLocation({
            latitud_entrada: latitude,
            longitud_entrada: longitude,
            ubicacion_entrada_validada: isValid,
          });
        } else {
          setAttendanceLocation({
            latitud_salida: latitude,
            longitud_salida: longitude,
            ubicacion_salida_validada: isValid,
          });
        }
      } else {
        if (mode === "asistencia") {
          setAttendanceLocation({ ubicacion_entrada_validada: null });
        } else {
          setAttendanceLocation({ ubicacion_salida_validada: null });
        }
      }
      setOtpModalOpen(true);
    },
    [event, id, user.id],
  );

  useEffect(() => {
    const saved = localStorage.getItem(`enrolled_${id}`);
    if (saved === "true") setIsEnrolled(true);
  }, [id]);

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h2 className="text-xl font-semibold">Evento no encontrado</h2>
        <Button asChild className="mt-6">
          <Link to="/student/events">Volver</Link>
        </Button>
      </div>
    );
  }

  const allImages = [eventoData.imagen_url, ...(eventoData.imagenes_adicionales || [])].filter(Boolean);
  const carrera = user.carrera || "tu carrera";

  const approved = getStudentApprovedActivities(CURRENT_STUDENT);
  const hoursInCategory = approved
    .filter((a) => a.categoria === eventoData.categoria)
    .reduce((s, a) => s + a.horas_acreditadas, 0);

  const handleCancel = () => {
    setIsEnrolled(false);
    localStorage.removeItem(`enrolled_${id}`);
    setCancelOpen(false);
    toast("Inscripción cancelada correctamente.", {
      style: { backgroundColor: "#ef4444", color: "white" },
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate({ to: "/student/events" })}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="size-4" /> Atrás
        </button>
        <div className="flex flex-wrap gap-2 justify-end items-center">
          {/* INTEGRACIÓN PENDIENTE: Esta funcionalidad de inscripción es responsabilidad del Grupo 2. Los componentes UI están listos, falta conectar con su API/lógica de backend. */}
          {!isEnrolled && (
            <Button
              size="sm"
              className="gap-1.5"
              style={{ backgroundColor: "#004B87" }}
              onClick={() => setInsModal(true)}
            >
              <QrCode className="size-4" /> Inscribirse
            </Button>
          )}
          {isEnrolled && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#004B87", color: "#004B87" }}
                onClick={() => setPersonalQrModal(true)}
              >
                <QrCode className="size-4" /> Generar QR
              </Button>
              {!asistenciaRegistrada && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  style={{ borderColor: "#22c55e", color: "#22c55e" }}
                  onClick={() => handleOpenAttendance("asistencia")}
                >
                  <MapPin className="size-4" /> Registrar asistencia
                </Button>
              )}
              {asistenciaRegistrada && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                  style={{ backgroundColor: "#dcfce7", color: "#166534" }}
                >
                  <CheckCircle2 className="size-3.5" /> Asistencia registrada
                </span>
              )}
              {asistenciaRegistrada && !salidaRegistrada && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
                  onClick={() => handleOpenAttendance("salida")}
                >
                  <LogOut className="size-4" /> Registrar salida
                </Button>
              )}
              {salidaRegistrada && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                  style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
                >
                  <CheckCircle2 className="size-3.5" /> Salida registrada
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
                onClick={() => setCancelOpen(true)}
              >
                <X className="size-4" /> Cancelar inscripción
              </Button>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
                style={{ backgroundColor: "#dcfce7", color: "#166534" }}
              >
                <CheckCircle2 className="size-3.5" /> Inscrito
              </span>
            </>
          )}
        </div>
      </div>

      {/* Eligibility bar */}
      <div
        className="rounded-lg p-3 flex items-center gap-2 text-sm mb-6"
        style={{ backgroundColor: "#f0fdf4", color: "#166534" }}
      >
        <CheckCircle2 className="size-4 shrink-0" />
        <span>
          <strong>{carrera}</strong> está disponible para inscripción
        </span>
      </div>

      {/* Portada */}
      {eventoData.portada_url ? (
        <div className="rounded-xl overflow-hidden border bg-card shadow-soft mb-6">
          <img src={eventoData.portada_url} alt="" className="w-full h-52 object-cover" />
        </div>
      ) : (
        <div
          className="rounded-xl border bg-card shadow-soft h-40 grid place-items-center mb-6"
          style={{ backgroundColor: (CATEGORY_COLORS[eventoData.categoria] || "#64748b") + "15" }}
        >
          <div
            className="size-20 rounded-full grid place-items-center"
            style={{ backgroundColor: (CATEGORY_COLORS[eventoData.categoria] || "#64748b") + "25" }}
          >
            <div
              className="text-3xl font-bold"
              style={{ color: CATEGORY_COLORS[eventoData.categoria] || "#64748b" }}
            >
              {(CATEGORY_LABEL as any)[eventoData.categoria]?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-[65%_35%] gap-8">
        <div className="space-y-6">
          <Section title="Información General">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Field label="Código de actividad" value={eventoData.codigo_actividad || eventoData.id} />
              <Field
                label="Horario"
                value={`${eventoData.fecha_inicio.slice(11, 16)} - ${eventoData.fecha_fin.slice(11, 16)}`}
              />
              <Field label="Fecha de Inicio" value={eventoData.fecha_inicio.slice(0, 10)} />
              <Field label="Fecha de Finalización" value={eventoData.fecha_fin.slice(0, 10)} />
              <Field label="Tipo de actividad" value={eventoData.tipo_actividad || "Presencial"} />
              <Field label="Ubicación completa" value={eventoData.lugar} />
            </div>
          </Section>

          <Section title="Modalidades de la Actividad">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="pb-2 font-medium">Modalidad</th>
                  <th className="pb-2 font-medium">Asistencias</th>
                  <th className="pb-2 font-medium">Ámbitos</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b last:border-0">
                  <td className="py-3">{eventoData.tipo_actividad || "Presencial"}</td>
                  <td className="py-3">{eventoData.asistencias_requeridas || 1}</td>
                  <td className="py-3">
                    <span style={{ color: "#004B87" }} className="font-medium">
                      {eventoData.duracion_horas} horas en {CATEGORY_LABEL_LONG[eventoData.categoria]}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section title="Entidades Organizadoras">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="pb-2 font-medium">Entidad Organizadora</th>
                  <th className="pb-2 font-medium">Roles de la Entidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3">{eventoData.entidad_organizadora || "No especificada"}</td>
                  <td className="py-3">Organizador principal</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <div className="pt-4 border-t">
            <div className="text-[10px] font-semibold mb-1" style={{ color: "#f97316" }}>
              Solo pruebas
            </div>
            <Button
              className="w-full gap-1.5 text-white"
              style={{ backgroundColor: "#f97316" }}
              onClick={() => {
                toast("El evento ha finalizado.", {
                  style: { backgroundColor: "#004B87", color: "white" },
                  duration: 3000,
                });
                setTimeout(() => {
                  triggerSurvey(eventoData.id, eventoData.titulo);
                  sendPushNotification(
                    `Encuesta pendiente — ${eventoData.titulo}`,
                    "Cuéntanos cómo te fue. Tu opinión ayuda a mejorar los próximos eventos.",
                    window.location.href,
                  );
                }, 3000);
              }}
            >
              Simular fin de evento
            </Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start space-y-6">
          <div className="rounded-xl border bg-card shadow-card p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
              Cupos Disponibles
            </div>
            <div className="text-lg font-bold" style={{ color: "#22c55e" }}>
              {eventoData.cupo_maximo} disponibles
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Modalidad: {eventoData.tipo_actividad || "Presencial"}
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-card overflow-hidden">
            {allImages.length > 0 ? (
              <div className="relative">
                <img src={allImages[currentImg]} alt="" className="w-full h-52 object-cover" />
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImg((p) => (p === 0 ? allImages.length - 1 : p - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 grid place-items-center shadow hover:bg-white transition"
                    >
                      <ChevronLeft className="size-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImg((p) => (p === allImages.length - 1 ? 0 : p + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-white/80 grid place-items-center shadow hover:bg-white transition"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {allImages.map((_, i) => (
                        <div
                          key={i}
                          className={`size-1.5 rounded-full ${i === currentImg ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <PlaceholderImage category={eventoData.categoria} />
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-card p-5">
            <h3 className="text-sm font-semibold" style={{ color: "#004B87" }}>
              Descripción de la actividad
            </h3>
            <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{eventoData.descripcion}</p>
          </div>
        </aside>
      </div>

      <InscriptionModal
        open={insModal}
        onClose={() => setInsModal(false)}
        eventTitle={eventoData.titulo}
        tipoActividad={eventoData.tipo_actividad}
        categoria={eventoData.categoria}
        horasCompletadas={hoursInCategory}
        fecha={eventoData.fecha_inicio.slice(0, 10)}
        horario={`${eventoData.fecha_inicio.slice(11, 16)} - ${eventoData.fecha_fin.slice(11, 16)}`}
        horas={eventoData.duracion_horas}
        onConfirm={() => {
          setIsEnrolled(true);
          localStorage.setItem(`enrolled_${id}`, "true");
        }}
      />

      <PersonalQrModal
        open={personalQrModal}
        onClose={() => setPersonalQrModal(false)}
        eventId={eventoData.id}
        studentId={user.id || CURRENT_STUDENT}
        studentName={user.name}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2" style={{ color: "#991b1b" }}>
              <AlertTriangle className="size-5" /> ¿Cancelar inscripción?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cancelar tu inscripción a <strong>{eventoData.titulo}</strong>. Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="text-white"
              style={{ backgroundColor: "#ef4444" }}
            >
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OtpModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        eventId={eventoData.id}
        studentId={user.id || CURRENT_STUDENT}
        ubicacionValidada={
          attendanceMode === "asistencia"
            ? attendanceLocation.ubicacion_entrada_validada
            : attendanceLocation.ubicacion_salida_validada
        }
        attendanceMode={attendanceMode}
        mode="email_otp"
        onSuccess={(mode) => {
          if (mode === "asistencia") {
            localStorage.setItem(`asistencia_registrada_${id}`, "true");
            setAsistenciaRegistrada(true);
          } else {
            localStorage.setItem(`salida_registrada_${id}`, "true");
            setSalidaRegistrada(true);
            setSalidaConfirmOpen(true);
            if (event) {
              addCertificado(eventoData.id, user.id || CURRENT_STUDENT);
              const now = new Date();
              const html = generateConstanciaHtml({
                estudiante_nombre: user.name,
                estudiante_carrera: user.carrera || "No especificada",
                estudiante_cuenta: user.id || CURRENT_STUDENT,
                tutor_nombre: eventoData.tutor_nombre,
                evento_nombre: eventoData.titulo,
                evento_mes_anio: `${MESES[now.getMonth()]} ${now.getFullYear()}`,
                horas: eventoData.duracion_horas,
                categoria: eventoData.categoria,
                voae_nombre: "Pendiente de firma",
                voae_cargo: "Pendiente",
                voae_departamento: "VOAE",
                voae_codigo: "PENDIENTE",
                fecha_dia: now.getDate(),
                fecha_mes: MESES[now.getMonth()],
                fecha_anio: now.getFullYear(),
              });
              const win = window.open("", "_blank");
              if (win) {
                win.document.write(html);
                win.document.close();
                win.focus();
                setTimeout(() => win.print(), 500);
              }
            }
          }
        }}
      />

      {/* Salida confirmation modal */}
      <AlertDialog open={salidaConfirmOpen} onOpenChange={setSalidaConfirmOpen}>
        <AlertDialogContent className="max-w-sm text-center">
          <div className="py-4">
            <div
              className="size-16 mx-auto rounded-full grid place-items-center animate-in zoom-in-95"
              style={{ backgroundColor: "#22c55e20" }}
            >
              <CheckCircle2 className="size-8" style={{ color: "#22c55e" }} />
            </div>
            <h2 className="text-xl font-bold mt-4" style={{ color: "#22c55e" }}>
              ¡Asistencia registrada!
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Este evento generó tu certificado automáticamente. Te avisaremos cuando VOAE lo
              apruebe.
            </p>
            <Button
              className="mt-6 text-white px-8"
              style={{ backgroundColor: "#004B87" }}
              onClick={() => setSalidaConfirmOpen(false)}
            >
              Entendido
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <div className="px-5 py-3 border-b" style={{ backgroundColor: "#F4F6F8" }}>
        <h2 className="font-semibold text-sm" style={{ color: "#003366" }}>
          {title}
        </h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium mt-0.5">{value}</div>
    </div>
  );
}

function PlaceholderImage({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || "#64748b";
  return (
    <div className="w-full h-52 grid place-items-center" style={{ backgroundColor: color + "15" }}>
      <div
        className="size-16 rounded-full grid place-items-center"
        style={{ backgroundColor: color + "25" }}
      >
        <div className="text-2xl font-bold" style={{ color }}>
          {CATEGORY_LABEL[category as keyof typeof CATEGORY_LABEL]?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  );
}
