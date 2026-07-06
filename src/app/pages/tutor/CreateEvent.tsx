import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronRight, ChevronLeft, Check, Upload, X, Star,
  MapPin, Link2, Users, Clock, Calendar, Building2,
  Eye, QrCode, ImageOff, AlertCircle, Download, Send,
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { LocationPicker } from "../../components/map/LocationPicker";

/* ─── Types ─── */
type Categoria = "ACADEMICO" | "CULTURAL" | "DEPORTIVO" | "SOCIAL";
type TipoActividad = "Presencial" | "Virtual" | "Híbrido";
type TipoEvento = "HORAS_VOAE" | "RECREACION";
type Visibilidad = "PUBLICO" | "PRIVADO";
type TipoDuracion = "TOTALES" | "DIARIAS";

interface FormData {
  titulo: string;
  categoria: Categoria | "";
  tipo_actividad: TipoActividad | "";
  tipo_evento: TipoEvento | "";
  descripcion: string;
  visibilidad: Visibilidad | "";
  centro_regional: string;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion: string;
  enlace_virtual: string;
  cupo_maximo: string;
  duracion_horas: string;
  tipo_duracion: TipoDuracion;
  requiere_inscripcion: string;
  usa_imagenes: boolean;
  invitados: string[];
  latitud: number | null;
  longitud: number | null;
}

interface FormErrors { [k: string]: string }

const STEPS = [
  { id: 1, label: "Información básica" },
  { id: 2, label: "Fecha, lugar y capacidad" },
  { id: 3, label: "Material visual" },
  { id: 4, label: "Revisión y publicación" },
];

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: "ACADEMICO",  label: "Académico" },
  { value: "CULTURAL",   label: "Cultural" },
  { value: "DEPORTIVO",  label: "Deportivo" },
  { value: "SOCIAL",     label: "Social" },
];

const CENTROS = [
  "Ciudad Universitaria",
  "CURLA – La Ceiba",
  "CURC – Choluteca",
  "CURH – Siguatepeque",
  "CURN – San Pedro Sula",
  "CURO – Danlí",
];

const today = () => new Date().toISOString().slice(0, 10);

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/* ─── Helper UI ─── */
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-black text-[#717182] uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="flex items-center gap-1 text-[10px] text-red-500 mt-1 font-semibold"><AlertCircle className="h-3 w-3"/>{msg}</p>;
}

function inputCls(err?: string) {
  return `w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm text-[#003366] focus:outline-none transition-colors ${err ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#004B87]"}`;
}

