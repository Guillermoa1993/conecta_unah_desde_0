import { useState } from "react";
import { Upload, CheckCircle2, X, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

const CATEGORIAS = ["Cultural","Deportivo","Académico","Social","Recreación"];
const MODALIDADES = ["Presencial","Virtual","Híbrido"];

interface FormData {
  titulo: string; categoria: string; modalidad: string;
  descripcion: string; fecha: string; horaInicio: string; horaFin: string;
  lugar: string; enlaceVirtual: string; capacidad: string; imagenes: string[];
}

export function SolicitarEvento() {
  const [form, setForm] = useState<FormData>({
    titulo:"", categoria:"", modalidad:"Presencial", descripcion:"",
    fecha:"", horaInicio:"", horaFin:"", lugar:"", enlaceVirtual:"", capacidad:"", imagenes:[],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData,string>>>({});
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);

  const set = (k: keyof FormData, v: string) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:""})); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.titulo.trim())       e.titulo       = "El título es obligatorio";
    if (!form.categoria)           e.categoria    = "Selecciona una categoría";
    if (!form.descripcion.trim())  e.descripcion  = "La descripción es obligatoria";
    if (!form.fecha)               e.fecha        = "La fecha es obligatoria";
    if (!form.horaInicio)          e.horaInicio   = "Hora de inicio requerida";
    if (!form.horaFin)             e.horaFin      = "Hora de fin requerida";
    if (form.modalidad !== "Virtual" && !form.lugar.trim()) e.lugar = "El lugar es obligatorio";
    if (form.modalidad !== "Presencial" && !form.enlaceVirtual.trim()) e.enlaceVirtual = "El enlace es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addImage = (file: File) => {
    if (form.imagenes.length >= 4) { toast.error("Máximo 4 imágenes"); return; }
    if (file.size > 5*1024*1024)   { toast.error("Máximo 5 MB por imagen"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f=>({...f, imagenes:[...f.imagenes, reader.result as string]}));
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!validate()) { toast.error("Corrige los errores antes de continuar"); return; }
    setSuccess(true);
    toast.success("¡Solicitud enviada! El equipo VOAE la revisará pronto.");
  };

  if (success) return (
    <div className="max-w-lg mx-auto text-center py-16 space-y-4 animate-fade-in">
      <div className="w-20 h-20 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 className="h-10 w-10 text-emerald-600"/>
      </div>
      <h2 className="text-2xl font-black text-[#003366]">¡Solicitud enviada!</h2>
      <p className="text-[#717182] text-sm">El equipo VOAE revisará tu propuesta y te notificará por correo institucional.</p>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 text-left space-y-2 text-sm">
        <p><strong className="text-[#717182]">Evento:</strong> <span className="text-[#003366]">{form.titulo}</span></p>
        <p><strong className="text-[#717182]">Categoría:</strong> <span className="text-[#003366]">{form.categoria}</span></p>
        <p><strong className="text-[#717182]">Modalidad:</strong> <span className="text-[#003366]">{form.modalidad}</span></p>
        <p><strong className="text-[#717182]">Fecha:</strong> <span className="text-[#003366]">{form.fecha} · {form.horaInicio} – {form.horaFin}</span></p>
      </div>
      <button onClick={()=>{setSuccess(false);setForm({titulo:"",categoria:"",modalidad:"Presencial",descripcion:"",fecha:"",horaInicio:"",horaFin:"",lugar:"",enlaceVirtual:"",capacidad:"",imagenes:[]});}}
        className="px-6 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">
        Solicitar otro evento
      </button>
    </div>
  );

  const Field = ({ label, error, children }: { label:string; error?:string; children:React.ReactNode }) => (
    <div>
      <label className="block text-[10px] font-black text-[#717182] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-1 font-semibold">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm text-[#003366] focus:outline-none transition-colors ${err ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-[#004B87]"}`;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-[#003366]">Solicitar Evento</h1>
        <p className="text-sm text-[#717182]">Propone un evento de recreación — el equipo VOAE lo revisará antes de publicarlo.</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 font-semibold">
        ⚠️ Los eventos solicitados por estudiantes son de tipo <strong>Recreación</strong> y no generan horas VOAE acreditables.
      </div>

      {/* Info básica */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Información del evento</h3>
        <Field label="Título del evento" error={errors.titulo}>
          <input type="text" value={form.titulo} onChange={e=>set("titulo",e.target.value)}
            placeholder="Ej. Torneo de Fútbol Sala UNAH 2026" className={inputCls(errors.titulo)}/>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoría" error={errors.categoria}>
            <select value={form.categoria} onChange={e=>set("categoria",e.target.value)} className={inputCls(errors.categoria)}>
              <option value="">Seleccionar...</option>
              {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Modalidad">
            <select value={form.modalidad} onChange={e=>set("modalidad",e.target.value)} className={inputCls()}>
              {MODALIDADES.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Descripción" error={errors.descripcion}>
          <textarea rows={3} value={form.descripcion} onChange={e=>set("descripcion",e.target.value)}
            placeholder="Describe el propósito y dinámica del evento..." className={`${inputCls(errors.descripcion)} resize-none`}/>
        </Field>
      </div>

      {/* Fecha y lugar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#004B87]"/>Fecha y lugar
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Fecha" error={errors.fecha}>
            <input type="date" value={form.fecha} onChange={e=>set("fecha",e.target.value)} className={inputCls(errors.fecha)}/>
          </Field>
          <Field label="Hora inicio" error={errors.horaInicio}>
            <input type="time" value={form.horaInicio} onChange={e=>set("horaInicio",e.target.value)} className={inputCls(errors.horaInicio)}/>
          </Field>
          <Field label="Hora fin" error={errors.horaFin}>
            <input type="time" value={form.horaFin} onChange={e=>set("horaFin",e.target.value)} className={inputCls(errors.horaFin)}/>
          </Field>
        </div>
        {form.modalidad !== "Virtual" && (
          <Field label="Lugar / Instalación" error={errors.lugar}>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
              <input type="text" value={form.lugar} onChange={e=>set("lugar",e.target.value)}
                placeholder="Ej. Cancha principal CU" className={`${inputCls(errors.lugar)} pl-9`}/>
            </div>
          </Field>
        )}
        {form.modalidad !== "Presencial" && (
          <Field label="Enlace virtual (Zoom / Meet)" error={errors.enlaceVirtual}>
            <input type="url" value={form.enlaceVirtual} onChange={e=>set("enlaceVirtual",e.target.value)}
              placeholder="https://..." className={inputCls(errors.enlaceVirtual)}/>
          </Field>
        )}
        <Field label="Capacidad estimada (opcional)">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
            <input type="number" min="1" value={form.capacidad} onChange={e=>set("capacidad",e.target.value)}
              placeholder="Ej. 50" className={`${inputCls()} pl-9`}/>
          </div>
        </Field>
      </div>

      {/* Imágenes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider flex items-center gap-2">
          <Upload className="h-4 w-4 text-[#004B87]"/>Imágenes del evento (máx. 4)
        </h3>
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);Array.from(e.dataTransfer.files).forEach(addImage);}}
          onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.multiple=true;i.onchange=ev=>{Array.from((ev.target as HTMLInputElement).files??[]).forEach(addImage);};i.click();}}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging?"border-[#004B87] bg-blue-50":"border-gray-200 hover:border-[#004B87]/40 hover:bg-gray-50"}`}>
          <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2"/>
          <p className="text-xs font-semibold text-[#717182]">Arrastra imágenes aquí o haz clic para seleccionar</p>
          <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG · Máx. 5 MB cada una</p>
        </div>
        {form.imagenes.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {form.imagenes.map((img,i)=>(
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover"/>
                <button onClick={()=>setForm(f=>({...f,imagenes:f.imagenes.filter((_,j)=>j!==i)}))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 transition-colors">
                  <X className="h-3 w-3"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSubmit}
        className="w-full py-3 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl font-bold transition-colors">
        Enviar solicitud a VOAE
      </button>
    </div>
  );
}
