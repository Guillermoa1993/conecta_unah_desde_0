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
  Sparkles,
  Wand2,
} from "lucide-react";
import { LocationPicker, SEDES_DATA } from "./LocationPicker";
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

function getLocalDatePickerValues(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" };
  if (isoString.includes("T")) {
    const parts = isoString.split("T");
    return {
      date: parts[0],
      time: parts[1].slice(0, 5)
    };
  }
  if (isoString.includes(" ")) {
    const parts = isoString.split(" ");
    return {
      date: parts[0],
      time: parts[1].slice(0, 5)
    };
  }
  return { date: isoString.slice(0, 10), time: "08:00" };
}

function buildFormDefaults(user: { name?: string }, initialEvent?: UniEvent): FormData {
  if (initialEvent) {
    const startVal = getLocalDatePickerValues(initialEvent.fecha_inicio);
    const endVal = getLocalDatePickerValues(initialEvent.fecha_fin);

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
      fecha_inicio: startVal.date,
      fecha_fin: endVal.date,
      hora_inicio: startVal.time,
      hora_fin: endVal.time,
      ubicacion: (initialEvent as any).ubicacion || initialEvent.lugar || "",
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

function generateAiCoverCanvas(
  title: string,
  category: string,
  styleTheme: string = "academic"
): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const w = 1200;
  const h = 630;

  // Theme palettes
  let bgGrad1 = "#003366";
  let bgGrad2 = "#001f3f";
  let accentColor = "#ffbf00";
  let badgeBg = "rgba(255, 191, 0, 0.25)";
  let badgeBorder = "#ffbf00";

  if (styleTheme === "tech") {
    bgGrad1 = "#0f172a";
    bgGrad2 = "#0284c7";
    accentColor = "#38bdf8";
    badgeBg = "rgba(56, 189, 248, 0.25)";
    badgeBorder = "#38bdf8";
  } else if (styleTheme === "art") {
    bgGrad1 = "#4c1d95";
    bgGrad2 = "#db2777";
    accentColor = "#f472b6";
    badgeBg = "rgba(244, 114, 182, 0.25)";
    badgeBorder = "#f472b6";
  } else if (styleTheme === "sports") {
    bgGrad1 = "#064e3b";
    bgGrad2 = "#059669";
    accentColor = "#34d399";
    badgeBg = "rgba(52, 211, 153, 0.25)";
    badgeBorder = "#34d399";
  } else if (styleTheme === "social") {
    bgGrad1 = "#7c2d12";
    bgGrad2 = "#ea580c";
    accentColor = "#fb923c";
    badgeBg = "rgba(251, 146, 60, 0.25)";
    badgeBorder = "#fb923c";
  }

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, bgGrad1);
  grad.addColorStop(1, bgGrad2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Geometric AI Mesh & Glowing Orbs
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;

  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.arc(w * 0.82 + (i % 3) * 30, h * 0.35 + Math.floor(i / 3) * 40, 90 + i * 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.07;
  const gridSize = 45;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();

  // Accent Sidebar Stripe
  ctx.save();
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, 18, h);
  ctx.restore();

  // Glassmorphic Content Card Container
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.58)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  const cardX = 80, cardY = 70, cardW = w - 160, cardH = h - 140;
  const r = 24;
  ctx.beginPath();
  ctx.moveTo(cardX + r, cardY);
  ctx.lineTo(cardX + cardW - r, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
  ctx.lineTo(cardX + cardW, cardY + cardH - r);
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
  ctx.lineTo(cardX + r, cardY + cardH);
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
  ctx.lineTo(cardX, cardY + r);
  ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // AI Badge Pill
  const categoryText = (category || "EVENTO INSTITUCIONAL").toUpperCase();
  ctx.save();
  ctx.font = "bold 15px sans-serif";
  const badgeWidth = ctx.measureText(categoryText).width + 40;
  const badgeX = 120;
  const badgeY = 115;
  ctx.fillStyle = badgeBg;
  ctx.strokeStyle = badgeBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === "function") {
    (ctx as any).roundRect(badgeX, badgeY, badgeWidth, 38, 19);
  } else {
    ctx.rect(badgeX, badgeY, badgeWidth, 38);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(categoryText, badgeX + 20, badgeY + 24);
  ctx.restore();

  // Title Typography
  const displayTitle = (title.trim() || "Nombre del Evento Académico").toUpperCase();
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px 'Segoe UI', Arial, sans-serif";
  ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 4;

  const words = displayTitle.split(" ");
  let line = "";
  let currentY = 225;
  const maxTextWidth = w - 300;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTextWidth && i > 0) {
      ctx.fillText(line, 120, currentY);
      line = words[i] + " ";
      currentY += 56;
      if (currentY > 410) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 120, currentY);
  ctx.restore();

  // Bottom Watermark / Branding
  ctx.save();
  ctx.font = "bold 15px sans-serif";
  ctx.fillStyle = accentColor;
  ctx.fillText("✨ PORTADA GENERADA CON IA • UNIVERSIDAD NACIONAL AUTÓNOMA DE HONDURAS", 120, h - 110);
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export function EventForm({ initialEvent, onClose }: EventFormProps) {
  const { user } = useRole();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [images, setImages] = useState<string[]>(initialEvent?.imagenes_adicionales || []);
  const [imgPortada, setImgPortada] = useState<string | null>(initialEvent?.portada_url || initialEvent?.imagen_url || null);

  const [aiTheme, setAiTheme] = useState<string>("academic");
  const [isGeneratingAiCover, setIsGeneratingAiCover] = useState<boolean>(false);

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

  const step1Complete =
    data.titulo.trim().length > 0 &&
    data.descripcion.trim().length > 0 &&
    (data.tipo_evento !== "HORAS_VOAE" ||
      (categoriasHoras.filter((ch) => ch.checked).length > 0 &&
        categoriasHoras.filter((ch) => ch.checked).every((ch) => ch.horas > 0)));

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
    if (currentStep === 1 && data.tipo_evento === "HORAS_VOAE") {
      const checkedCats = categoriasHoras.filter((c) => c.checked);
      if (checkedCats.length === 0) {
        toast.error("Debes seleccionar al menos una Categoría / Ámbito.");
        return;
      }
      const hasInvalidHours = checkedCats.some((c) => c.horas <= 0);
      if (hasInvalidHours) {
        toast.error("Todas las categorías seleccionadas deben tener asignada al menos 1 hora.");
        return;
      }
      const totalAll = checkedCats.reduce((s, c) => s + c.horas, 0);
      if (totalAll > 60) {
        toast.error("El total de horas acumuladas no puede exceder las 60 horas.");
        return;
      }
    }
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
    if (data.tipo_evento === "HORAS_VOAE") {
      const checkedCats = categoriasHoras.filter((c) => c.checked);
      if (checkedCats.length === 0) {
        toast.error("Debes seleccionar al menos una Categoría / Ámbito.");
        return;
      }
      const hasInvalidHours = checkedCats.some((c) => c.horas <= 0);
      if (hasInvalidHours) {
        toast.error("Todas las categorías seleccionadas deben tener asignada al menos 1 hora.");
        return;
      }
      const totalAll = checkedCats.reduce((s, c) => s + c.horas, 0);
      if (totalAll > 60) {
        toast.error("El total de horas acumuladas no puede exceder las 60 horas.");
        return;
      }
    }
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
    const calcDuration = (): number => {
      if (!data.fecha_inicio || !data.fecha_fin || !data.hora_inicio || !data.hora_fin) return 0;
      const start = new Date(data.fecha_inicio + "T" + data.hora_inicio);
      const end = new Date(data.fecha_fin + "T" + data.hora_fin);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs <= 0) return 0;
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.round(diffHours * 10) / 10;
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
      duracion_horas: calcDuration(),
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
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages((prev) => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
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
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgPortada(reader.result as string);
    };
    reader.readAsDataURL(file);
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
                    const isZero = ch.horas <= 0;
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
                          className={cn("h-8 w-16 text-sm", (exceededCat || totalExceeded || isZero) && "border-red-400")}
                          placeholder="hrs"
                        />
                        {exceededCat && <span className="text-[10px] text-red-500">máx 15</span>}
                        {isZero && <span className="text-[10px] text-red-500 font-medium">requerido</span>}
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
          <Label>
            Centro regional <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.centro_regional}
            onValueChange={(v) => {
              const sedeInfo = SEDES_DATA[v] || SEDES_DATA["Ciudad Universitaria"];
              setData((prev) => {
                const link = `https://www.google.com/maps/search/?api=1&query=${sedeInfo.lat},${sedeInfo.lng}`;
                return {
                  ...prev,
                  centro_regional: v,
                  latitud: sedeInfo.lat,
                  longitud: sedeInfo.lng,
                  ubicacion: `${v}|${link}|${sedeInfo.lat},${sedeInfo.lng}`
                };
              });
            }}
          >
            <SelectTrigger className="mt-1 h-11 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(SEDES_DATA).map((cr) => (
                <SelectItem key={cr} value={cr}>
                  {cr}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.tipo_actividad !== "Virtual" && (() => {
          const [fullUbicacion, gMapsUrl] = data.ubicacion && data.ubicacion.includes("|")
            ? data.ubicacion.split("|")
            : [data.ubicacion || "", ""];

          const [buildingName, aulaName] = fullUbicacion.includes(" - ")
            ? fullUbicacion.split(" - ")
            : [fullUbicacion, ""];

          const currentSedeData = SEDES_DATA[data.centro_regional] || SEDES_DATA["Ciudad Universitaria"];

          return (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <Label>
                  Edificio / Ubicación física <span className="text-red-500">*</span>
                </Label>
                <select
                  value={buildingName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const matchedBuilding = currentSedeData.buildings.find((b) => b.name === val);
                    const bLat = matchedBuilding ? matchedBuilding.lat : currentSedeData.lat;
                    const bLng = matchedBuilding ? matchedBuilding.lng : currentSedeData.lng;
                    const fullLoc = aulaName ? `${val} - ${aulaName}` : val;
                    const link = `https://www.google.com/maps/search/?api=1&query=${bLat},${bLng}`;

                    setData((prev) => ({
                      ...prev,
                      latitud: bLat,
                      longitud: bLng,
                      ubicacion: val ? `${fullLoc}|${link}|${bLat},${bLng}` : ""
                    }));
                  }}
                  onBlur={() => blur("ubicacion")}
                  className={cn(
                    "mt-1 h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer font-medium text-slate-800 shadow-2xs",
                    errors.ubicacion && "border-red-500"
                  )}
                >
                  <option value="">Seleccionar edificio de {data.centro_regional}...</option>
                  {currentSedeData.buildings.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {errors.ubicacion && <p className="text-xs mt-0.5 text-red-800">{errors.ubicacion}</p>}
              </div>

              <div>
                <Label>
                  Aula (Opcional)
                </Label>
                <Input
                  value={aulaName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const fullLoc = val ? `${buildingName} - ${val}` : buildingName;
                    const link = `https://www.google.com/maps/search/?api=1&query=${data.latitud || currentSedeData.lat},${data.longitud || currentSedeData.lng}`;
                    setData((prev) => ({
                      ...prev,
                      ubicacion: buildingName ? `${fullLoc}|${link}|${prev.latitud},${prev.longitud}` : ""
                    }));
                  }}
                  placeholder="Ej. Aula 101, Cubículo 4, Laboratorio B..."
                  className="mt-1 h-11 bg-white border-slate-200"
                />
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

              {/* Mini Preview del Mapa con Coordenadas Predefinidas Exactas */}
              <div className="space-y-1 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                <Label className="text-xs font-bold text-[#003366] uppercase tracking-wider block">
                  📍 Ubicación en Mapa (Coordenadas Predefinidas Exactas)
                </Label>
                <LocationPicker
                  lat={data.latitud || currentSedeData.lat}
                  lng={data.longitud || currentSedeData.lng}
                  titleBanner={buildingName ? `${buildingName} (${data.centro_regional})` : data.centro_regional}
                  onLocationChange={(nLat: string, nLng: string) => {
                    setData((prev) => ({
                      ...prev,
                      latitud: nLat,
                      longitud: nLng,
                    }));
                  }}
                />
              </div>
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
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">Imagen de portada</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Esta imagen aparecerá en la card del evento y como imagen principal.
                  </p>
                </div>
              </div>

              {/* Generador de Portadas con IA */}
              <div className="p-4 mb-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Generador de Portadas con IA (Automático)</h4>
                      <p className="text-[11px] text-indigo-700/80">Crea una portada institucional estilizada para este evento con 1 clic.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={aiTheme}
                      onChange={(e) => setAiTheme(e.target.value)}
                      className="h-9 text-xs rounded-xl border border-indigo-200 bg-white px-3 font-semibold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="academic">🎓 Académico UNAH</option>
                      <option value="tech">🚀 Tech & Futurista</option>
                      <option value="art">🎨 Arte & Cultura</option>
                      <option value="sports">🏆 Deportes & Salud</option>
                      <option value="social">🤝 Social & Comunidad</option>
                    </select>

                    <Button
                      type="button"
                      onClick={() => {
                        setIsGeneratingAiCover(true);
                        setTimeout(() => {
                          const aiImg = generateAiCoverCanvas(data.titulo, data.categoria, aiTheme);
                          if (aiImg) {
                            setImgPortada(aiImg);
                            set("usa_imagen_personalizada", true);
                            toast.success("¡Portada generada exitosamente con IA!");
                          } else {
                            toast.error("Error al generar portada con IA");
                          }
                          setIsGeneratingAiCover(false);
                        }, 250);
                      }}
                      disabled={isGeneratingAiCover}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 gap-1.5 rounded-xl shadow-xs transition-colors"
                    >
                      <Wand2 className="size-3.5" />
                      {isGeneratingAiCover ? "Generando..." : "Generar Portada IA"}
                    </Button>
                  </div>
                </div>
              </div>

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
                  "relative rounded-xl border-2 border-dashed p-5 text-center transition cursor-pointer bg-white",
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
                    <img src={imgPortada} alt="Portada Generada/Subida" className="max-h-28 rounded-lg object-contain border border-slate-200 shadow-2xs" />
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">✓ Portada Lista</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImgPortada(null);
                        }}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Quitar portada
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="size-8 text-muted-foreground/50" />
                    <div className="text-sm font-medium">
                      Arrastra o haz clic para subir portada propia
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
                .map((ch) => `${CATEGORY_LABEL_LONG[ch.categoria]}${data.tipo_evento === "HORAS_VOAE" ? ` (${ch.horas} hrs)` : ""}`)
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
            <Button
              type="button"
              variant="outline"
              onClick={handleExit}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold"
            >
              Cancelar
            </Button>
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
