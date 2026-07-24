import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  FileText,
  CalendarDays,
  MapPin,
  Upload,
  X,
  Send,
  CheckCircle2,
  Info,
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
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

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
  usa_imagen_personalizada: boolean;
  latitud: string;
  longitud: string;
  tutor_responsable: string;
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

export function SolicitarEvento() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
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
    duracion_horas: "1.0",
    requiere_inscripcion: true,
    usa_imagen_personalizada: false,
    latitud: "",
    longitud: "",
    tutor_responsable: usuario?.nombre || "Estudiante Proponente",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no válido", { description: "Usa JPG, PNG o WEBP" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Archivo muy grande", { description: "Máximo 5MB" });
      return;
    }
    setImagePreview(URL.createObjectURL(file));
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
        portada_url: imagePreview || null,
        imagenes_adicionales: extraImages,
      };

      await api.post('/eventos', payload);
      toast.success("¡Solicitud enviada correctamente!");
      setStep("success");
    } catch (err: any) {
      toast.error("Error al enviar la solicitud", { description: err.message });
    }
  };

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-20 h-20 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-[#003366]">¡Solicitud enviada!</h2>
        <p className="text-slate-600 text-sm">El equipo VOAE revisará tu propuesta y te notificará una vez sea aprobada y publicada.</p>
        <div className="bg-white border rounded-2xl p-5 text-left space-y-2 text-sm max-w-md mx-auto">
          <p><strong className="text-slate-600">Evento:</strong> <span className="text-[#003366] font-semibold">{data.titulo}</span></p>
          <p><strong className="text-slate-600">Categoría:</strong> <span className="text-[#003366] font-semibold">{CATEGORY_LABEL_LONG[data.categoria] || data.categoria}</span></p>
          <p><strong className="text-slate-600">Modalidad:</strong> <span className="text-[#003366] font-semibold">{data.tipo_actividad}</span></p>
          <p><strong className="text-slate-600">Fecha:</strong> <span className="text-[#003366] font-semibold">{data.fecha_inicio} ({data.hora_inicio} – {data.hora_fin})</span></p>
        </div>
        <div className="flex justify-center gap-3">
          <Button asChild style={{ backgroundColor: "#004B87" }}>
            <Link to="/student">Volver al Portal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/student"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition"
      >
        <ArrowLeft className="size-4" /> Volver al portal
      </Link>
      
      <div>
        <h1 className="text-xl font-bold text-[#003366]">Solicitar nuevo evento</h1>
        <p className="text-sm text-muted-foreground">Propón una actividad o taller recreativo para la comunidad universitaria.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
        <Info className="size-4 shrink-0 mt-0.5" />
        <span>Los eventos propuestos por estudiantes se registran como de tipo <strong>Recreación</strong> y no acreditan horas VOAE a los participantes.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
            <FileText className="size-5" /> Información de la propuesta
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label className="font-semibold text-xs text-gray-700">Título del evento *</Label>
              <Input
                value={data.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                onBlur={() => blur("titulo")}
                placeholder="Ej. Torneo de Ajedrez Universitario"
                className={cn("mt-1.5 h-11", errors.titulo && "border-red-500")}
              />
              {errors.titulo && <p className="text-xs mt-1 text-red-600">{errors.titulo}</p>}
            </div>

            <div>
              <Label className="font-semibold text-xs text-gray-700">Categoría *</Label>
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
              <Label className="font-semibold text-xs text-gray-700">Modalidad *</Label>
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
              <Label className="font-semibold text-xs text-gray-700">Entidad u Organización Proponente *</Label>
              <Input
                value={data.entidad_organizadora}
                onChange={(e) => set("entidad_organizadora", e.target.value)}
                onBlur={() => blur("entidad_organizadora")}
                placeholder="Ej. Asociación de Estudiantes de Ingeniería"
                className={cn("mt-1.5 h-11", errors.entidad_organizadora && "border-red-500")}
              />
              {errors.entidad_organizadora && <p className="text-xs mt-1 text-red-600">{errors.entidad_organizadora}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label className="font-semibold text-xs text-gray-700">Descripción detallada *</Label>
              <Textarea
                value={data.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                onBlur={() => blur("descripcion")}
                rows={4}
                placeholder="Explica de qué trata tu evento, dinámicas y público objetivo..."
                className={cn("mt-1.5", errors.descripcion && "border-red-500")}
              />
              {errors.descripcion && <p className="text-xs mt-1 text-red-600">{errors.descripcion}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
            <CalendarDays className="size-5" /> Horario e Inscripción
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
              <Label className="font-semibold text-xs text-gray-700">Cupo estimado *</Label>
              <Input
                type="number"
                placeholder="Ej. 50"
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
              <MapPin className="size-5" /> Ubicación
            </h2>
            <div>
              <Label className="font-semibold text-xs text-gray-700">Espacio o Aula física *</Label>
              <Input
                value={data.ubicacion}
                onChange={(e) => set("ubicacion", e.target.value)}
                onBlur={() => blur("ubicacion")}
                placeholder="Ej. Plaza de las Cuatro Culturas"
                className="mt-1.5 h-11"
              />
              {errors.ubicacion && <p className="text-xs mt-1 text-red-600">{errors.ubicacion}</p>}
            </div>
          </div>
        )}

        {data.tipo_actividad !== "Presencial" && (
          <div className="space-y-4 pt-4">
            <h2 className="text-base font-semibold text-[#003366] flex items-center gap-2 border-b pb-2">
              <MapPin className="size-5" /> Enlace de la sesión
            </h2>
            <div>
              <Label className="font-semibold text-xs text-gray-700">Enlace Virtual *</Label>
              <Input
                value={data.enlace_virtual}
                onChange={(e) => set("enlace_virtual", e.target.value)}
                onBlur={() => blur("enlace_virtual")}
                placeholder="https://zoom.us/j/..."
                className="mt-1.5 h-11"
              />
              {errors.enlace_virtual && <p className="text-xs mt-1 text-red-600">{errors.enlace_virtual}</p>}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" type="button" onClick={() => navigate("/student")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!canSubmit} style={{ backgroundColor: "#004B87" }}>
            Enviar Solicitud a VOAE
          </Button>
        </div>
      </form>
    </div>
  );
}
