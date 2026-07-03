import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  MapPin,
  ImagePlus,
  QrCode,
  Upload,
  X,
  Send,
  CheckCircle2,
  Info,
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
import { Switch } from "@/components/ui/switch";
import { CATEGORY_LABEL_LONG, CENTROS_REGIONALES, type EventCategory } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/student/solicitar")({
  component: SolicitarEvento,
});

type FormData = {
  titulo: string;
  categoria: string;
  tipo_actividad: string;
  tipo_evento: "HORAS_VOAE" | "RECREACION";
  centro_regional: string;
  descripcion: string;
  entidad_organizadora: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  enlace_virtual: string;
  cupo_maximo: string;
  duracion_horas: string;
  requiere_inscripcion: boolean;
  tutor_responsable: string;
  latitud: string;
  longitud: string;
  usa_imagen_personalizada: boolean;
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

const TUTORES_LIST = [
  "Dr. Carlos Mendoza",
  "Lic. Ana Sánchez",
  "Prof. María Lagos",
  "Lic. Pedro Romero",
  "Ing. Laura Paz",
];

const today = () => new Date().toISOString().slice(0, 10);

function SolicitarEvento() {
  const { user } = useRole();
  const [step, setStep] = useState<"form" | "success">("form");
  const [data, setData] = useState<FormData>({
    titulo: "",
    categoria: "ACADEMICO",
    tipo_actividad: "Presencial",
    tipo_evento: "RECREACION",
    centro_regional: "Ciudad Universitaria",
    descripcion: "",
    entidad_organizadora: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
    enlace_virtual: "",
    cupo_maximo: "",
    duracion_horas: "",
    requiere_inscripcion: true,
    usa_imagen_personalizada: false,
    latitud: "",
    longitud: "",
    tutor_responsable: user.name || "María González",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [extraDragOver, setExtraDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const requiredFields = (): (keyof FormData)[] => {
    const base: (keyof FormData)[] = [
      "titulo",
      "categoria",
      "tipo_actividad",
      "descripcion",
      "entidad_organizadora",
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
    if (!d.entidad_organizadora.trim())
      e.entidad_organizadora = "La entidad organizadora es obligatoria";
    else if (d.entidad_organizadora.length > 50)
      e.entidad_organizadora = "No puede exceder 50 caracteres";
    else if (!ENTIDAD_RE.test(d.entidad_organizadora))
      e.entidad_organizadora = "Caracteres no permitidos detectados";
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
    if (!d.tutor_responsable.trim()) e.tutor_responsable = "El organizador es obligatorio";
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

  const handleFile = (file: File | undefined, cb: (url: string) => void) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Usa JPG, PNG o WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 5MB" });
      return;
    }
    cb(URL.createObjectURL(file));
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
    setStep("success");
  };

  if (step === "success") {
    const categoryLabel = CATEGORY_LABEL_LONG[data.categoria as EventCategory] || data.categoria;
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-20 mx-auto rounded-full bg-green-50 grid place-items-center mb-5">
          <CheckCircle2 className="size-10" style={{ color: "#22c55e" }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: "#003366" }}>
          ¡Tu evento fue publicado!
        </h2>
        <p className="text-sm text-muted-foreground mt-2">Ya es visible para otros estudiantes.</p>
        <div
          className="mt-6 mx-auto w-full max-w-sm rounded-xl border p-5 text-left space-y-2"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
        >
          <div className="font-semibold text-center mb-2" style={{ color: "#003366" }}>
            {data.titulo}
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Categoría:</span> {categoryLabel}
            </p>
            <p>
              <span className="font-medium">Tipo de actividad:</span> {data.tipo_actividad}
            </p>
            <p>
              <span className="font-medium">Organiza:</span> {data.entidad_organizadora}
            </p>
            <p>
              <span className="font-medium">Inicio:</span> {data.fecha_inicio} - {data.hora_inicio}
            </p>
            <p>
              <span className="font-medium">Fin:</span> {data.fecha_fin} - {data.hora_fin}
            </p>
            <p>
              <span className="font-medium">Tutor responsable:</span> {data.tutor_responsable}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <Button asChild variant="outline" className="gap-1.5">
            <Link to="/student">Volver al panel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition mb-6"
      >
        <ArrowLeft className="size-4" /> Volver al panel
      </Link>
      <div
        className="mb-6 rounded-xl border p-4 flex items-center gap-3 text-sm"
        style={{
          backgroundColor: "#fefce8",
          borderColor: "#fde047",
          color: "#713f12",
        }}
      >
        <Info className="size-5 shrink-0" />
        <span>
          Los estudiantes solo pueden crear eventos de recreación, sin acreditación de horas.
        </span>
      </div>

      <PageHeader
        title="Solicitar evento"
        description="Completa el formulario para publicar un evento de recreación."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <FieldLabel label="Entidad organizadora" required />
              <Input
                value={data.entidad_organizadora}
                maxLength={50}
                onChange={(e) => set("entidad_organizadora", e.target.value)}
                onBlur={() => blur("entidad_organizadora")}
                placeholder="Ej. Facultad de Ciencias"
                className={cn("mt-1.5 h-11", errors.entidad_organizadora && "border-red-500")}
              />
              {errors.entidad_organizadora && (
                <p className="text-xs mt-1" style={{ color: "#991b1b" }}>
                  {errors.entidad_organizadora}
                </p>
              )}
            </div>
            <div>
              <FieldLabel label="Tipo de evento" required />
              <Select value={data.tipo_evento} disabled>
                <SelectTrigger className={cn("mt-1.5 h-11")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECREACION">Evento de recreación</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Los estudiantes solo pueden crear eventos de recreación, sin acreditación de horas.
              </p>
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
            <div className="sm:col-span-2">
              <FieldLabel label="Organizador" />
              <Input
                value={data.tutor_responsable}
                readOnly
                className="mt-1.5 h-11 bg-secondary/50 cursor-default"
              />
              <p className="text-xs flex items-center gap-1 mt-1.5" style={{ color: "#22c55e" }}>
                <CheckCircle2 className="size-3.5" /> Detectado automáticamente desde tu sesión.
              </p>
            </div>
          </div>
        </Section>

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
              <Input
                type="number"
                min={0.5}
                step={0.5}
                value={data.duracion_horas}
                onChange={(e) => set("duracion_horas", e.target.value)}
                onBlur={() => blur("duracion_horas")}
                placeholder="3"
                className={cn("mt-1.5 h-11", errors.duracion_horas && "border-red-500")}
              />
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
        </Section>

        <Section icon={ImagePlus} title="Material visual" desc="Imágenes del evento (opcional).">
          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
            Solo se permiten imágenes de hasta 5MB en formato JPG, PNG o WEBP.
          </p>
          <div className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Usar imagen de portada personalizada</Label>
              </div>
              <Switch
                checked={data.usa_imagen_personalizada}
                onCheckedChange={(v) => set("usa_imagen_personalizada", v)}
              />
            </div>
            {data.usa_imagen_personalizada ? (
              <>
                <div>
                  <FieldLabel label="Imagen principal del evento" optional />
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      handleFile(e.dataTransfer.files[0], setImagePreview);
                    }}
                    className={cn(
                      "relative rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer mt-1.5",
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
                      onChange={(e) => handleFile(e.target.files?.[0], setImagePreview)}
                    />
                    {imagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt=""
                          className="max-h-48 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagePreview(null);
                          }}
                          className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="size-8 text-muted-foreground/50" />
                        <div className="text-sm font-medium">
                          Arrastra una imagen o haz clic para subir
                        </div>
                        <div className="text-xs text-muted-foreground">
                          JPG, PNG o WEBP · Máximo 5MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <FieldLabel label="Imágenes adicionales del evento" optional />
                  <p className="text-xs text-muted-foreground mb-2">
                    Hasta 4 imágenes para el carrusel del detalle.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {extraImages.map((url, i) => (
                      <div key={i} className="relative size-24 rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setExtraImages((p) => p.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 size-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {extraImages.length < 4 && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setExtraDragOver(true);
                        }}
                        onDragLeave={() => setExtraDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setExtraDragOver(false);
                          handleFile(e.dataTransfer.files[0], (url) =>
                            setExtraImages((p) => [...p, url]),
                          );
                        }}
                        onClick={() => extraInputRef.current?.click()}
                        className={cn(
                          "size-24 rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground/50 cursor-pointer transition",
                          extraDragOver && "border-primary bg-primary/5",
                        )}
                      >
                        <input
                          ref={extraInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleFile(e.target.files?.[0], (url) =>
                              setExtraImages((p) => [...p, url]),
                            )
                          }
                        />
                        <Upload className="size-6" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Se usará el placeholder por defecto con iniciales según la categoría.
              </p>
            )}
          </div>
        </Section>

        <Section icon={QrCode} title="Código QR de inscripción" desc="Generación automática de QR.">
          <p className="text-sm text-muted-foreground">
            El QR de inscripción se generará automáticamente al publicar tu evento.
          </p>
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className={cn(!canSubmit && "opacity-50 cursor-not-allowed")}
            style={{ backgroundColor: canSubmit ? "#004B87" : undefined }}
          >
            <Send className="size-4" /> Publicar evento
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