/* ─── Step indicator ─── */
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
              current > s.id  ? "bg-[#004B87] border-[#004B87] text-white"
              : current === s.id ? "bg-white border-[#004B87] text-[#004B87]"
              : "bg-white border-gray-300 text-gray-400"
            }`}>
              {current > s.id ? <Check className="h-4 w-4"/> : s.id}
            </div>
            <span className={`text-[9px] font-bold mt-1 text-center max-w-[70px] leading-tight ${current === s.id ? "text-[#004B87]" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 ${current > s.id ? "bg-[#004B87]" : "bg-gray-200"}`}/>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Step 1: Información básica ─── */
function Step1({ form, errors, set }: { form: FormData; errors: FormErrors; set: (k: keyof FormData, v: any) => void }) {
  const [invitadoInput, setInvitadoInput] = useState("");
  const words = countWords(form.descripcion);

  const addInvitado = () => {
    const val = invitadoInput.trim();
    if (!val) return;
    if (form.invitados.includes(val)) { toast.error("Ya fue agregado"); return; }
    set("invitados", [...form.invitados, val]);
    setInvitadoInput("");
  };

  return (
    <div className="space-y-5">
      {/* Título */}
      <div>
        <FieldLabel required>Título del evento</FieldLabel>
        <input type="text" value={form.titulo} maxLength={150}
          onChange={e => set("titulo", e.target.value)}
          placeholder="Ej: Festival Cultural UNAH 2026"
          className={inputCls(errors.titulo)}/>
        <div className="flex justify-between mt-1">
          <FieldError msg={errors.titulo}/>
          <span className={`text-[10px] ml-auto ${form.titulo.length > 130 ? "text-amber-500" : "text-gray-400"}`}>{form.titulo.length}/150</span>
        </div>
      </div>

      {/* Categoría + Tipo actividad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Categoría / Ámbito</FieldLabel>
          <select value={form.categoria} onChange={e => set("categoria", e.target.value)} className={inputCls(errors.categoria)}>
            <option value="">Seleccionar...</option>
            {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <FieldError msg={errors.categoria}/>
        </div>
        <div>
          <FieldLabel required>Tipo de actividad</FieldLabel>
          <select value={form.tipo_actividad} onChange={e => set("tipo_actividad", e.target.value)} className={inputCls(errors.tipo_actividad)}>
            <option value="">Seleccionar...</option>
            <option value="Presencial">Presencial</option>
            <option value="Virtual">Virtual</option>
            <option value="Híbrido">Híbrido</option>
          </select>
          <FieldError msg={errors.tipo_actividad}/>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <FieldLabel required>Descripción del evento</FieldLabel>
        <textarea rows={4} value={form.descripcion}
          onChange={e => set("descripcion", e.target.value)}
          placeholder="Describe el contenido, objetivos y dinámica del evento..."
          className={`${inputCls(errors.descripcion)} resize-none`}/>
        <div className="flex justify-between mt-1">
          <FieldError msg={errors.descripcion}/>
          <span className={`text-[10px] ml-auto ${words > 90 ? "text-amber-500" : "text-gray-400"}`}>{words}/100 palabras</span>
        </div>
      </div>

      {/* Tipo de evento + Visibilidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Tipo de evento</FieldLabel>
          <select value={form.tipo_evento} onChange={e => set("tipo_evento", e.target.value)} className={inputCls(errors.tipo_evento)}>
            <option value="">Seleccionar...</option>
            <option value="HORAS_VOAE">Con horas VOAE (Artículo 140)</option>
            <option value="RECREACION">Evento de recreación</option>
          </select>
          <FieldError msg={errors.tipo_evento}/>
        </div>
        <div>
          <FieldLabel required>Visibilidad</FieldLabel>
          <select value={form.visibilidad} onChange={e => set("visibilidad", e.target.value)} className={inputCls(errors.visibilidad)}>
            <option value="">Seleccionar...</option>
            <option value="PUBLICO">Público — visible para todos</option>
            <option value="PRIVADO">Privado — solo invitados</option>
          </select>
          <FieldError msg={errors.visibilidad}/>
        </div>
      </div>

      {/* Centro regional */}
      <div>
        <FieldLabel>Centro regional</FieldLabel>
        <select value={form.centro_regional} onChange={e => set("centro_regional", e.target.value)} className={inputCls()}>
          <option value="">Seleccionar sede...</option>
          {CENTROS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Invitados (solo si PRIVADO) */}
      {form.visibilidad === "PRIVADO" && (
        <div>
          <FieldLabel>Estudiantes invitados</FieldLabel>
          <div className="flex gap-2">
            <input type="text" value={invitadoInput}
              onChange={e => setInvitadoInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addInvitado())}
              placeholder="Número de cuenta o nombre..."
              className={`${inputCls()} flex-1`}/>
            <button type="button" onClick={addInvitado}
              className="px-4 py-2.5 bg-[#004B87] text-white rounded-xl text-sm font-bold hover:bg-[#003366] transition-colors">
              Invitar
            </button>
          </div>
          {form.invitados.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.invitados.map(inv => (
                <span key={inv} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-[#003366] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {inv}
                  <button type="button" onClick={() => set("invitados", form.invitados.filter(i => i !== inv))}>
                    <X className="h-3 w-3 text-gray-400 hover:text-red-400"/>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Fecha, lugar y capacidad ─── */
function Step2({ form, errors, set }: { form: FormData; errors: FormErrors; set: (k: keyof FormData, v: any) => void }) {
  return (
    <div className="space-y-5">
      {/* Fechas */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#004B87]"/>Fechas del evento
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Fecha de inicio</FieldLabel>
            <input type="date" value={form.fecha_inicio} min={today()}
              onChange={e => set("fecha_inicio", e.target.value)} className={inputCls(errors.fecha_inicio)}/>
            <FieldError msg={errors.fecha_inicio}/>
          </div>
          <div>
            <FieldLabel required>Fecha de finalización</FieldLabel>
            <input type="date" value={form.fecha_fin} min={form.fecha_inicio || today()}
              onChange={e => set("fecha_fin", e.target.value)} className={inputCls(errors.fecha_fin)}/>
            <FieldError msg={errors.fecha_fin}/>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel required>Hora de inicio</FieldLabel>
            <input type="time" value={form.hora_inicio}
              onChange={e => set("hora_inicio", e.target.value)} className={inputCls(errors.hora_inicio)}/>
            <FieldError msg={errors.hora_inicio}/>
          </div>
          <div>
            <FieldLabel required>Hora de fin</FieldLabel>
            <input type="time" value={form.hora_fin}
              onChange={e => set("hora_fin", e.target.value)} className={inputCls(errors.hora_fin)}/>
            <FieldError msg={errors.hora_fin}/>
          </div>
        </div>
      </div>

      {/* Lugar */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#004B87]"/>Lugar
        </h3>

        {(form.tipo_actividad === "Presencial" || form.tipo_actividad === "Híbrido") && (
          <div className="space-y-3">
            <div>
              <FieldLabel required>Descripción del lugar</FieldLabel>
              <input type="text" value={form.ubicacion} maxLength={200}
                onChange={e => set("ubicacion", e.target.value)}
                placeholder="Ej: Aula Magna, Ciudad Universitaria"
                className={inputCls(errors.ubicacion)}/>
              <FieldError msg={errors.ubicacion}/>
            </div>
            <div>
              <FieldLabel>Selecciona en el mapa</FieldLabel>
              <LocationPicker
                lat={form.latitud}
                lng={form.longitud}
                onChange={(lat, lng) => { set("latitud", lat); set("longitud", lng); }}
              />
            </div>
          </div>
        )}

        {(form.tipo_actividad === "Virtual" || form.tipo_actividad === "Híbrido") && (
          <div>
            <FieldLabel required>Enlace virtual</FieldLabel>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <input type="url" value={form.enlace_virtual}
                onChange={e => set("enlace_virtual", e.target.value)}
                placeholder="https://zoom.us/j/..."
                className={`${inputCls(errors.enlace_virtual)} pl-9`}/>
            </div>
            <FieldError msg={errors.enlace_virtual}/>
          </div>
        )}

        {!form.tipo_actividad && (
          <p className="text-xs text-[#717182] italic">Selecciona el tipo de actividad en el paso anterior para ver los campos de lugar.</p>
        )}
      </div>

      {/* Capacidad y duración */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4">
        <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <Users className="h-4 w-4 text-[#004B87]"/>Capacidad y duración
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel required>Cupo máximo</FieldLabel>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <input type="number" min="1" value={form.cupo_maximo}
                onChange={e => set("cupo_maximo", e.target.value)}
                placeholder="Ej: 50"
                className={`${inputCls(errors.cupo_maximo)} pl-9`}/>
            </div>
            <FieldError msg={errors.cupo_maximo}/>
          </div>
          <div>
            <FieldLabel required>Duración en horas</FieldLabel>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <input type="number" min="0.5" step="0.5" value={form.duracion_horas}
                onChange={e => set("duracion_horas", e.target.value)}
                placeholder="Ej: 2"
                className={`${inputCls(errors.duracion_horas)} pl-9`}/>
            </div>
            <FieldError msg={errors.duracion_horas}/>
          </div>
          <div>
            <FieldLabel>Tipo de duración</FieldLabel>
            <select value={form.tipo_duracion} onChange={e => set("tipo_duracion", e.target.value)} className={inputCls()}>
              <option value="TOTALES">Horas totales</option>
              <option value="DIARIAS">Horas diarias</option>
            </select>
          </div>
        </div>
        <div>
          <FieldLabel required>¿Requiere inscripción previa?</FieldLabel>
          <select value={form.requiere_inscripcion} onChange={e => set("requiere_inscripcion", e.target.value)} className={inputCls(errors.requiere_inscripcion)}>
            <option value="">Seleccionar...</option>
            <option value="SI">Sí</option>
            <option value="NO">No</option>
          </select>
          <FieldError msg={errors.requiere_inscripcion}/>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Material visual ─── */
function Step3({ form, set, portada, setPortada, galeria, setGaleria }:
  { form: FormData; set: (k: keyof FormData, v: any) => void;
    portada: string | null; setPortada: (v: string | null) => void;
    galeria: string[]; setGaleria: (v: string[]) => void; }) {

  const portadaRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [draggingPortada, setDraggingPortada] = useState(false);
  const [draggingGaleria, setDraggingGaleria] = useState(false);
  const [portadaIdx, setPortadaIdx] = useState(0); // which galería image is the cover

  const loadFile = (file: File, cb: (url: string) => void) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("Máximo 5 MB por imagen"); return; }
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("Solo JPG, PNG o WEBP"); return; }
    const r = new FileReader();
    r.onloadend = () => cb(r.result as string);
    r.readAsDataURL(file);
  };

  const handlePortadaDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDraggingPortada(false);
    const f = e.dataTransfer.files[0]; if (f) loadFile(f, setPortada);
  };

  const handleGaleriaDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDraggingGaleria(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => {
      if (galeria.length >= 4) { toast.error("Máximo 4 imágenes"); return; }
      loadFile(f, url => setGaleria([...galeria, url]));
    });
  };

  return (
    <div className="space-y-5">
      {/* Toggle */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
        <div>
          <p className="text-sm font-bold text-[#003366]">¿Agregar imágenes al evento?</p>
          <p className="text-xs text-[#717182]">Si no subes imágenes se usará un banner genérico de UNAH</p>
        </div>
        <button type="button" onClick={() => set("usa_imagenes", !form.usa_imagenes)}
          className={`w-12 h-6 rounded-full transition-colors relative ${form.usa_imagenes ? "bg-[#004B87]" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.usa_imagenes ? "translate-x-6" : "translate-x-0.5"}`}/>
        </button>
      </div>

      {!form.usa_imagenes && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
          <ImageOff className="h-12 w-12 text-gray-300"/>
          <p className="text-sm font-semibold text-[#717182]">Se usará banner automático de UNAH</p>
          <p className="text-xs text-gray-400">Activa el toggle para subir tus propias imágenes</p>
        </div>
      )}

      {form.usa_imagenes && (
        <>
          {/* Imagen de portada */}
          <div>
            <FieldLabel required>Imagen de portada</FieldLabel>
            <input ref={portadaRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f, setPortada); }}/>
            {portada ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video">
                <img src={portada} alt="portada" className="w-full h-full object-cover"/>
                <button type="button" onClick={() => setPortada(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                  <X className="h-4 w-4"/>
                </button>
                <div className="absolute bottom-2 left-2 bg-[#004B87]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Portada</div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDraggingPortada(true); }}
                onDragLeave={() => setDraggingPortada(false)}
                onDrop={handlePortadaDrop}
                onClick={() => portadaRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${draggingPortada ? "border-[#004B87] bg-blue-50" : "border-gray-200 hover:border-[#004B87]/50 hover:bg-gray-50"}`}>
                <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2"/>
                <p className="text-sm font-semibold text-[#717182]">Arrastra o haz clic para subir portada</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG · PNG · WEBP · Máx. 5 MB</p>
              </div>
            )}
          </div>

          {/* Galería */}
          <div>
            <FieldLabel>Imágenes adicionales del evento (máx. 4)</FieldLabel>
            <input ref={galeriaRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => {
                Array.from(e.target.files ?? []).forEach(f => {
                  if (galeria.length >= 4) { toast.error("Máximo 4 imágenes"); return; }
                  loadFile(f, url => setGaleria(prev => [...prev, url]));
                });
              }}/>

            {galeria.length < 4 && (
              <div
                onDragOver={e => { e.preventDefault(); setDraggingGaleria(true); }}
                onDragLeave={() => setDraggingGaleria(false)}
                onDrop={handleGaleriaDrop}
                onClick={() => galeriaRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3 ${draggingGaleria ? "border-[#004B87] bg-blue-50" : "border-gray-200 hover:border-[#004B87]/40 hover:bg-gray-50"}`}>
                <Upload className="h-6 w-6 text-gray-300 mx-auto mb-1"/>
                <p className="text-xs font-semibold text-[#717182]">Arrastra imágenes o haz clic · {galeria.length}/4</p>
              </div>
            )}

            {galeria.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {galeria.map((img, i) => (
                  <div key={i} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${i === portadaIdx ? "border-[#FFD100]" : "border-gray-200"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover"/>
                    <button type="button" onClick={() => setPortadaIdx(i)}
                      title="Marcar como portada"
                      className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${i === portadaIdx ? "bg-[#FFD100] text-[#003366]" : "bg-black/40 text-white hover:bg-[#FFD100] hover:text-[#003366]"}`}>
                      <Star className="h-3 w-3"/>
                    </button>
                    <button type="button" onClick={() => { setGaleria(galeria.filter((_,j) => j !== i)); if (portadaIdx >= galeria.length - 1) setPortadaIdx(0); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
                      <X className="h-3 w-3"/>
                    </button>
                    {i === portadaIdx && <div className="absolute bottom-1 left-1 bg-[#FFD100] text-[#003366] text-[8px] font-black px-1.5 py-0.5 rounded-full">Portada</div>}
                  </div>
                ))}
              </div>
            )}
            {galeria.length > 0 && <p className="text-[10px] text-[#717182] mt-1.5">Haz clic en la ⭐ para seleccionar la imagen de portada</p>}
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Step 4: Revisión y publicación ─── */
function Step4({ form, portada, galeria }: { form: FormData; portada: string | null; galeria: string[] }) {
  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white">
        <Icon className="h-4 w-4 text-[#004B87]"/>
        <span className="text-sm font-black text-[#003366]">{title}</span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div>
      <span className="text-[10px] font-black text-[#717182] uppercase tracking-wider">{label}</span>
      <p className="text-sm font-semibold text-[#003366] mt-0.5">{value || <span className="text-gray-400 font-normal italic">No especificado</span>}</p>
    </div>
  );

  const categoriaLabel = CATEGORIAS.find(c => c.value === form.categoria)?.label ?? form.categoria;

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-semibold flex items-center gap-2">
        <Eye className="h-4 w-4 flex-shrink-0"/>
        Revisa la información antes de publicar. Los datos en <strong>amarillo</strong> requerirán aprobación VOAE si el evento tiene horas.
      </div>

      <Section title="Información básica" icon={Building2}>
        <Row label="Título" value={form.titulo}/>
        <Row label="Categoría" value={categoriaLabel}/>
        <Row label="Tipo de actividad" value={form.tipo_actividad}/>
        <Row label="Tipo de evento" value={form.tipo_evento === "HORAS_VOAE" ? "Con horas VOAE (Art. 140)" : form.tipo_evento === "RECREACION" ? "Recreación" : ""}/>
        <Row label="Visibilidad" value={form.visibilidad === "PUBLICO" ? "Público" : form.visibilidad === "PRIVADO" ? `Privado (${form.invitados.length} invitado${form.invitados.length !== 1 ? "s" : ""})` : ""}/>
        <Row label="Centro regional" value={form.centro_regional}/>
        <div className="sm:col-span-2">
          <span className="text-[10px] font-black text-[#717182] uppercase tracking-wider">Descripción</span>
          <p className="text-sm text-[#003366] mt-0.5 leading-relaxed">{form.descripcion || <span className="text-gray-400 italic">Sin descripción</span>}</p>
        </div>
      </Section>

      <Section title="Fecha, lugar y capacidad" icon={Calendar}>
        <Row label="Fecha inicio" value={form.fecha_inicio}/>
        <Row label="Fecha fin" value={form.fecha_fin}/>
        <Row label="Hora inicio" value={form.hora_inicio}/>
        <Row label="Hora fin" value={form.hora_fin}/>
        {form.ubicacion && <Row label="Ubicación física" value={form.ubicacion}/>}
        {form.latitud !== null && form.longitud !== null && (
          <Row label="Coordenadas" value={`${form.latitud}, ${form.longitud}`}/>
        )}
        {form.enlace_virtual && <Row label="Enlace virtual" value={form.enlace_virtual}/>}
        <Row label="Cupo máximo" value={form.cupo_maximo ? `${form.cupo_maximo} participantes` : ""}/>
        <Row label="Duración" value={form.duracion_horas ? `${form.duracion_horas}h ${form.tipo_duracion === "DIARIAS" ? "diarias" : "totales"}` : ""}/>
        <Row label="Inscripción previa" value={form.requiere_inscripcion === "SI" ? "Sí" : form.requiere_inscripcion === "NO" ? "No" : ""}/>
      </Section>

      <Section title="Material visual" icon={Eye}>
        {form.usa_imagenes ? (
          <>
            <div className="sm:col-span-2">
              {portada ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-200 max-w-xs">
                  <img src={portada} alt="portada" className="w-full h-full object-cover"/>
                </div>
              ) : <p className="text-xs text-[#717182] italic">Sin imagen de portada</p>}
            </div>
            {galeria.length > 0 && (
              <div className="sm:col-span-2">
                <span className="text-[10px] font-black text-[#717182] uppercase tracking-wider">Galería ({galeria.length} imagen{galeria.length !== 1 ? "es" : ""})</span>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {galeria.map((img, i) => <img key={i} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200"/>)}
                </div>
              </div>
            )}
          </>
        ) : <div className="sm:col-span-2 text-xs text-[#717182] italic flex items-center gap-2"><ImageOff className="h-4 w-4"/>Se usará banner automático de UNAH</div>}
      </Section>

      {/* QR info */}
      <div className="flex items-center gap-3 bg-[#004B87]/5 border border-[#004B87]/20 rounded-xl px-4 py-3">
        <QrCode className="h-5 w-5 text-[#004B87] flex-shrink-0"/>
        <p className="text-xs text-[#003366] font-semibold">El código QR de inscripción se generará automáticamente al publicar el evento.</p>
      </div>

      {/* Estado final */}
      {form.tipo_evento && (
        <div className={`rounded-xl px-4 py-3 text-xs font-bold flex items-center gap-2 ${form.tipo_evento === "HORAS_VOAE" ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
          <Check className="h-4 w-4 flex-shrink-0"/>
          {form.tipo_evento === "HORAS_VOAE"
            ? "El evento quedará en estado PENDIENTE DE APROBACIÓN hasta que VOAE lo valide."
            : "El evento se publicará inmediatamente con estado PROGRAMADO."}
        </div>
      )}
    </div>
  );
}

/* ─── Success screen ─── */
function SuccessScreen({ form, qrValue, onReset }: { form: FormData; qrValue: string; onReset: () => void }) {
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const isVoae = form.tipo_evento === "HORAS_VOAE";

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) { toast.error("Error al descargar el QR"); return; }
    const link = document.createElement("a");
    link.download = `qr-${form.titulo.replace(/\s/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("QR descargado");
  };

  return (
    <div className="max-w-lg mx-auto text-center py-12">
      <div className={`size-20 mx-auto rounded-full grid place-items-center mb-5 ${isVoae ? "bg-amber-50" : "bg-emerald-50"}`}>
        <Send className={`size-10 ${isVoae ? "text-amber-800" : "text-emerald-600"}`}/>
      </div>
      <h2 className="text-2xl font-bold text-[#003366]">
        {isVoae ? "¡Evento enviado a VOAE!" : "¡Tu evento fue publicado!"}
      </h2>
      <p className="text-sm text-muted-foreground mt-2">
        {isVoae
          ? "Tu evento está pendiente de aprobación. Recibirás una notificación cuando VOAE lo revise."
          : "Ya es visible para los estudiantes."}
      </p>

      <div className="flex items-center justify-center gap-2 mt-3">
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
          form.visibilidad === "PUBLICO" ? "bg-green-100 text-green-800 border-green-300" : "bg-amber-100 text-amber-800 border-amber-300"
        }`}>
          {form.visibilidad === "PUBLICO" ? "Público" : "Privado"}
        </span>
      </div>

      {/* QR canvas */}
      <div className="mt-6 mx-auto w-64 aspect-square rounded-xl border-2 border-gray-200 p-4 grid place-items-center bg-white"
        ref={qrRef}>
        <QRCodeCanvas value={qrValue} size={220} level="M"/>
      </div>
      <div className="mt-3 text-sm font-semibold text-[#003366]">{form.titulo}</div>

      <div className="flex gap-3 mt-5 justify-center">
        <button onClick={downloadQR}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">
          <Download className="size-4"/>Descargar QR
        </button>
        <button onClick={() => navigate("/tutor")}
          className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#717182] hover:bg-gray-50 transition-colors">
          Ir al panel
        </button>
      </div>
      <button onClick={onReset}
        className="mt-3 text-xs text-muted-foreground underline hover:text-foreground">
        Crear otro evento
      </button>
    </div>
  );
}

/* ─── Main component ─── */
const INITIAL: FormData = {
  titulo: "", categoria: "ACADEMICO", tipo_actividad: "Presencial", tipo_evento: "HORAS_VOAE",
  descripcion: "", visibilidad: "PUBLICO", centro_regional: "Ciudad Universitaria",
  fecha_inicio: "", fecha_fin: "", hora_inicio: "", hora_fin: "",
  ubicacion: "", enlace_virtual: "",
  cupo_maximo: "", duracion_horas: "", tipo_duracion: "TOTALES",
  requiere_inscripcion: "SI", usa_imagenes: false, invitados: [],
  latitud: null, longitud: null,
};

export function CreateEvent() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [portada, setPortada] = useState<string | null>(null);
  const [galeria, setGaleria] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [qrValue, setQrValue] = useState("");

  const set = (k: keyof FormData, v: any) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: "" }));
  };

  /* Validation por paso */
  const validate = (s: number): FormErrors => {
    const e: FormErrors = {};
    if (s === 1) {
      if (!form.titulo.trim()) e.titulo = "El título es obligatorio";
      if (!form.categoria) e.categoria = "Selecciona una categoría";
      if (!form.tipo_actividad) e.tipo_actividad = "Selecciona el tipo de actividad";
      if (!form.descripcion.trim()) e.descripcion = "La descripción es obligatoria";
      if (countWords(form.descripcion) > 100) e.descripcion = "Máximo 100 palabras";
      if (!form.tipo_evento) e.tipo_evento = "Selecciona el tipo de evento";
      if (!form.visibilidad) e.visibilidad = "Selecciona la visibilidad";
    }
    if (s === 2) {
      if (!form.fecha_inicio) e.fecha_inicio = "La fecha de inicio es obligatoria";
      if (!form.fecha_fin) e.fecha_fin = "La fecha de fin es obligatoria";
      if (form.fecha_fin && form.fecha_inicio && form.fecha_fin < form.fecha_inicio) e.fecha_fin = "La fecha de fin debe ser mayor o igual a la de inicio";
      if (!form.hora_inicio) e.hora_inicio = "La hora de inicio es obligatoria";
      if (!form.hora_fin) e.hora_fin = "La hora de fin es obligatoria";
      if (form.fecha_inicio === form.fecha_fin && form.hora_fin && form.hora_inicio && form.hora_fin <= form.hora_inicio) e.hora_fin = "La hora de fin debe ser posterior a la de inicio";
      if ((form.tipo_actividad === "Presencial" || form.tipo_actividad === "Híbrido") && !form.ubicacion.trim()) e.ubicacion = "La ubicación física es obligatoria";
      if ((form.tipo_actividad === "Virtual" || form.tipo_actividad === "Híbrido") && !form.enlace_virtual.trim()) e.enlace_virtual = "El enlace virtual es obligatorio";
      if (form.enlace_virtual && !form.enlace_virtual.startsWith("https://")) e.enlace_virtual = "El enlace debe iniciar con https://";
      if (!form.cupo_maximo || Number(form.cupo_maximo) < 1) e.cupo_maximo = "Cupo mínimo: 1";
      if (!form.duracion_horas || Number(form.duracion_horas) < 0.5) e.duracion_horas = "Mínimo 0.5 horas";
      if (!form.requiere_inscripcion) e.requiere_inscripcion = "Indica si requiere inscripción";
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); toast.error("Corrige los errores antes de continuar"); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const prev = () => { setErrors({}); setStep(s => s - 1); };

  const submit = () => {
    const e1 = validate(1); const e2 = validate(2);
    const allErrors = { ...e1, ...e2 };
    if (Object.keys(allErrors).length) {
      setErrors(allErrors);
      toast.error("Corrige los campos marcados en pasos anteriores");
      return;
    }
    const mockId = `evt-${form.titulo.replace(/\s/g, "-").toLowerCase().slice(0, 20)}-${Math.random().toString(36).slice(2,8)}`;
    const token  = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    setQrValue(`https://conectapumas.app/inscribirse/${mockId}/${token}`);
    toast.success(form.tipo_evento === "HORAS_VOAE" ? "Evento enviado a VOAE para aprobación" : "¡Evento publicado exitosamente!");
    setSuccess(true);
  };

  const reset = () => { setForm(INITIAL); setPortada(null); setGaleria([]); setErrors({}); setQrValue(""); setSuccess(false); setStep(1); };

  if (success) return (
    <div className="max-w-2xl mx-auto">
      <SuccessScreen form={form} qrValue={qrValue} onReset={reset}/>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-2 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-black text-[#003366]">Crear Evento</h1>
        <p className="text-sm text-[#717182]">Paso {step} de {STEPS.length} — {STEPS[step-1].label}</p>
      </div>

      <StepBar current={step}/>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm min-h-[420px]">
        {step === 1 && <Step1 form={form} errors={errors} set={set}/>}
        {step === 2 && <Step2 form={form} errors={errors} set={set}/>}
        {step === 3 && <Step3 form={form} set={set} portada={portada} setPortada={setPortada} galeria={galeria} setGaleria={v => setGaleria(typeof v === "function" ? v(galeria) : v)}/>}
        {step === 4 && <Step4 form={form} portada={portada} galeria={galeria}/>}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {step > 1 && (
          <button type="button" onClick={prev}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#717182] hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4"/>Anterior
          </button>
        )}
        <div className="flex-1"/>
        {step < 4 && (
          <button type="button" onClick={next}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">
            Siguiente<ChevronRight className="h-4 w-4"/>
          </button>
        )}
        {step === 4 && (
          <button type="button" onClick={submit}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">
            <Check className="h-4 w-4"/>
            {form.tipo_evento === "HORAS_VOAE" ? "Enviar a VOAE" : "Publicar evento"}
          </button>
        )}
      </div>
    </div>
  );
}
