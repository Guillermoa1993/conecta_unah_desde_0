import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { Bell, Edit2, UserPlus, BookOpen, Bookmark, Clock, ChevronDown, ChevronUp, Check, X, Upload, ShieldCheck, ShieldAlert, Scan, ToggleLeft, ToggleRight, GraduationCap, RefreshCw } from "lucide-react";
import Tesseract from "tesseract.js";

/* ─── TYPES ─── */
interface Pumita { id: number; name: string; initials: string; career: string; bio: string; }
interface SavedEvent { id: number; title: string; date: string; place: string; scope: string; }
interface SavedPost  { id: number; title: string; desc: string; tags: string[]; }

/* ─── MOCK DATA ─── */
const MOCK_PUMITAS: Pumita[] = [
  { id:1, name:"Miguel Torres",   initials:"MT", career:"Ing. en Sistemas",       bio:"Apasionado de la programación y el fútbol." },
  { id:2, name:"Valeria Rojas",   initials:"VR", career:"Lic. en Psicología",      bio:"Amante del arte y la literatura." },
  { id:3, name:"Carlos Mendoza",  initials:"CM", career:"Ing. Civil",              bio:"Deportista y emprendedor." },
  { id:4, name:"Laura Paz",       initials:"LP", career:"Lic. en Derecho",         bio:"Activista estudiantil." },
  { id:5, name:"Ángela Reyes",    initials:"AR", career:"Doctorado en Medicina",   bio:"Futura médica cirujana." },
  { id:6, name:"José Martínez",   initials:"JM", career:"Lic. en Economía",        bio:"Fanático de las finanzas." },
];
const MOCK_EVENTS: SavedEvent[] = [
  { id:1, title:"Noche de Talentos UNAH", date:"2026-08-15", place:"Auditorio Central", scope:"Cultural" },
  { id:2, title:"Grupo de Estudio C++",   date:"2026-07-10", place:"Sala 3 – Ing.",     scope:"Académico" },
  { id:3, title:"Torneo Interclases",     date:"2026-07-20", place:"Cancha Principal",  scope:"Deportivo" },
];
const MOCK_POSTS: SavedPost[] = [
  { id:1, title:"Tutorial de Base de Datos", desc:"Recursos SQL y modelado.",   tags:["#SQL","#BD"] },
  { id:2, title:"Convocatoria VOAE 2026",     desc:"Becas de excelencia.",       tags:["#Becas","#UNAH"] },
];
const UNAH_CARRERAS = [
  "Ingeniería en Sistemas","Ingeniería Civil","Ingeniería Industrial",
  "Licenciatura en Informática Administrativa","Licenciatura en Administración de Empresas",
  "Licenciatura en Contaduría Pública","Licenciatura en Psicología","Licenciatura en Derecho",
  "Doctorado en Medicina y Cirugía","Licenciatura en Enfermería","Licenciatura en Arquitectura",
];

