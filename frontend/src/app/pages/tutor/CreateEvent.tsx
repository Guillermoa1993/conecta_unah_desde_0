import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
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
import { api } from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { QRCodeCanvas } from "qrcode.react";
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

type FormData = {
  titulo: string;
  categoria: string;
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

const CATEGORY_LABEL_LONG: Record<string, string> = {
  ACADEMICO: "Académico (Científico-Académico)",
  CULTURAL: "Cultural (Cultural-Artístico)",
  DEPORTIVO: "Deportivo",
  SOCIAL: "Social",
};

const CENTROS_REGIONALES = [
  "Ciudad Universitaria",
  "UNAH-VS",
  "CURC",
  "CURLA",
  "CURLP",
  "CURNO",
  "CUROC",
  "UNAH-Tec Aguán",
  "UNAH-Tec Danlí",
];

const today = () => new Date().toISOString().slice(0, 10);

export function CreateEvent() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "success">("form");
  const [createdEventId, setCreatedEventId] = useState<any>(null);
  const [createdQrUrl, setCreatedQrUrl] = useState<string>("");
  
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
    tutor_responsable: usuario?.nombre || "Tutor Responsable",
    usa_imagen_personalizada: false,
    latitud: "",
    longitud: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [images, setImages] = useState<string[]>([]);
  const [imgPortada, setImgPortada] = useState<string | null>(null);
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
  const UBICACION_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.\-#]+$/;

  const filterInput = (field: string, value: string): string => {
    if (field === "titulo")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,\-()]/g, "").slice(0, 150);
    if (field === "descripcion") return value.replace(/[<>{}[\]]/g, "").slice(0, 500);
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
    return e;
  };

  const set = (field: keyof FormData, value: string | boolean) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    setTouched(Object.fromEntries(requiredFields().map((f) => [f, true])) as any);
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }

    try {
      const payload = {
        ...data,
        cupo_maximo: parseInt(data.cupo_maximo, 10),
        duracion_horas: parseFloat(data.duracion_horas),
        latitud: data.latitud ? parseFloat(data.latitud) : null,
        longitud: data.longitud ? parseFloat(data.longitud) : null,
        portada_url: imgPortada || null,
        imagenes_adicionales: images,
      };

      const res = await api.post<any>('/eventos', payload);
      toast.success("¡Evento creado correctamente!");
      
      setCreatedEventId(res.id);
      setCreatedQrUrl(`https://conectapumas.app/inscribirse/${res.id}`);
      setStep("success");
    } catch (err: any) {
      toast.error("Error al crear el evento", { description: err.message });
    }
  };

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="size-20 mx-auto rounded-full bg-amber-50 grid place-items-center mb-5">
          <Send className="size-10 text-amber-800" />
        </div>
        <h2 className="text-2xl font-bold text-[#003366]">
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
        </div>
        <div
          className="mt-4 mx-auto w-64 aspect-square rounded-xl border-2 p-4 grid place-items-center"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}
          ref={qrRef}
        >
          <QRCodeCanvas value={createdQrUrl} size={220} level="M" />
        </div>
        <div className="mt-3 text-sm font-semibold text-[#003366]">
          {data.titulo}
        </div>
        <div className="flex gap-3 mt-5 justify-center">
          <Button
            className="gap-1.5"
            style={{ backgroundColor: "#004B87" }}
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
            <Link to="/tutor/eventos">Ir a mis eventos</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/tutor/eventos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver a mis eventos
      </Link>
      
      <div>
        <h1 className="text-xl font-bold text-[#003366]">Crear nuevo evento</h1>
        <p className="text-sm text-muted-foreground">Completa todos los campos obligatorios (*) para publicar el evento.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
            <FileText className="size-5" /> Información básica
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="font-semibold text-xs text-gray-700">Título del evento *</Label>
              <Input
                value={data.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                onBlur={() => blur("titulo")}
                placeholder="Ej. Taller de Investigación Académica"
                className={cn("mt-1.5 h-11", errors.titulo && "border-red-500")}
              />
              {errors.titulo && (
                <p className="text-xs mt-1 text-red-600">
                  {errors.titulo}
                </p>
              )}
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Categoría o ámbito *</Label>
              <Select value={data.categoria} onValueChange={(v) => set("categoria", v)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(CATEGORY_LABEL_LONG).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL_LONG[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Tipo de actividad *</Label>
              <Select value={data.tipo_actividad} onValueChange={(v) => set("tipo_actividad", v)}>
                <SelectTrigger className="mt-1.5 h-11">
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
              <Label className="font-semibold text-xs text-gray-700">Descripción del evento *</Label>
              <Textarea
                value={data.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                onBlur={() => blur("descripcion")}
                rows={4}
                placeholder="Describe los objetivos y contenido del evento…"
                className={cn("mt-1.5", errors.descripcion && "border-red-500")}
              />
              {errors.descripcion && (
                <p className="text-xs mt-1 text-red-600">
                  {errors.descripcion}
                </p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <Label className="font-semibold text-xs text-gray-700">Tutor o facilitador responsable</Label>
              <Input
                value={data.tutor_responsable}
                readOnly
                className="mt-1.5 h-11 bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs flex items-center gap-1 mt-1.5 text-green-600">
                <CheckCircle2 className="size-3.5" /> Detectado automáticamente desde tu sesión.
              </p>
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Visibilidad del evento *</Label>
              <Select value={data.visibilidad} onValueChange={(v) => set("visibilidad", v)}>
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLICO">Público</SelectItem>
                  <SelectItem value="PRIVADO">Privado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Público: visible para todos. Privado: solo por invitación.
              </p>
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Tipo de evento *</Label>
              <Select
                value={data.tipo_evento}
                onValueChange={(v) => set("tipo_evento", v as "HORAS_VOAE" | "RECREACION")}
              >
                <SelectTrigger className="mt-1.5 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HORAS_VOAE">Horas VOAE (Artículo 140)</SelectItem>
                  <SelectItem value="RECREACION">Evento de recreación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Centro regional *</Label>
              <Select value={data.centro_regional} onValueChange={(v) => set("centro_regional", v)}>
                <SelectTrigger className="mt-1.5 h-11">
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
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
            <CalendarDays className="size-5" /> Fechas y horarios
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-xs text-gray-700">Fecha de inicio *</Label>
              <Input
                type="date"
                value={data.fecha_inicio}
                min={today()}
                onChange={(e) => set("fecha_inicio", e.target.value)}
                onBlur={() => blur("fecha_inicio")}
                className="mt-1.5 h-11"
              />
              {errors.fecha_inicio && <p className="text-xs mt-1 text-red-600">{errors.fecha_inicio}</p>}
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Fecha de finalización *</Label>
              <Input
                type="date"
                value={data.fecha_fin}
                min={data.fecha_inicio || today()}
                onChange={(e) => set("fecha_fin", e.target.value)}
                onBlur={() => blur("fecha_fin")}
                className="mt-1.5 h-11"
              />
              {errors.fecha_fin && <p className="text-xs mt-1 text-red-600">{errors.fecha_fin}</p>}
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Hora de inicio *</Label>
              <Input
                type="time"
                value={data.hora_inicio}
                onChange={(e) => set("hora_inicio", e.target.value)}
                onBlur={() => blur("hora_inicio")}
                className="mt-1.5 h-11"
              />
              {errors.hora_inicio && <p className="text-xs mt-1 text-red-600">{errors.hora_inicio}</p>}
            </div>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Hora de finalización *</Label>
              <Input
                type="time"
                value={data.hora_fin}
                onChange={(e) => set("hora_fin", e.target.value)}
                onBlur={() => blur("hora_fin")}
                className="mt-1.5 h-11"
              />
              {errors.hora_fin && <p className="text-xs mt-1 text-red-600">{errors.hora_fin}</p>}
            </div>

            <div>
              <Label className="font-semibold text-xs text-gray-700">Duración en horas *</Label>
              <Input
                type="number"
                step="0.5"
                placeholder="Ej. 3"
                value={data.duracion_horas}
                onChange={(e) => set("duracion_horas", e.target.value)}
                onBlur={() => blur("duracion_horas")}
                className="mt-1.5 h-11"
              />
              {errors.duracion_horas && <p className="text-xs mt-1 text-red-600">{errors.duracion_horas}</p>}
            </div>

            <div>
              <Label className="font-semibold text-xs text-gray-700">Cupo máximo de estudiantes *</Label>
              <Input
                type="number"
                placeholder="Ej. 100"
                value={data.cupo_maximo}
                onChange={(e) => set("cupo_maximo", e.target.value)}
                onBlur={() => blur("cupo_maximo")}
                className="mt-1.5 h-11"
              />
              {errors.cupo_maximo && <p className="text-xs mt-1 text-red-600">{errors.cupo_maximo}</p>}
            </div>
          </div>
        </div>

        {data.tipo_actividad !== "Virtual" && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
              <MapPin className="size-5" /> Ubicación física
            </h2>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Ubicación específica *</Label>
              <Input
                value={data.ubicacion}
                onChange={(e) => set("ubicacion", e.target.value)}
                onBlur={() => blur("ubicacion")}
                placeholder="Ej. Aula Magna, Edificio A1"
                className="mt-1.5 h-11"
              />
              {errors.ubicacion && <p className="text-xs mt-1 text-red-600">{errors.ubicacion}</p>}
            </div>
          </div>
        )}

        {data.tipo_actividad !== "Presencial" && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
              <MapPin className="size-5" /> Ubicación virtual
            </h2>
            
            <div>
              <Label className="font-semibold text-xs text-gray-700">Enlace de sesión virtual *</Label>
              <Input
                value={data.enlace_virtual}
                onChange={(e) => set("enlace_virtual", e.target.value)}
                onBlur={() => blur("enlace_virtual")}
                placeholder="https://teams.microsoft.com/..."
                className="mt-1.5 h-11"
              />
              {errors.enlace_virtual && <p className="text-xs mt-1 text-red-600">{errors.enlace_virtual}</p>}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" type="button" onClick={() => navigate("/tutor/eventos")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} style={{ backgroundColor: "#004B87" }}>
            Crear y Guardar Evento
          </Button>
        </div>
      </form>
    </div>
  );
}
