import { useState, useRef, useEffect, Fragment } from "react";
import { useNavigate } from "react-router";
import { api } from "../../../services/api";
import {
  FileText,
  CalendarDays,
  ImagePlus,
  Upload,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Send,
  Check,
  MapPin,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  CATEGORY_LABEL_LONG,
  CATEGORY_COLORS,
  CENTROS_REGIONALES,
  EVENTS,
  type EventCategory,
  type UniEvent,
} from "../../../lib/mock-data";
import { useRole } from "../../../lib/role-context";
import { AnalogTimePicker } from "./AnalogTimePicker";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

type FormData = {
  titulo: string;
  categoria: EventCategory;
  tipo_actividad: string;
  tipo_evento: "HORAS_VOAE" | "SIN_HORAS";
  centro_regional: string;
  descripcion: string;
  audiencia: "TODO_PUBLICO" | "SOLO_ESTUDIANTES" | "SOLO_EMPLEADOS";
  registro_entrada: boolean;
  registro_salida: boolean;
  tipo_duracion: "TOTALES" | "DIARIAS";
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  enlace_virtual: string;
  cupo_maximo: string;
  tutor_responsable: string;
  usa_imagen_personalizada: boolean;
  latitud: string;
  longitud: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const today = () => new Date().toISOString().slice(0, 10);

const STEPS = [
  { icon: FileText, label: "Información básica" },
  { icon: CalendarDays, label: "Fecha, lugar y capacidad" },
  { icon: ImagePlus, label: "Material visual" },
  { icon: CheckCircle2, label: "Revisión y publicación" },
];

interface EventFormProps {
  initialEvent?: UniEvent;
  onClose: () => void;
}

function buildFormDefaults(user: { name?: string }, initialEvent?: UniEvent): FormData {
  if (initialEvent) {
    return {
      titulo: initialEvent.titulo,
      categoria: initialEvent.categoria,
      tipo_actividad: initialEvent.tipo_actividad || "Presencial",
      tipo_evento: initialEvent.tipo_evento === "HORAS_VOAE" ? "HORAS_VOAE" : "SIN_HORAS",
      centro_regional: initialEvent.centro_regional || "Ciudad Universitaria",
      descripcion: initialEvent.descripcion,
      audiencia: (initialEvent as any).audiencia || "TODO_PUBLICO",
      registro_entrada: initialEvent.tipo_evento === "HORAS_VOAE",
      registro_salida: initialEvent.tipo_evento === "HORAS_VOAE",
      tipo_duracion: (initialEvent.tipo_duracion as "TOTALES" | "DIARIAS") || "TOTALES",
      fecha_inicio: initialEvent.fecha_inicio.slice(0, 10),
      fecha_fin: initialEvent.fecha_fin.slice(0, 10),
      hora_inicio: initialEvent.hora_inicio || initialEvent.fecha_inicio.slice(11, 16),
      hora_fin: initialEvent.hora_fin || initialEvent.fecha_fin.slice(11, 16),
      ubicacion: initialEvent.lugar || "",
      enlace_virtual: initialEvent.enlace_virtual || "",
      cupo_maximo: String(initialEvent.cupo_maximo),
      tutor_responsable: initialEvent.tutor_nombre || user.name || "Dr. Carlos Mendoza",
      usa_imagen_personalizada: initialEvent.usa_imagen_personalizada,
      latitud: String(initialEvent.latitud ?? ""),
      longitud: String(initialEvent.longitud ?? ""),
    };
  }
  return {
    titulo: "",
    categoria: "ACADEMICO",
    tipo_actividad: "Presencial",
    tipo_evento: "SIN_HORAS",
    centro_regional: "Ciudad Universitaria",
    descripcion: "",
    audiencia: "TODO_PUBLICO",
    registro_entrada: true,
    registro_salida: true,
    tipo_duracion: "TOTALES",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    ubicacion: "",
    enlace_virtual: "",
    cupo_maximo: "",
    tutor_responsable: user.name || "Dr. Carlos Mendoza",
    usa_imagen_personalizada: false,
    latitud: "",
    longitud: "",
  };
}

function buildInitialCategorias(initialEvent?: UniEvent) {
  return (Object.keys(CATEGORY_LABEL_LONG) as EventCategory[]).map((c) => {
    const found = initialEvent?.distribucion_horas?.find((dh) => dh.categoria === c);
    return {
      categoria: c,
      checked: found ? true : c === initialEvent?.categoria || (!initialEvent && c === "ACADEMICO"),
      horas: found ? found.horas : 0,
    };
  });
}

export function EventForm({ initialEvent, onClose }: EventFormProps) {
  const { user } = useRole();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [images, setImages] = useState<string[]>(initialEvent?.imagenes_adicionales || []);
  const [imgPortada, setImgPortada] = useState<string | null>(initialEvent?.imagen_url || null);

  const [dragOver, setDragOver] = useState(false);
  const [dragOverPortada, setDragOverPortada] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const portadaInputRef = useRef<HTMLInputElement>(null);

  const [categoriasHoras, setCategoriasHoras] = useState(() => buildInitialCategorias(initialEvent));
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node)) setCatDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const [data, setData] = useState<FormData>(() => buildFormDefaults(user, initialEvent));

  const isEdit = !!initialEvent;

  const hasUnsavedData =
    data.titulo.trim().length > 0 ||
    data.descripcion.trim().length > 0 ||
    data.fecha_inicio ||
    imgPortada !== null ||
    images.length > 0;

  const handleExit = () => {
    if (hasUnsavedData) {
      setExitConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const TEXT_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,:=\-*()+#@!?¿¡"'/_&%]+$/;
  const DESC_RE = /^[^<>{}[\]]*$/;
  const UBICACION_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.\-#:=*()+#@!?¿¡"'/_&|%?=+&]+$/;

  const validate = (d: FormData): FormErrors => {
    const e: FormErrors = {};
    if (!d.titulo.trim()) e.titulo = "El título del evento es obligatorio";
    else if (d.titulo.length > 40) e.titulo = "El título no puede exceder 40 caracteres";
    else if (!TEXT_RE.test(d.titulo))
      e.titulo =
        "Solo se permiten letras, números, puntos, comas, dos puntos, asteriscos e iguales";
    if (!d.descripcion.trim()) e.descripcion = "La descripción del evento es obligatoria";
    else if (d.descripcion.trim().split(/\s+/).length > 100)
      e.descripcion = "La descripción no puede exceder 100 palabras";
    else if (!DESC_RE.test(d.descripcion)) e.descripcion = "Caracteres no permitidos detectados";
    if (d.ubicacion && d.ubicacion.length > 200) e.ubicacion = "No puede exceder 200 caracteres";
    if (d.ubicacion && !UBICACION_RE.test(d.ubicacion))
      e.ubicacion = "Caracteres no permitidos detectados";
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
    if (d.hora_inicio && d.hora_fin) {
      const [h1, m1] = d.hora_inicio.split(":").map(Number);
      const [h2, m2] = d.hora_fin.split(":").map(Number);
      if (h2 * 60 + m2 <= h1 * 60 + m1) {
        e.hora_fin = "El horario de fin debe ser posterior al horario de inicio.";
      }
    }
    return e;
  };

  const step2RequiredFields = (): (keyof FormData)[] => {
    const base: (keyof FormData)[] = [
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

  const filterInput = (field: keyof FormData, value: string): string => {
    if (field === "titulo")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s.,:=\-*()+#@!?¿¡"'/_&%]/g, "").slice(0, 40);
    if (field === "descripcion") {
      const cleaned = value.replace(/[<>{}[\]]/g, "");
      const words = cleaned.trim() ? cleaned.trim().split(/\s+/) : [];
      if (words.length <= 100) return cleaned;
      return words.slice(0, 100).join(" ");
    }
    if (field === "ubicacion")
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.\-#:=*()+#@!?¿¡"'/_&|%?=+&]/g, "").slice(0, 250);
    return value;
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

  const step1Complete = data.titulo.trim().length > 0 && data.descripcion.trim().length > 0;

  const step2Complete = step2RequiredFields().every((f) => {
    const v = data[f];
    if (f === "ubicacion") {
      const words = data.ubicacion.trim() ? data.ubicacion.trim().split(/\s+/).length : 0;
      return typeof v === "string" && v.trim().length > 0 && words <= 100;
    }
    return typeof v === "string" && v.trim().length > 0;
  });

  const handleNext = () => {
    const errs = validate(data);
    setErrors(errs);
    const currentFields =
      currentStep === 1 ? (["titulo", "descripcion"] as (keyof FormData)[]) : step2RequiredFields();
    setTouched((prev) => {
      const next = { ...prev };
      currentFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
    const hasCurrentErrors = currentFields.some((f) => !!errs[f as keyof FormErrors]);
    if (hasCurrentErrors) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    const allFields = step2RequiredFields();
    allFields.push("titulo", "descripcion");
    setTouched((prev) => {
      const next = { ...prev };
      allFields.forEach((f) => {
        next[f] = true;
      });
      return next;
    });
    if (Object.keys(errs).length > 0) {
      toast.error("Corrige los campos marcados en rojo");
      return;
    }
    if (!categoriasHoras.some((ch) => ch.checked)) {
      toast.error("Selecciona al menos una categoría / ámbito");
      return;
    }
    const calcDuration = (): number => {
      if (!data.hora_inicio || !data.hora_fin) return 0;
      const [h1, m1] = data.hora_inicio.split(":").map(Number);
      const [h2, m2] = data.hora_fin.split(":").map(Number);
      const diff = h2 * 60 + m2 - (h1 * 60 + m1);
      return diff > 0 ? Math.round((diff / 60) * 10) / 10 : 0;
    };
    const checkedCategorias = categoriasHoras.filter((ch) => ch.checked);
    const primaryCategoria = checkedCategorias.length > 0 ? checkedCategorias[0].categoria : "ACADEMICO";
    const distribucion = data.tipo_evento === "HORAS_VOAE" && checkedCategorias.length > 0
      ? checkedCategorias.map((ch) => ({ categoria: ch.categoria, horas: ch.horas }))
      : undefined;

    const payload = {
      titulo: data.titulo,
      descripcion: data.descripcion,
      categoria: primaryCategoria,
      tipo_evento: data.tipo_evento === "HORAS_VOAE" ? "HORAS_VOAE" : "RECREACION",
      fecha_inicio: data.fecha_inicio + "T" + data.hora_inicio + ":00",
      fecha_fin: data.fecha_fin + "T" + data.hora_fin + ":00",
      duracion_horas: data.tipo_evento === "HORAS_VOAE" ? checkedCategorias.reduce((s, c) => s + c.horas, 0) || calcDuration() : calcDuration(),
      cupo_maximo: parseInt(data.cupo_maximo, 10) || 0,
      lugar: data.ubicacion || data.enlace_virtual || "",
      tipo_actividad: data.tipo_actividad,
      centro_regional: data.centro_regional,
      usa_imagen_personalizada: data.usa_imagen_personalizada,
      hora_inicio: data.hora_inicio,
      hora_fin: data.hora_fin,
      enlace_virtual: data.enlace_virtual,
      portada_url: imgPortada || null,
      imagenes_adicionales: images,
      tutor_responsable: data.tutor_responsable,
      tipo_duracion: data.tipo_duracion,
      distribucion_horas: distribucion,
      estado: isEdit ? initialEvent?.estado : "BORRADOR"
    };

    (async () => {
      try {
        if (isEdit && initialEvent) {
          await api.put(`/eventos/${(initialEvent as any).id_evento || initialEvent.id}`, payload);
          toast.success("¡Cambios guardados con éxito!");
        } else {
          await api.post('/eventos', payload);
          toast.success("¡Evento guardado como borrador!");
        }
        onClose();
      } catch (err: any) {
        toast.error("Error al guardar el evento", { description: err.message });
      }
    })();
  };

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

  const renderStep1 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        <div className="flex items-start gap-2.5 rounded-lg border bg-green-50/50 p-3">
          <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Evento creado por: <span className="font-semibold">{user.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detectado automáticamente desde tu cuenta institucional.
            </p>
          </div>
        </div>
        <div>
          <Label>
            Título del evento <span className="text-red-500">*</span>
          </Label>
          <Input
            value={data.titulo}
            onChange={(e) => set("titulo", e.target.value)}
            onBlur={() => blur("titulo")}
            placeholder="Ej. Taller de Investigación Académica"
            className={cn("mt-1 h-11", errors.titulo && "border-red-500")}
            maxLength={40}
          />
          {errors.titulo && <p className="text-xs mt-0.5 text-red-800">{errors.titulo}</p>}
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">
            {data.titulo.length}/40
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>
              Tipo de evento <span className="text-red-500">*</span>
            </Label>
            <Select
              value={data.tipo_evento}
              onValueChange={(v) => {
                if (v !== "HORAS_VOAE" && v !== "SIN_HORAS") return;
                setData((prev) => {
                  const next = { ...prev, tipo_evento: v as "HORAS_VOAE" | "SIN_HORAS" };
                  if (v === "HORAS_VOAE") {
                    next.registro_entrada = true;
                    next.registro_salida = true;
                  }
                  return next;
                });
                if (touched.tipo_evento) {
                  setErrors(validate({ ...data, tipo_evento: v }));
                }
              }}
            >
              <SelectTrigger className="mt-1 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HORAS_VOAE">Con horas</SelectItem>
                <SelectItem value="SIN_HORAS">Sin horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de actividad</Label>
            <Select value={data.tipo_actividad} onValueChange={(v) => set("tipo_actividad", v)}>
              <SelectTrigger className={cn("mt-1 h-11", errors.tipo_actividad && "border-red-500")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Presencial">Presencial</SelectItem>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Híbrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>
            Categorías / Ámbitos <span className="text-red-500">*</span>
          </Label>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div>
            <div className="relative" ref={catDropdownRef}>
              <div
                className="flex items-center gap-1 flex-wrap min-h-[44px] rounded-lg border bg-background px-3 py-1.5 cursor-pointer"
                style={{ borderColor: errors.categoria ? "#ef4444" : undefined }}
                onClick={() => setCatDropdownOpen((o) => !o)}
              >
                {(() => {
                  const selected = categoriasHoras.filter((ch) => ch.checked);
                  if (selected.length === 0) return <span className="text-sm text-muted-foreground">Seleccionar categorías...</span>;
                  return selected.map((ch) => (
                    <span
                      key={ch.categoria}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
                      style={{ backgroundColor: CATEGORY_COLORS[ch.categoria] + "15", borderColor: CATEGORY_COLORS[ch.categoria] + "40", color: CATEGORY_COLORS[ch.categoria] }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {CATEGORY_LABEL_LONG[ch.categoria]}
                      <button
                        type="button"
                        onClick={() => {
                          setCategoriasHoras((prev) =>
                            prev.map((c) =>
                              c.categoria === ch.categoria ? { ...c, checked: false, horas: 0 } : c
                            )
                          );
                        }}
                        className="ml-0.5 hover:opacity-70"
                      >
                        ✕
                      </button>
                    </span>
                  ));
                })()}
                <ChevronDown className="size-4 ml-auto shrink-0 text-muted-foreground" />
              </div>
              {catDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border bg-card shadow-lg p-1.5">
                  {categoriasHoras.map((ch) => (
                    <div
                      key={ch.categoria}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setCategoriasHoras((prev) =>
                          prev.map((c) =>
                            c.categoria === ch.categoria
                              ? { ...c, checked: !c.checked, horas: !c.checked ? c.horas : 0 }
                              : c
                          )
                        );
                      }}
                    >
                      <Checkbox checked={ch.checked} className="pointer-events-none" />
                      <div className="size-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[ch.categoria] }} />
                      <span className="text-sm">{CATEGORY_LABEL_LONG[ch.categoria]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {data.tipo_evento === "HORAS_VOAE" && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Asignar horas por categoría</p>
              {categoriasHoras.filter((ch) => ch.checked).length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Selecciona categorías arriba</p>
              ) : (
                categoriasHoras
                  .filter((ch) => ch.checked)
                  .map((ch) => {
                    const exceededCat = ch.horas > 15;
                    const allChecked = categoriasHoras.filter((c) => c.checked);
                    const totalAll = allChecked.reduce((s, c) => s + c.horas, 0);
                    const totalExceeded = totalAll > 60;
                    return (
                      <div key={ch.categoria} className="flex items-center gap-2">
                        <span className="text-xs w-24 truncate">{CATEGORY_LABEL_LONG[ch.categoria]}</span>
                        <Input
                          type="number"
                          min={1}
                          max={15}
                          value={ch.horas || ""}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value);
                            const val = isNaN(raw) ? 0 : Math.min(raw, 15);
                            const totalOther = categoriasHoras
                              .filter((c) => c.checked && c.categoria !== ch.categoria)
                              .reduce((s, c) => s + c.horas, 0);
                            const clamped = totalOther + val > 60 ? 60 - totalOther : val;
                            setCategoriasHoras((prev) =>
                              prev.map((c) =>
                                c.categoria === ch.categoria ? { ...c, horas: Math.max(0, clamped) } : c
                              )
                            );
                          }}
                          className={cn("h-8 w-16 text-sm", (exceededCat || totalExceeded) && "border-red-400")}
                          placeholder="hrs"
                        />
                        {exceededCat && <span className="text-[10px] text-red-500">máx 15</span>}
                      </div>
                    );
                  })
              )}
              {(() => {
                const checked = categoriasHoras.filter((ch) => ch.checked);
                const total = checked.reduce((s, c) => s + c.horas, 0);
                const exceeded = total > 60;
                return (
                  <p className={cn("text-xs", exceeded ? "text-red-500 font-medium" : "text-muted-foreground")}>
                    Total: {total} / 60 horas
                    {exceeded && " — Excede el límite"}
                  </p>
                );
              })()}
            </div>
          )}
        </div>
        {categoriasHoras.filter((ch) => ch.checked).length === 0 && (
          <p className="text-xs text-red-500 mt-1">Selecciona al menos una categoría</p>
        )}
      </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Audiencia — Quién puede inscribirse</Label>
            <Select
              value={data.audiencia}
              onValueChange={(v) =>
                set("audiencia", v as "TODO_PUBLICO" | "SOLO_ESTUDIANTES" | "SOLO_EMPLEADOS")
              }
            >
              <SelectTrigger className="mt-1 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO_PUBLICO">Todo público</SelectItem>
                <SelectItem value="SOLO_ESTUDIANTES">Solo estudiantes</SelectItem>
                <SelectItem value="SOLO_EMPLEADOS">Solo empleados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de duración</Label>
            <Select
              value={data.tipo_duracion}
              onValueChange={(v) => set("tipo_duracion", v as "TOTALES" | "DIARIAS")}
            >
              <SelectTrigger className="mt-1 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOTALES">Horas totales</SelectItem>
                <SelectItem value="DIARIAS">Horas diarias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>
            Descripción del evento <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={data.descripcion}
            onChange={(e) => set("descripcion", e.target.value)}
            onBlur={() => blur("descripcion")}
            rows={2}
            placeholder="Describe los objetivos y contenido del evento (máximo 100 palabras)..."
            className={cn("mt-1", errors.descripcion && "border-red-500")}
          />
          {errors.descripcion && (
            <p className="text-xs mt-0.5 text-red-800">{errors.descripcion}</p>
          )}
          <p className="text-[10px] text-muted-foreground text-right mt-0.5">
            {data.descripcion.trim() ? data.descripcion.trim().split(/\s+/).length : 0} / 100
            palabras
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <Label>
              Fecha de inicio <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={data.fecha_inicio}
              onChange={(e) => set("fecha_inicio", e.target.value)}
              onBlur={() => blur("fecha_inicio")}
              min={today()}
              className={cn("mt-1 h-11", errors.fecha_inicio && "border-red-500")}
            />
            {errors.fecha_inicio && (
              <p className="text-xs mt-0.5 text-red-800">{errors.fecha_inicio}</p>
            )}
          </div>
          <div>
            <Label>
              Fecha de fin <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={data.fecha_fin}
              onChange={(e) => set("fecha_fin", e.target.value)}
              onBlur={() => blur("fecha_fin")}
              min={data.fecha_inicio || today()}
              className={cn("mt-1 h-11", errors.fecha_fin && "border-red-500")}
            />
            {errors.fecha_fin && <p className="text-xs mt-0.5 text-red-800">{errors.fecha_fin}</p>}
          </div>
          <div>
            <Label>
              Hora de inicio <span className="text-red-500">*</span>
            </Label>
            <AnalogTimePicker
              value={data.hora_inicio}
              onChange={(v) => set("hora_inicio", v)}
              error={!!errors.hora_inicio}
            />
            {errors.hora_inicio && (
              <p className="text-xs mt-0.5 text-red-800">{errors.hora_inicio}</p>
            )}
          </div>
          <div>
            <Label>
              Hora de fin <span className="text-red-500">*</span>
            </Label>
            <AnalogTimePicker
              value={data.hora_fin}
              onChange={(v) => set("hora_fin", v)}
              error={!!errors.hora_fin}
            />
            {errors.hora_fin && <p className="text-xs mt-0.5 text-red-800">{errors.hora_fin}</p>}
          </div>
        </div>
        <div>
          <Label>Centro regional <span className="text-red-500">*</span></Label>
          <Select
            value={data.centro_regional}
            onValueChange={(v) => {
              setData((prev) => {
                const currentName = prev.ubicacion.includes("|") ? prev.ubicacion.split("|")[0] : prev.ubicacion;
                const query = currentName ? `${currentName} ${v}`.trim() : "";
                const link = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
                return {
                  ...prev,
                  centro_regional: v,
                  ubicacion: currentName ? `${currentName}|${link}` : ""
                };
              });
            }}
          >
            <SelectTrigger className="mt-1 h-11 bg-white">
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

        {data.tipo_actividad !== "Virtual" && (() => {
          const [buildingName, gMapsUrl] = data.ubicacion && data.ubicacion.includes("|")
            ? data.ubicacion.split("|")
            : [data.ubicacion || "", ""];

          return (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <Label>
                  Edificio / Ubicación física <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={buildingName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const query = val ? `${val} ${data.centro_regional}`.trim() : "";
                    const link = query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
                    setData((prev) => ({
                      ...prev,
                      ubicacion: val ? `${val}|${link}` : ""
                    }));
                  }}
                  onBlur={() => blur("ubicacion")}
                  placeholder="Ej. Edificio D1, Auditorio Juan Lindo, Plaza Cuatro Culturas..."
                  className={cn("mt-1 h-11 bg-white", errors.ubicacion && "border-red-500")}
                />
                {errors.ubicacion && <p className="text-xs mt-0.5 text-red-800">{errors.ubicacion}</p>}
              </div>

              {gMapsUrl && (
                <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3 shadow-inner">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-1.5 h-11 text-[#004B87] border-[#004B87] hover:bg-slate-50 font-semibold bg-white shadow-sm"
                    onClick={() => window.open(gMapsUrl, "_blank")}
                  >
                    <MapPin className="size-4 text-[#004B87]" /> Probar búsqueda en Google Maps
                  </Button>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                      Enlace de Google Maps Generado (Solo lectura)
                    </Label>
                    <Input
                      type="text"
                      value={gMapsUrl}
                      readOnly
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="bg-white cursor-text font-mono text-xs h-9 border-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {data.tipo_actividad !== "Presencial" && (
          <div>
            <Label>
              Enlace virtual <span className="text-red-500">*</span>
            </Label>
            <Input
              value={data.enlace_virtual}
              onChange={(e) => set("enlace_virtual", e.target.value)}
              onBlur={() => blur("enlace_virtual")}
              placeholder="Ej. https://meet.google.com/..."
              className={cn("mt-1 h-11", errors.enlace_virtual && "border-red-500")}
            />
            {errors.enlace_virtual && (
              <p className="text-xs mt-0.5 text-red-800">{errors.enlace_virtual}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label>
              Cupo máximo <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={data.cupo_maximo}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "" || /^\d+$/.test(raw)) {
                  set("cupo_maximo", raw);
                }
              }}
              onBlur={() => blur("cupo_maximo")}
              placeholder="50"
              className={cn("mt-1 h-11", errors.cupo_maximo && "border-red-500")}
            />
            {errors.cupo_maximo && (
              <p className="text-xs mt-0.5 text-red-800">{errors.cupo_maximo}</p>
            )}
          </div>
        </div>
        {data.tipo_duracion === "DIARIAS" && (
          <p className="text-xs text-amber-600">
            Se generará una constancia independiente por cada día de asistencia validado.
          </p>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="font-medium text-sm">Deseas agregar imágenes del evento?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Si no agregas imágenes, se usará un placeholder automático según la categoría del
              evento.
            </p>
          </div>
          <Switch
            checked={data.usa_imagen_personalizada}
            onCheckedChange={(v) => set("usa_imagen_personalizada", v)}
            style={
              data.usa_imagen_personalizada ? { backgroundColor: "var(--puma-blue)" } : undefined
            }
          />
        </div>
        {data.usa_imagen_personalizada ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold">Imagen de portada</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Esta imagen aparecerá en la card del evento y como imagen principal.
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
                  "relative rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer",
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
                    <img src={imgPortada} alt="" className="max-h-20 rounded-lg object-contain" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImgPortada(null);
                      }}
                      className="text-xs underline text-red-500"
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="size-8 text-muted-foreground/50" />
                    <div className="text-sm font-medium">
                      Arrastra o haz clic para subir portada
                    </div>
                    <div className="text-xs text-muted-foreground">
                      JPG, PNG o WEBP · Máximo 5MB
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-t" />

            <div>
              <p className="text-sm font-semibold">
                Imágenes del evento{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Agrega fotos adicionales que muestren de qué trata el evento. Máximo 4 imágenes.
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
                  "relative rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer",
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
                  <div className="text-sm font-medium">Arrastra o haz clic para subir imágenes</div>
                  <div className="text-xs text-muted-foreground">
                    JPG, PNG o WEBP · Máximo 5MB cada una
                  </div>
                </div>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {images.map((url, i) => (
                    <div
                      key={i}
                      className="relative group aspect-square rounded-lg overflow-hidden border"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 size-6 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed grid place-items-center text-muted-foreground/50 cursor-pointer hover:border-primary/40"
                    >
                      <Upload className="size-6" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed p-8 text-center">
            <ImagePlus className="size-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Se usará un placeholder automático según la categoría del evento.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="h-full flex flex-col justify-center">
      <div className="space-y-3 overflow-y-auto">
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <FileText className="size-4" style={{ color: "#004B87" }} /> Información básica
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground">Título:</span> {data.titulo || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Categorías:</span>{" "}
              {categoriasHoras
                .filter((ch) => ch.checked)
                .map((ch) => CATEGORY_LABEL_LONG[ch.categoria])
                .join(", ") || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Tipo actividad:</span> {data.tipo_actividad}
            </div>
            <div>
              <span className="text-muted-foreground">Tipo evento:</span>{" "}
              {data.tipo_evento === "HORAS_VOAE" ? "Horas VOAE" : "Recreación"}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Audiencia:</span>{" "}
              {data.audiencia === "TODO_PUBLICO"
                ? "Todo público"
                : data.audiencia === "SOLO_ESTUDIANTES"
                  ? "Solo estudiantes"
                  : "Solo empleados"}
            </div>
            <div>
              <span className="text-muted-foreground">Registro entrada:</span>{" "}
              {data.registro_entrada ? "Sí" : "No"}
            </div>
            <div>
              <span className="text-muted-foreground">Registro salida:</span>{" "}
              {data.registro_salida ? "Sí" : "No"}
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Descripción:</span> {data.descripcion || "—"}
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CalendarDays className="size-4" style={{ color: "#004B87" }} /> Fecha, lugar y
            capacidad
          </h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground">Inicio:</span> {data.fecha_inicio}{" "}
              {data.hora_inicio}
            </div>
            <div>
              <span className="text-muted-foreground">Fin:</span> {data.fecha_fin} {data.hora_fin}
            </div>
            {data.tipo_actividad !== "Virtual" && (() => {
              const [bName, bLink] = data.ubicacion && data.ubicacion.includes("|")
                ? data.ubicacion.split("|")
                : [data.ubicacion || "—", ""];
              return (
                <div>
                  <span className="text-muted-foreground">Ubicación:</span>{" "}
                  {bLink ? (
                    <a
                      href={bLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#004B87] hover:underline font-semibold"
                    >
                      {bName} (Ver en Google Maps)
                    </a>
                  ) : (
                    bName
                  )}
                </div>
              );
            })()}
            {data.tipo_actividad !== "Presencial" && (
              <div>
                <span className="text-muted-foreground">Enlace:</span> {data.enlace_virtual || "—"}
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Cupo:</span> {data.cupo_maximo || "—"}
            </div>
            <div>
              <span className="text-muted-foreground">Duración:</span>{" "}
              {data.hora_inicio && data.hora_fin
                ? (() => {
                    const [h1, m1] = data.hora_inicio.split(":").map(Number);
                    const [h2, m2] = data.hora_fin.split(":").map(Number);
                    const hrs = Math.round(((h2 * 60 + m2 - (h1 * 60 + m1)) / 60) * 10) / 10;
                    return hrs > 0 ? `${hrs} hrs` : "—";
                  })()
                : "—"}{" "}
              ({data.tipo_duracion === "TOTALES" ? "totales" : "diarias"})
            </div>
            <div>
              <span className="text-muted-foreground">Centro regional:</span> {data.centro_regional}
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <ImagePlus className="size-4" style={{ color: "#004B87" }} /> Material visual
          </h3>
          <p className="text-sm text-muted-foreground">
            {data.usa_imagen_personalizada
              ? `Se agregarán ${images.length + (imgPortada ? 1 : 0)} imagen(es)`
              : "Se usará placeholder automático según la categoría."}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 pt-4 pb-3 px-4 md:pt-6 md:pb-4 md:px-6 lg:pt-8 lg:pb-5 lg:px-8">
        <div className="mx-auto" style={{ maxWidth: "1000px" }}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExit}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition shrink-0"
              aria-label="Volver a gestión de eventos"
            >
              <ChevronLeft className="size-5" />
            </button>
            {STEPS.map((step, i) => (
              <Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "size-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors shrink-0",
                      i + 1 < currentStep
                        ? "bg-green-500 border-green-500 text-white"
                        : i + 1 === currentStep
                          ? "border-[#004B87] text-[#004B87] bg-white"
                          : "border-[#9ca3af] text-[#9ca3af] bg-white",
                    )}
                  >
                    {i + 1 < currentStep ? <CheckCircle2 className="size-5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 font-medium text-center leading-tight max-w-[88px] truncate hidden sm:block",
                      i + 1 === currentStep ? "text-[#004B87]" : "text-[#9ca3af]",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 sm:mx-2 bg-gray-200 rounded">
                    <div
                      className={cn(
                        "h-full rounded transition-all duration-300",
                        i + 1 < currentStep ? "bg-green-500" : "bg-transparent",
                      )}
                    />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            {isEdit ? "Editando evento" : `Paso ${currentStep} de 4`}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-4 md:px-6 lg:px-8 min-h-0">
        <div className="mx-auto h-full" style={{ maxWidth: "1000px" }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-3 md:px-6 md:py-4 lg:px-8">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1000px" }}>
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={handlePrev} className="gap-1.5">
                <ChevronLeft className="size-4" /> Atrás
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  currentStep === 1
                    ? !step1Complete || !!(errors.titulo || errors.descripcion)
                    : currentStep === 2
                      ? !step2Complete ||
                        step2RequiredFields().some((f) => errors[f as keyof FormErrors]) ||
                        !!(errors.cupo_maximo)
                      : false
                }
                className={cn(
                  "gap-1.5",
                  (currentStep === 1
                    ? !step1Complete || !!(errors.titulo || errors.descripcion)
                    : currentStep === 2
                      ? !step2Complete ||
                        step2RequiredFields().some((f) => errors[f as keyof FormErrors]) ||
                        !!(errors.cupo_maximo)
                      : false) && "opacity-50 cursor-not-allowed",
                )}
                style={{ backgroundColor: "var(--puma-blue)" }}
              >
                Siguiente <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="gap-1.5 text-white"
                style={{ backgroundColor: "#1e3a5f" }}
              >
                {isEdit ? (
                  <><Check className="size-4" /> Guardar cambios</>
                ) : (
                  <><Send className="size-4" /> Guardar borrador</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={exitConfirmOpen} onOpenChange={setExitConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Deseas salir?</DialogTitle>
            <DialogDescription>Los cambios no guardados se perderán.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setExitConfirmOpen(false)}>
              Continuar editando
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setExitConfirmOpen(false);
                onClose();
              }}
            >
              Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
