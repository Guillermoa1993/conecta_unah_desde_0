import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  MapPin,
  ImagePlus,
  QrCode,
  Download,
  Upload,
  X,
  Send,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeCanvas } from "qrcode.react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  CENTROS_REGIONALES,
  type EventCategory,
} from "@/lib/mock-data";
import { eventQrTokens, eventQrData } from "@/lib/event-store";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/tutor/create")({
  component: CreateEvent,
});

type FormData = {
  titulo: string;
  categoria: EventCategory;
  tipo_actividad: string;
  tipo_evento: "HORAS_VOAE" | "RECREACION";
  centro_regional: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  enlace_virtual: string;
  cupo_maximo: string;
  duracion_horas: string;
  tipo_duracion: "TOTALES" | "DIARIAS";
  requiere_inscripcion: boolean;
  visibilidad: "PUBLICO" | "PRIVADO";
  tutor_responsable: string;
  usa_imagen_personalizada: boolean;
  latitud: string;
  longitud: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const CARRERAS_LIST = [
  "Ingeniería en Sistemas",
  "Medicina",
  "Derecho",
  "Arquitectura",
  "Psicología",
  "Ingeniería Civil",
  "Administración de Empresas",
  "Biología",
];

const today = () => new Date().toISOString().slice(0, 10);

function CreateEvent() {
  const { user } = useRole();
  const [step, setStep] = useState<"form" | "success">("form");
  const [data, setData] = useState<FormData>({
    titulo: "",
    categoria: "ACADEMICO",
    tipo_actividad: "Presencial",
    tipo_evento: "HORAS_VOAE",
    centro_regional: "Ciudad Universitaria",
    descripcion: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
    enlace_virtual: "",
    cupo_maximo: "",
    duracion_horas: "",
    tipo_duracion: "TOTALES",
    requiere_inscripcion: true,
    visibilidad: "PUBLICO",
    tutor_responsable: user.name || "Dr. Carlos Mendoza",
    usa_imagen_personalizada: false,
    latitud: "",
    longitud: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [images, setImages] = useState<string[]>([]);
  const [portadaIndex, setPortadaIndex] = useState<number | null>(null);
  const [imgPortada, setImgPortada] = useState<string | null>(null);
  const [invitados, setInvitados] = useState<string[]>([]);
  const [invitadoInput, setInvitadoInput] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragOverPortada, setDragOverPortada] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const requiredFields = (): (keyof FormData)[] => {
    const base: (keyof FormData)[] = [
      "titulo",
      "categoria",
      "tipo_actividad",
      "descripcion",
      "fecha_inicio",
      "fecha_fin",
      "hora_inicio",
      "hora_fin",
      "cupo_maximo",
      "duracion_horas",
    ];
    if (data.tipo_actividad === "Virtual") {
      base.push("enlace_virtual");
    } else if (data.tipo_actividad === "Híbrido") {
      base.push("ubicacion", "enlace_virtual");
    } else {
      base.push("ubicacion");
    }
    return base;
  };

  const TITULO_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-()]+$/;
  const DESC_RE = /^[^<>{}[\]]*$/;
  const ENTIDAD_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.-]+$/;
  const UBICACION_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.\-#]+$/;

  const filterInput = (field: string, value: string): string => {
    if (field === "titulo")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-()]/g, "").slice(0, 150);
    if (field === "descripcion") return value.replace(/[<>{}[\]]/g, "").slice(0, 500);
    if (field === "entidad_organizadora")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.-]/g, "").slice(0, 50);
    if (field === "ubicacion")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.\-#]/g, "").slice(0, 200);
    return value;
  };

  const validate = (d: FormData): FormErrors => {
    const e: FormErrors = {};
    if (!d.titulo.trim()) e.titulo = "El título del evento es obligatorio";
    else if (d.titulo.length > 150) e.titulo = "El título no puede exceder 150 caracteres";
    else if (!TITULO_RE.test(d.titulo)) e.titulo = "Caracteres no permitidos detectados";
    if (!d.descripcion.trim()) e.descripcion = "La descripción del evento es obligatoria";
    else if (d.descripcion.length > 500)
      e.descripcion = "La descripción no puede exceder 500 caracteres";
    else if (!DESC_RE.test(d.descripcion)) e.descripcion = "Caracteres no permitidos detectados";
    if (!d.fecha_inicio) e.fecha_inicio = "La fecha de inicio es obligatoria";
    else if (d.fecha_inicio < today()) e.fecha_inicio = "No puedes seleccionar una fecha pasada";
    if (!d.fecha_fin) e.fecha_fin = "La fecha de finalización es obligatoria";
    else if (d.fecha_fin < d.fecha_inicio)
      e.fecha_fin = "La fecha de finalización debe ser igual o posterior a la fecha de inicio.";
    if (!d.hora_inicio) e.hora_inicio = "El horario de inicio es obligatorio";
    if (!d.hora_fin) e.hora_fin = "El horario de fin es obligatorio";
    if (
      d.fecha_inicio &&
      d.fecha_fin &&
      d.fecha_inicio === d.fecha_fin &&
      d.hora_inicio &&
      d.hora_fin &&
      d.hora_fin <= d.hora_inicio
    ) {
      e.hora_fin = "El horario de fin debe ser posterior al horario de inicio.";
    }
    if (d.tipo_actividad !== "Virtual") {
      if (!d.ubicacion.trim()) e.ubicacion = "La ubicación física es obligatoria";
    }
    if (d.tipo_actividad !== "Presencial") {
      if (!d.enlace_virtual.trim()) {
        e.enlace_virtual = "El enlace de la sesión virtual es obligatorio";
      } else if (!/^https?:\/\/.+/.test(d.enlace_virtual.trim())) {
        e.enlace_virtual = "Debe ser una URL válida (https://...)";
      }
    }
    const cupo = parseInt(d.cupo_maximo);
    if (!d.cupo_maximo.trim() || isNaN(cupo) || cupo < 1)
      e.cupo_maximo = "El cupo máximo debe ser al menos 1";
    const horas = parseFloat(d.duracion_horas);
    if (!d.duracion_horas.trim() || isNaN(horas) || horas <= 0)
      e.duracion_horas = "Las horas deben ser mayores a 0";
    if (!d.visibilidad) e.visibilidad = "Selecciona la visibilidad del evento";
    return e;
  };

  const set = (field: keyof FormData, value: string | string[] | boolean) => {
    const filtered = typeof value === "string" ? filterInput(field, value) : value;
    const next = { ...data, [field]: filtered };
    setData(next);
    if (touched[field]) {
      const errs = validate(next);
      setErrors(errs);
    }
  };

  const blur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(data);
    setErrors(errs);
  };

  const allRequiredFilled = requiredFields().every((f) => {
    const v = data[f];
    if (Array.isArray(v)) return true;
    return typeof v === "string" && v.trim().length > 0;
  });
  const noErrors = Object.keys(validate(data)).length === 0;
  const canSubmit = allRequiredFilled && noErrors;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Usa JPG, PNG o WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 5MB" });
      return;
    }
    if (images.length >= 4) {
      toast.error("Límite alcanzado", { description: "Máximo 4 imágenes" });
      return;
    }
    setImages((prev) => [...prev, URL.createObjectURL(file)]);
  };

  const handlePortadaFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Usa JPG, PNG o WEBP para la portada" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 5MB para la portada" });
      return;
    }
    setImgPortada(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    setTouched(Object.fromEntries(requiredFields().map((f) => [f, true])) as any);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    const estado = data.tipo_evento === "RECREACION" ? "PROGRAMADO" : "PENDIENTE_APROBACION";
    const submissionData = { ...data, estado, creado_por_rol: "TUTOR" };
    setStep("success");
  };

  if (step === "success") {
    const mockEventId = `evt-${Date.now()}`;
    const token = crypto.randomUUID();
    const qrUrl = `https://conectapumas.app/inscribirse/${mockEventId}/${token}`;
    eventQrTokens[mockEventId] = { token, qrUrl };
    eventQrData[mockEventId] = { type: "auto" };

    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-20 mx-auto rounded-full bg-amber-50 grid place-items-center mb-5">
          <Send className="size-10" style={{ color: "#92400e" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "var(--puma-dark)" }}>
          {data.tipo_evento === "RECREACION"
            ? "¡Tu evento fue publicado!"
            : "¡Evento enviado a VOAE!"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          {data.tipo_evento === "RECREACION"
            ? "Ya es visible para los estudiantes."
            : "Tu evento está pendiente de aprobación. Recibirás una notificación cuando VOAE lo revise."}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge
            variant={data.visibilidad === "PUBLICO" ? "secondary" : "outline"}
            className={cn(
              "text-xs px-3 py-1",
              data.visibilidad === "PUBLICO"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-amber-100 text-amber-800 border-amber-300",
            )}
          >
            {data.visibilidad === "PUBLICO" ? "Público" : "Privado"}
          </Badge>
          {data.visibilidad === "PRIVADO" && (
            <span className="text-xs text-muted-foreground">
              {invitados.length} invitado{invitados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div
          className="mt-4 mx-auto w-64 aspect-square rounded-xl border-2 p-4 grid place-items-center"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
          ref={qrRef}
        >
          <QRCodeCanvas value={qrUrl} size={220} level="M" />
        </div>
        <div className="mt-3 text-sm font-semibold" style={{ color: "var(--puma-dark)" }}>
          {data.titulo}
        </div>
        <div className="flex gap-3 mt-5 justify-center">
          <Button
            className="gap-1.5"
            style={{ backgroundColor: "var(--puma-blue)" }}
            onClick={() => {
              const canvas = qrRef.current?.querySelector("canvas");
              if (!canvas) {
                toast.error("Error al descargar");
                return;
              }
              const link = document.createElement("a");
              link.download = `qr-${data.titulo.replace(/\s/g, "-")}.png`;
              link.href = canvas.toDataURL("image/png");
              link.click();
              toast.success("QR descargado");
            }}
          >
            <Download className="size-4" /> Descargar QR
          </Button>
          <Button asChild variant="outline" className="gap-1.5">
            <Link to="/tutor">Ir al panel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/tutor"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition mb-6"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <PageHeader
        title="Crear nuevo evento"
        description="Completa todos los campos obligatorios (*) para publicar el evento."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 */}
        <Section icon={FileText} title="Información básica" desc="Datos generales del evento.">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldLabel label="Título del evento" required />
              <Input
                value={data.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                onBlur={() => blur("titulo")}
                placeholder="Ej. Taller de Investigación Académica"
                className={cn("mt-1.5 h-11", errors.titulo && "border-red-500")}
              />
              {errors.titulo && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.titulo}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Categoría o ámbito" required />
              <Select value={data.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger className={cn("mt-1.5 h-11", errors.categoria && "border-red-500")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL_LONG) as EventCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL_LONG[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel label="Tipo de actividad" required />
              <Select value={data.tipo_actividad} onValueChange={(v) => set("tipo_actividad", v)}>
                <SelectTrigger
                  className={cn("mt-1.5 h-11", errors.tipo_actividad && "border-red-500")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Híbrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label="Descripción del evento" required />
              <Textarea
                value={data.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                onBlur={() => blur("descripcion")}
                rows={4}
                placeholder="Describe los objetivos y contenido del evento…"
                className={cn("mt-1.5", errors.descripcion && "border-red-500")}
              />
              {errors.descripcion && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.descripcion}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel label="Tutor o facilitador responsable" />
              <Input
                value={data.tutor_responsable}
                readOnly
                className="mt-1.5 h-11 bg-secondary/50 cursor-default"
              />
              <p className="text-xs flex items-center gap-1 mt-1.5" style={{ color: "#22c55e" }}>
                <CheckCircle2 className="size-3.5" /> Detectado automáticamente desde tu sesión.
              </p>
            </div>
            <div>
              <FieldLabel label="Visibilidad del evento" required />
              <Select value={data.visibilidad} onValueChange={(v) => set("visibilidad", v)}>
                <SelectTrigger
                  className={cn("mt-1.5 h-11", errors.visibilidad && "border-red-500")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLICO">Público</SelectItem>
                  <SelectItem value="PRIVADO">Privado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Público: visible para todos los estudiantes. Privado: solo estudiantes invitados.
              </p>
            </div>
            <div>
              <FieldLabel label="Tipo de evento" required />
              <Select
                value={data.tipo_evento}
                onValueChange={(v) => set("tipo_evento", v as "HORAS_VOAE" | "RECREACION")}
              >
                <SelectTrigger className={cn("mt-1.5 h-11")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HORAS_VOAE">Horas VOAE (Artículo 140)</SelectItem>
                  <SelectItem value="RECREACION">Evento de recreación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel label="Centro regional" required />
              <Select value={data.centro_regional} onValueChange={(v) => set("centro_regional", v)}>
                <SelectTrigger className={cn("mt-1.5 h-11")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CENTROS_REGIONALES.map((cr) => (
                    <SelectItem key={cr} value={cr}>
                      {cr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {data.visibilidad === "PRIVADO" && (
            <div className="mt-4 space-y-2">
              <FieldLabel label="Estudiantes invitados" />
              <div className="flex gap-2">
                <Input
                  value={invitadoInput}
                  onChange={(e) => setInvitadoInput(e.target.value)}
                  placeholder="Buscar por nombre o número de cuenta…"
                  className="h-11"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 shrink-0"
                  onClick={() => {
                    if (!invitadoInput.trim()) return;
                    setInvitados((prev) => [...prev, invitadoInput.trim()]);
                    setInvitadoInput("");
                  }}
                >
                  Invitar
                </Button>
              </div>
              {invitados.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {invitados.map((inv, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs px-3 py-1.5"
                    >
                      {inv}
                      <button
                        type="button"
                        onClick={() => setInvitados((p) => p.filter((_, j) => j !== i))}
                        className="hover:text-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Section 2 */}
        <Section icon={CalendarDays} title="Fecha y lugar" desc="Cuándo y dónde se realizará.">
          <div className="grid sm:grid-cols-4 gap-4">
            <div>
              <FieldLabel label="Fecha de inicio" required />
              <Input
                type="date"
                value={data.fecha_inicio}
                onChange={(e) => set("fecha_inicio", e.target.value)}
                onBlur={() => blur("fecha_inicio")}
                min={today()}
                className={cn("mt-1.5 h-11", errors.fecha_inicio && "border-red-500")}
              />
              {errors.fecha_inicio && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.fecha_inicio}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Fecha de finalización" required />
              <Input
                type="date"
                value={data.fecha_fin}
                onChange={(e) => set("fecha_fin", e.target.value)}
                onBlur={() => blur("fecha_fin")}
                min={data.fecha_inicio || today()}
                className={cn("mt-1.5 h-11", errors.fecha_fin && "border-red-500")}
              />
              {errors.fecha_fin && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.fecha_fin}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Horario de inicio" required />
              <Input
                type="time"
                value={data.hora_inicio}
                onChange={(e) => set("hora_inicio", e.target.value)}
                onBlur={() => blur("hora_inicio")}
                className={cn("mt-1.5 h-11", errors.hora_inicio && "border-red-500")}
              />
              {errors.hora_inicio && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.hora_inicio}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Horario de fin" required />
              <Input
                type="time"
                value={data.hora_fin}
                onChange={(e) => set("hora_fin", e.target.value)}
                onBlur={() => blur("hora_fin")}
                className={cn("mt-1.5 h-11", errors.hora_fin && "border-red-500")}
              />
              {errors.hora_fin && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.hora_fin}
                </p>
              )}
            </div>
            {data.tipo_actividad !== "Virtual" && (
              <>
                <div className="sm:col-span-4">
                  <FieldLabel label="Ubicación física" required />
                  <Input
                    value={data.ubicacion}
                    onChange={(e) => set("ubicacion", e.target.value)}
                    onBlur={() => blur("ubicacion")}
                    placeholder="Ej. Aula Magna, Edificio A1"
                    className={cn("mt-1.5 h-11", errors.ubicacion && "border-red-500")}
                  />
                  {errors.ubicacion && (
                    <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                      {errors.ubicacion}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-4">
                  <p className="text-sm font-medium mt-2">Selecciona la ubicación en el mapa:</p>
                  <div className="mt-2 w-full h-[300px] rounded-xl border-2 border-dashed bg-gray-100 grid place-items-center text-muted-foreground text-sm">
                    Mapa interactivo - Las coordenadas se guardarán al seleccionar ubicación
                  </div>
                </div>
              </>
            )}
            {data.tipo_actividad !== "Presencial" && (
              <div className="sm:col-span-4">
                <FieldLabel label="Enlace de la sesión virtual" required />
                <Input
                  value={data.enlace_virtual}
                  onChange={(e) => set("enlace_virtual", e.target.value)}
                  onBlur={() => blur("enlace_virtual")}
                  placeholder="Ej. https://meet.google.com/..."
                  className={cn("mt-1.5 h-11", errors.enlace_virtual && "border-red-500")}
                />
                {errors.enlace_virtual && (
                  <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                    {errors.enlace_virtual}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Este enlace será visible solo para estudiantes inscritos.
                </p>
              </div>
            )}
          </div>
        </Section>

        {/* Section 3 */}
        <Section
          icon={MapPin}
          title="Capacidad y horas"
          desc="Participantes, duración y restricciones."
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel label="Cupo máximo" required />
              <Input
                type="number"
                min={1}
                value={data.cupo_maximo}
                onChange={(e) => set("cupo_maximo", e.target.value)}
                onBlur={() => blur("cupo_maximo")}
                placeholder="50"
                className={cn("mt-1.5 h-11", errors.cupo_maximo && "border-red-500")}
              />
              {errors.cupo_maximo && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.cupo_maximo}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Duración en horas" required />
              <div className="flex gap-2 mt-1.5">
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={data.duracion_horas}
                  onChange={(e) => set("duracion_horas", e.target.value)}
                  onBlur={() => blur("duracion_horas")}
                  placeholder="3"
                  className={cn("h-11 w-24", errors.duracion_horas && "border-red-500")}
                />
                <Select
                  value={data.tipo_duracion}
                  onValueChange={(v) => set("tipo_duracion", v as "TOTALES" | "DIARIAS")}
                >
                  <SelectTrigger className="h-11 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOTALES">Horas totales</SelectItem>
                    <SelectItem value="DIARIAS">Horas diarias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.tipo_duracion === "DIARIAS" &&
                data.fecha_inicio &&
                data.fecha_fin &&
                data.duracion_horas && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Total estimado:{" "}
                    {(parseFloat(data.duracion_horas) *
                      (new Date(data.fecha_fin).getTime() -
                        new Date(data.fecha_inicio).getTime())) /
                      86400000 +
                      1}{" "}
                    horas ({data.duracion_horas}h ×{" "}
                    {Math.round(
                      (new Date(data.fecha_fin).getTime() - new Date(data.fecha_inicio).getTime()) /
                        86400000,
                    ) + 1}{" "}
                    días)
                  </p>
                )}
              {errors.duracion_horas && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.duracion_horas}
                </p>
              )}
            </div>
            <div className="sm:col-span-3">
              <FieldLabel label="¿Este evento requiere inscripción previa?" required />
              <Select
                value={data.requiere_inscripcion ? "true" : "false"}
                onValueChange={(v) => set("requiere_inscripcion", v === "true")}
              >
                <SelectTrigger className={cn("mt-1.5 h-11")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Sí</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="sm:col-span-3 pt-4 border-t mt-4">
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel label="¿Deseas agregar imágenes del evento?" />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si no agregas imágenes, se usará un placeholder con las iniciales de la categoría.
                </p>
              </div>
              <Switch
                checked={data.usa_imagen_personalizada}
                onCheckedChange={(v) => set("usa_imagen_personalizada", v)}
                style={
                  data.usa_imagen_personalizada
                    ? { backgroundColor: "var(--puma-blue)" }
                    : undefined
                }
              />
            </div>
          </div>
        </Section>

        {/* Imagen de portada */}
        <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--puma-light-gray)" }}>
            <h2 className="font-semibold text-sm" style={{ color: "var(--puma-dark)" }}>
              Imagen de portada{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </h2>
          </div>
          <div className="p-5">
            <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
              Si subes una imagen de portada, reemplazará el placeholder con las iniciales de la
              categoría en la parte superior del evento.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverPortada(true);
              }}
              onDragLeave={() => setDragOverPortada(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverPortada(false);
                handlePortadaFile(e.dataTransfer.files[0]);
              }}
              className={cn(
                "relative rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer",
                dragOverPortada
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/30 hover:border-primary/40",
              )}
              onClick={() => portadaInputRef.current?.click()}
            >
              <input
                ref={portadaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handlePortadaFile(e.target.files?.[0])}
              />
              {imgPortada ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={imgPortada} alt="" className="max-h-32 rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImgPortada(null);
                    }}
                    className="text-xs underline"
                    style={{ color: "#ef4444" }}
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-8 text-muted-foreground/50" />
                  <div className="text-sm font-medium">
                    Arrastra una imagen o haz clic para subir{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </div>
                  <div className="text-xs text-muted-foreground">JPG, PNG o WEBP · Máximo 5MB</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {data.usa_imagen_personalizada && (
          <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
            <div className="p-6 space-y-4">
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Solo se permiten imágenes de hasta 5MB en formato JPG, PNG o WEBP. Hasta 4 imágenes.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
                className={cn(
                  "relative rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer",
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/30 hover:border-primary/40",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-8 text-muted-foreground/50" />
                  <div className="text-sm font-medium">
                    Arrastra una imagen o haz clic para subir
                  </div>
                  <div className="text-xs text-muted-foreground">
                    JPG, PNG o WEBP · Máximo 5MB · Hasta 4 imágenes
                  </div>
                </div>
              </div>

              {images.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {images.length}/4 imágenes — Haz clic en la estrella para seleccionar portada
                  </p>
                  <div className="grid grid-cols-4 gap-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative group">
                        <div
                          className={cn(
                            "relative aspect-square rounded-lg overflow-hidden border-2",
                            portadaIndex === i
                              ? "border-[var(--puma-blue)] ring-2 ring-[var(--puma-blue)]/20"
                              : "border-border",
                          )}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPortadaIndex(i)}
                            className={cn(
                              "absolute top-1.5 left-1.5 size-7 rounded-full grid place-items-center transition cursor-pointer",
                              portadaIndex === i
                                ? "text-[var(--puma-gold)] drop-shadow-md"
                                : "text-white/80 hover:text-white bg-black/30 hover:bg-black/50",
                            )}
                            title={portadaIndex === i ? "Portada actual" : "Marcar como portada"}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="size-5"
                              fill={portadaIndex === i ? "var(--puma-gold)" : "none"}
                              stroke="currentColor"
                              strokeWidth={portadaIndex === i ? 0 : 1.5}
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImages((p) => p.filter((_, j) => j !== i));
                              if (portadaIndex === i) setPortadaIndex(null);
                              else if (portadaIndex !== null && portadaIndex > i)
                                setPortadaIndex(portadaIndex - 1);
                            }}
                            className="absolute top-1.5 right-1.5 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                        {portadaIndex === i && (
                          <p
                            className="text-[10px] text-center mt-1 font-semibold"
                            style={{ color: "var(--puma-blue)" }}
                          >
                            Portada
                          </p>
                        )}
                      </div>
                    ))}
                    {images.length < 4 && (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground/50 cursor-pointer transition hover:border-primary/40"
                      >
                        <Upload className="size-6" />
                      </div>
                    )}
                  </div>
                  {portadaIndex === null && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Selecciona una imagen como portada o no se usará ninguna (se mostrará el
                      placeholder por categoría)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 5 - QR */}
        <Section icon={QrCode} title="Código QR de inscripción" desc="Generación automática de QR.">
          <p className="text-sm text-muted-foreground">
            El QR de inscripción se generará automáticamente al publicar tu evento.
          </p>
        </Section>

        {/* Submit */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(!canSubmit && "opacity-50 cursor-not-allowed")}
            style={{ backgroundColor: canSubmit ? "var(--puma-blue)" : undefined }}
          >
            <Send className="size-4" />{" "}
            {data.tipo_evento === "RECREACION" ? "Publicar evento" : "Publicar y enviar a VOAE"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: any;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <div className="p-5 border-b flex items-start gap-3 bg-secondary/30">
        <div className="size-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
          <Icon className="size-4" />
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function FieldLabel({
  label,
  required,
  optional,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <Label>
      {label}
      {required && <span style={{ color: "#ef4444" }}> *</span>}
      {optional && (
        <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>
          (opcional)
        </span>
      )}
    </Label>
  );
}