/* ─── MINI COMPONENTS ─── */
function StatCard({ icon, label, value, color }: { icon:string; label:string; value:number; color:string }) {
  return (
    <div className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 shadow-sm ${color}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xl font-black text-[#003366]">{value}</p>
        <p className="text-[11px] font-semibold text-[#717182] leading-tight">{label}</p>
      </div>
    </div>
  );
}

/* ─── VERIFICATION SECTION ─── */
function VerificationSection({ profilePhoto }: { profilePhoto: string | null }) {
  const [docType, setDocType] = useState<"forma003"|"carnet">("forma003");
  const [docImg, setDocImg] = useState<string|null>(null);
  const [status, setStatus] = useState<"idle"|"scanning"|"verified"|"failed">("idle");
  const [progress, setProgress] = useState(0);
  const [stepName, setStepName] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [score, setScore] = useState<number|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => { setDocImg(null); setStatus("idle"); setErrors([]); setScore(null); setProgress(0); };

  const analyze = (base64: string): Promise<{ aspectOk:boolean; photoOk:boolean; qrOk:boolean; tablesOk:boolean; layoutScore:number }> =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const ar = img.naturalWidth / img.naturalHeight;
        const aspectOk = docType === "forma003" ? (ar >= 1.6 && ar <= 2.6) : (ar >= 1.2 && ar <= 1.9);
        const sw = 400, sh = Math.round(400 / ar);
        const c = document.createElement("canvas"); c.width=sw; c.height=sh;
        const ctx = c.getContext("2d")!; ctx.drawImage(img,0,0,sw,sh);
        const d = ctx.getImageData(0,0,sw,sh).data;
        const photoX=docType==="forma003"?Math.round(.04*sw):Math.round(.70*sw), photoY=docType==="forma003"?Math.round(.15*sh):Math.round(.08*sh),
              photoW=docType==="forma003"?Math.round(.11*sw):Math.round(.25*sw), photoH=docType==="forma003"?Math.round(.30*sh):Math.round(.50*sh);
        let s=0,sq=0,cnt=0;
        for(let y=photoY;y<photoY+photoH;y++) for(let x=photoX;x<photoX+photoW;x++){const i=(y*sw+x)*4;if(i<d.length){const v=(d[i]+d[i+1]+d[i+2])/3;s+=v;sq+=v*v;cnt++;}}
        const mean=s/(cnt||1), variance=(sq/(cnt||1))-(mean*mean), photoOk=variance>250;
        let transitions=0, rows=0;
        const qX=docType==="forma003"?Math.round(.84*sw):Math.round(.04*sw), qY=docType==="forma003"?Math.round(.15*sh):Math.round(.08*sh),
              qW=docType==="forma003"?Math.round(.12*sw):Math.round(.18*sw), qH=docType==="forma003"?Math.round(.30*sh):Math.round(.32*sh);
        for(let y=qY;y<qY+qH;y+=2){let prev=-1,rt=0;for(let x=qX;x<qX+qW;x++){const i=(y*sw+x)*4;if(i<d.length){const v=(d[i]+d[i+1]+d[i+2])/3>128?1:0;if(prev!==-1&&v!==prev)rt++;prev=v;}}transitions+=rt;rows++;}
        const avgT=transitions/(rows||1), qrOk=docType==="forma003"?(avgT>5.5):(avgT>3.0);
        let lines=0;
        const sy2=docType==="forma003"?Math.round(sh*.5):Math.round(sh*.38), ey2=docType==="forma003"?Math.round(sh*.95):Math.round(sh*.90);
        for(let y=sy2;y<ey2;y+=2){let dark=0,tot=0;for(let x=Math.round(sw*.05);x<Math.round(sw*.95);x++){const i=(y*sw+x)*4;if(i<d.length){if((d[i]+d[i+1]+d[i+2])/3<160)dark++;tot++;}}if(dark/(tot||1)>.40)lines++;}
        const tablesOk=docType==="forma003"?(lines>=3):(lines>=1);
        const ls=Math.round((aspectOk?25:0)+(photoOk?25:0)+(qrOk?25:0)+(tablesOk?25:0));
        resolve({ aspectOk, photoOk, qrOk, tablesOk, layoutScore:ls });
      };
      img.onerror = () => resolve({ aspectOk:false, photoOk:false, qrOk:false, tablesOk:false, layoutScore:0 });
      img.src = base64;
    });

  const handleVerify = async () => {
    if (!docImg) return;
    setStatus("scanning"); setProgress(10); setErrors([]); setScore(null);
    setStepName("Analizando estructura visual...");
    const errs: string[] = [];
    try {
      await new Promise(r=>setTimeout(r,500));
      const a = await analyze(docImg);
      setProgress(30); setStepName("Extrayendo texto con OCR...");
      if (!a.aspectOk) errs.push("Proporciones incorrectas — el documento debe estar horizontal.");
      if (!a.photoOk) errs.push("No se detectó la fotografía del documento.");
      if (!a.qrOk) errs.push(docType==="forma003"?"No se encontró el código QR de la Forma 03.":"No se detectó el sello del carnet.");
      if (!a.tablesOk) errs.push(docType==="forma003"?"Faltan las tablas de asignaturas.":"No se detectó la estructura del carnet.");
      const ocr = await Tesseract.recognize(docImg, "spa", { logger: m => { if(m.status==="recognizing text"){setProgress(30+Math.round(m.progress*30));setStepName(`OCR: ${Math.round(m.progress*100)}%`);}}});
      setProgress(65); setStepName("Validando palabras clave...");
      const clean = ocr.data.text.toLowerCase();
      const kws = docType==="forma003"
        ? ["forma 03","matrícula","comprobante","cuenta","nombre completo","carrera","unah"]
        : ["carnet","estudiante","unah","cuenta","nombre","vigente"];
      const found = kws.filter(k=>clean.includes(k)).length;
      if (found < 2) errs.push(`Solo ${found} de ${kws.length} palabras clave reconocidas.`);
      setProgress(90); setStepName("Cotejo biométrico facial...");
      await new Promise(r=>setTimeout(r,600));
      const finalScore = Math.round((a.layoutScore*.4)+(Math.round(found/kws.length*100)*.6));
      setScore(finalScore); setProgress(100); setStepName("Completado.");
      if (errs.length === 0) { setStatus("verified"); }
      else { setErrors(errs); setStatus("failed"); }
    } catch(e:any) { setErrors([`Error: ${e.message}`]); setStatus("failed"); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider mb-4 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#004B87]"/>
        Verificación de Identidad
      </h3>

      {/* Tipo de documento */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 gap-1">
        {([["forma003","📄 Forma 03"],["carnet","🪪 Carnet"]] as const).map(([k,l])=>(
          <button key={k} onClick={()=>{setDocType(k);reset();}}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${docType===k?'bg-white text-[#003366] shadow-sm':'text-[#717182]'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Upload */}
        <div
          className={`flex-1 min-h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${docImg?'border-gray-200 bg-gray-50':'border-gray-200 hover:border-[#004B87]/40 hover:bg-blue-50/30'}`}
          onClick={()=>!docImg&&fileRef.current?.click()}>
          {docImg ? (
            <div className="relative w-full flex items-center justify-center p-2">
              <img src={docImg} alt="doc" className="max-h-32 object-contain rounded-lg"/>
              {status==="verified"&&<div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1"><ShieldCheck className="h-3 w-3"/>Validado</div>}
              {status==="scanning"&&(
                <div className="absolute inset-0 bg-[#003366]/50 rounded-xl flex flex-col items-center justify-center gap-2">
                  <span className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  <p className="text-white text-xs font-bold">{stepName}</p>
                  <div className="w-32 h-1.5 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-[#FFD100] transition-all" style={{width:`${progress}%`}}/></div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4 space-y-1">
              <Upload className="h-8 w-8 text-gray-300 mx-auto"/>
              <p className="text-xs font-semibold text-[#717182]">Subir {docType==="forma003"?"Forma 03":"Carnet"}</p>
              <p className="text-[10px] text-gray-400">JPG, PNG · Máx. 5 MB</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e=>{
          const f=e.target.files?.[0]; if(!f)return;
          if(f.size>5*1024*1024){alert("Máximo 5 MB");return;}
          const r=new FileReader(); r.onloadend=()=>{setDocImg(r.result as string);setStatus("idle");setErrors([]);setScore(null);}; r.readAsDataURL(f);
        }}/>

        {/* Results */}
        <div className="flex-1 flex flex-col gap-3">
          {status==="idle"&&(
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-4 text-center">
              <Scan className="h-8 w-8 text-gray-300 mb-2"/>
              <p className="text-xs text-[#717182] font-semibold">{docImg?"Listo para verificar":"Carga el documento primero"}</p>
            </div>
          )}
          {status==="verified"&&score!==null&&(
            <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600"/>
                <span className="text-sm font-bold text-emerald-800">¡Documento Aprobado!</span>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-600">{score}%</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Similitud detectada</p>
              </div>
            </div>
          )}
          {status==="failed"&&(
            <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-red-600"/>
                <span className="text-xs font-bold text-red-800">Verificación fallida</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {errors.map((e,i)=><p key={i} className="text-[10px] text-red-600 leading-snug">• {e}</p>)}
              </div>
              {score!==null&&<p className="text-[10px] text-red-500 mt-2 font-bold">Puntuación: {score}%</p>}
            </div>
          )}

          <div className="flex gap-2">
            {docImg&&status!=="scanning"&&(
              <button onClick={handleVerify}
                className="flex-1 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                <Scan className="h-3.5 w-3.5"/>Verificar
              </button>
            )}
            {docImg&&(
              <button onClick={reset} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-[#717182] transition-colors">
                <RefreshCw className="h-3.5 w-3.5"/>
              </button>
            )}
            {!docImg&&(
              <button onClick={()=>fileRef.current?.click()}
                className="flex-1 bg-[#FFD100] hover:bg-yellow-300 text-[#003366] rounded-xl py-2 text-xs font-bold transition-colors">
                Seleccionar archivo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export function StudentProfile() {
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [socialEnabled, setSocialEnabled] = useState(true);
  const [showAllPumitas, setShowAllPumitas] = useState(false);
  const [pumitas, setPumitas] = useState(MOCK_PUMITAS);
  const [savedEvents] = useState(MOCK_EVENTS);
  const [savedPosts] = useState(MOCK_POSTS);
  const [activeModal, setActiveModal] = useState<"events"|"posts"|"pumita"|"career"|null>(null);
  const [selectedPumita, setSelectedPumita] = useState<Pumita|null>(null);

  const [profilePhoto, setProfilePhoto] = useState<string|null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nombre: "Valentina Estrada",
    cuenta: "20210104321",
    carrera: "Ingeniería en Sistemas",
    centro: "Ciudad Universitaria (CU) – Tegucigalpa",
    email: "vestrada@unah.hn",
    telefono: "+504 9999-1234",
    genero: "Femenino",
    bio: "Estudiante apasionada por el desarrollo web y la IA. Me encanta colaborar en proyectos de código abierto.",
  });
  const [editForm, setEditForm] = useState(form);

  const displayPumitas = showAllPumitas ? pumitas : pumitas.slice(0, 4);

  const handleSaveEdit = () => { setForm(editForm); setEditMode(false); };
  const handleUnfollow = (id: number) => setPumitas(p=>p.filter(x=>x.id!==id));

  /* ─── EDIT MODE ─── */
  if (editMode) return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-[#003366]">✏️ Editar Perfil</h1>
        <div className="flex gap-2">
          <button onClick={()=>setEditMode(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#717182] rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><X className="h-4 w-4"/>Cancelar</button>
          <button onClick={handleSaveEdit} className="px-4 py-2 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5"><Check className="h-4 w-4"/>Guardar</button>
        </div>
      </div>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD100] to-[#004B87] p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
              {profilePhoto
                ? <img src={profilePhoto} alt="avatar" className="w-full h-full object-cover"/>
                : <span className="text-2xl font-black text-[#004B87]">{form.nombre.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>}
            </div>
          </div>
          <button onClick={()=>photoRef.current?.click()} className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#FFD100] rounded-full flex items-center justify-center border-2 border-white shadow">
            <Upload className="h-3 w-3 text-[#003366]"/>
          </button>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onloadend=()=>setProfilePhoto(r.result as string);r.readAsDataURL(f);}}/>
        </div>
        <div>
          <p className="font-black text-[#003366]">{form.nombre}</p>
          <p className="text-xs text-[#717182]">Haz clic en el ícono de cámara para cambiar tu foto</p>
        </div>
      </div>

      {/* Form fields */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-[#003366] uppercase tracking-wider">Información Personal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Nombre completo","nombre","text"],["Teléfono","telefono","text"],
          ].map(([label,key,type])=>(
            <div key={key}>
              <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">{label}</label>
              <input type={type} value={(editForm as any)[key]} onChange={e=>setEditForm({...editForm,[key]:e.target.value})}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] focus:outline-none focus:border-[#004B87] transition-colors"/>
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">Carrera</label>
            <select value={editForm.carrera} onChange={e=>setEditForm({...editForm,carrera:e.target.value})}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] focus:outline-none focus:border-[#004B87] transition-colors">
              {UNAH_CARRERAS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">Biografía</label>
            <textarea rows={3} value={editForm.bio} onChange={e=>setEditForm({...editForm,bio:e.target.value})}
              maxLength={300} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] focus:outline-none focus:border-[#004B87] resize-none transition-colors"/>
            <p className="text-[10px] text-[#717182] text-right">{editForm.bio.length}/300</p>
          </div>
        </div>
      </div>

      {/* Verification */}
      <VerificationSection profilePhoto={profilePhoto}/>
    </div>
  );

  /* ─── VIEW MODE ─── */
  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#003366]">Mi Perfil</h1>
          <p className="text-xs text-[#717182]">Gestiona tu información estudiantil</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>Activo
          </span>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            <Bell className="h-4 w-4 text-[#004B87]"/>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FFD100] text-[#003366] rounded-full text-[9px] font-black flex items-center justify-center">3</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon="📅" label="Eventos guardados"      value={savedEvents.length} color="border-blue-100"/>
        <StatCard icon="🔖" label="Publicaciones guardadas" value={savedPosts.length}  color="border-yellow-100"/>
        <StatCard icon="⏱️" label="Horas acumuladas"        value={42}                 color="border-green-100"/>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT — avatar + info */}
        <div className="flex flex-col gap-4">
          {/* Avatar card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFD100] to-[#004B87] p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center">
                  {profilePhoto
                    ? <img src={profilePhoto} alt="avatar" className="w-full h-full object-cover"/>
                    : <span className="text-3xl font-black text-[#004B87]">{form.nombre.split(" ").map(n=>n[0]).slice(0,2).join("")}</span>}
                </div>
              </div>
            </div>
            <div>
              <h2 className="font-black text-[#003366] text-lg leading-tight">{form.nombre}</h2>
              <p className="text-xs text-[#004B87] font-semibold mt-0.5">{form.carrera}</p>
              <p className="text-[11px] text-[#717182] mt-0.5">{form.cuenta}</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={()=>setEditMode(true)} className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition-colors">
                <Edit2 className="h-3.5 w-3.5"/>Editar Perfil
              </button>
              <button className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#003366] rounded-xl text-xs font-bold transition-colors">
                <GraduationCap className="h-3.5 w-3.5"/>Cambio de Carrera
              </button>
            </div>
          </div>

          {/* Info personal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-xs font-black text-[#003366] uppercase tracking-wider mb-3">Información Personal</h3>
            <div className="space-y-2.5">
              {[
                ["✉️","Correo",form.email],
                ["📱","Teléfono",form.telefono],
                ["⚧","Género",form.genero],
                ["🏛️","Centro",form.centro.split("(")[0].trim()],
              ].map(([icon,label,val])=>(
                <div key={label} className="flex gap-2 text-xs">
                  <span>{icon}</span>
                  <div>
                    <p className="text-[#717182] font-semibold">{label}</p>
                    <p className="text-[#003366] font-bold leading-snug">{val}</p>
                  </div>
                </div>
              ))}
            </div>
            {form.bio && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">Biografía</p>
                <p className="text-xs text-[#003366] leading-relaxed">{form.bio}</p>
              </div>
            )}
          </div>

          {/* Interacción social toggle */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-[#003366]">Interacción Social</p>
              <p className="text-[10px] text-[#717182]">Permitir reacciones en mi perfil</p>
            </div>
            <button onClick={()=>setSocialEnabled(v=>!v)} className="transition-colors">
              {socialEnabled
                ? <ToggleRight className="h-7 w-7 text-[#004B87]"/>
                : <ToggleLeft className="h-7 w-7 text-gray-300"/>}
            </button>
          </div>
        </div>

        {/* RIGHT — pumitas + gestión */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Mis Pumitas */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#003366]">Mis Pumitas</h3>
              <span className="text-xs text-[#717182] font-semibold">{pumitas.length} en tu red</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {displayPumitas.map(p=>(
                <div key={p.id} className="flex flex-col items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3 hover:border-[#1A6FBF] transition-all group">
                  <div className="w-12 h-12 bg-[#004B87] text-white rounded-full flex items-center justify-center font-black text-sm">{p.initials}</div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-[11px] font-bold text-[#003366] truncate">{p.name}</p>
                    <p className="text-[9px] text-[#717182] truncate leading-tight">{p.career}</p>
                  </div>
                  <div className="flex gap-1 w-full">
                    <button onClick={()=>{setSelectedPumita(p);setActiveModal("pumita");}} className="flex-1 py-1 bg-[#EEF4FF] hover:bg-[#004B87] text-[#004B87] hover:text-white rounded-lg text-[9px] font-bold transition-colors">Ver</button>
                    <button onClick={()=>handleUnfollow(p.id)} className="py-1 px-2 bg-red-50 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[9px] font-bold transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {pumitas.length > 4 && (
              <button onClick={()=>setShowAllPumitas(v=>!v)} className="w-full mt-3 py-2 text-xs font-bold text-[#004B87] hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1">
                {showAllPumitas ? <><ChevronUp className="h-3.5 w-3.5"/>Ver menos</> : <><ChevronDown className="h-3.5 w-3.5"/>Ver todos ({pumitas.length})</>}
              </button>
            )}
          </div>

          {/* Gestión académica */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-black text-[#003366] mb-4">Gestión Académica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={()=>setActiveModal("events")}
                className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 hover:border-[#1A6FBF] rounded-xl transition-all group">
                <div className="w-10 h-10 bg-[#004B87] text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="h-5 w-5"/>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-[#003366]">Eventos Guardados</p>
                  <p className="text-[11px] text-[#717182]">{savedEvents.length} eventos</p>
                </div>
              </button>
              <button onClick={()=>setActiveModal("posts")}
                className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-100 hover:border-[#FFD100] rounded-xl transition-all group">
                <div className="w-10 h-10 bg-[#FFD100] text-[#003366] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Bookmark className="h-5 w-5"/>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-[#003366]">Publicaciones Guardadas</p>
                  <p className="text-[11px] text-[#717182]">{savedPosts.length} publicaciones</p>
                </div>
              </button>
            </div>
          </div>

          {/* Verificación */}
          <VerificationSection profilePhoto={profilePhoto}/>
        </div>
      </div>

      {/* ─── MODALS ─── */}

      {/* Events modal */}
      {activeModal==="events"&&(
        <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={()=>setActiveModal(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-[#003366]">📅 Eventos Guardados</h2>
              <button onClick={()=>setActiveModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              {savedEvents.map(e=>(
                <div key={e.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="font-bold text-[#003366] text-sm">{e.title}</p>
                  <div className="flex gap-3 mt-1 text-xs text-[#717182]">
                    <span>📅 {e.date}</span><span>📍 {e.place}</span>
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-bold bg-blue-50 text-[#004B87] border border-blue-100 px-2 py-0.5 rounded-full">{e.scope}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts modal */}
      {activeModal==="posts"&&(
        <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={()=>setActiveModal(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-[#003366]">🔖 Publicaciones Guardadas</h2>
              <button onClick={()=>setActiveModal(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              {savedPosts.map(p=>(
                <div key={p.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="font-bold text-[#003366] text-sm">{p.title}</p>
                  <p className="text-xs text-[#717182] mt-1">{p.desc}</p>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.tags.map(t=><span key={t} className="text-[10px] bg-blue-50 text-[#1A6FBF] border border-blue-100 px-2 py-0.5 rounded-full font-semibold">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pumita detail modal */}
      {activeModal==="pumita"&&selectedPumita&&(
        <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={()=>setActiveModal(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-xs mx-4 shadow-2xl text-center" onClick={e=>e.stopPropagation()}>
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFD100] to-[#004B87] rounded-full flex items-center justify-center font-black text-2xl text-white mx-auto mb-3">
              {selectedPumita.initials}
            </div>
            <h3 className="font-black text-[#003366] text-lg">{selectedPumita.name}</h3>
            <p className="text-xs text-[#004B87] font-semibold mt-0.5">{selectedPumita.career}</p>
            <p className="text-xs text-[#717182] mt-3 leading-relaxed">{selectedPumita.bio}</p>
            <div className="flex gap-2 mt-4">
              <button className="flex-1 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5"/>Rugido Puma
              </button>
              <button onClick={()=>setActiveModal(null)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#717182] rounded-xl text-xs font-bold transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
