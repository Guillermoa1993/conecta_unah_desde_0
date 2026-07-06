import { useRef, useState, useEffect } from "react";
import { CheckCircle2, XCircle, Download, PenLine, RotateCcw, Stamp } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string; nombre: string; cuenta: string;
  status: "aprobado" | "rechazado" | "pendiente"; horas: number;
}

const MOCK_EVENT = {
  id: "e-live-1",
  titulo: "Festival Cultural UNAH 2026",
  tutor: "Dr. Carlos Paz",
  fecha: "2026-06-25",
  lugar: "Plaza Central CU",
  horas: 2,
  categoria: "Cultural",
};

const MOCK_STUDENTS: Student[] = [
  { id:"s1", nombre:"Miguel Torres",   cuenta:"2021001", status:"pendiente", horas:2 },
  { id:"s2", nombre:"Valeria Rojas",   cuenta:"2021002", status:"pendiente", horas:2 },
  { id:"s3", nombre:"Carlos Mendoza",  cuenta:"2021003", status:"pendiente", horas:2 },
  { id:"s4", nombre:"Laura Paz",       cuenta:"2021004", status:"pendiente", horas:2 },
  { id:"s5", nombre:"Ángela Reyes",    cuenta:"2021005", status:"pendiente", horas:2 },
  { id:"s6", nombre:"José Martínez",   cuenta:"2021006", status:"pendiente", horas:2 },
];

function DigitalCanvas({ onSigned }: { onSigned: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#003366"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";

    const getXY = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) { return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }; }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const {x,y} = getXY(e); ctx.beginPath(); ctx.moveTo(x,y); };
    const move  = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const {x,y} = getXY(e); ctx.lineTo(x,y); ctx.stroke(); setHasStrokes(true); };
    const stop  = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move); canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("touchstart", start, { passive:false }); canvas.addEventListener("touchmove", move, { passive:false }); canvas.addEventListener("touchend", stop);
    return () => {
      canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", move); canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", stop);
    };
  }, []);

  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0,0,c.width,c.height); setHasStrokes(false); };
  const confirm = () => { if (!hasStrokes) { toast.error("Firma antes de confirmar"); return; } onSigned(ref.current!.toDataURL()); };

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-[#004B87]/30 rounded-xl overflow-hidden bg-white">
        <canvas ref={ref} width={480} height={120} className="w-full touch-none cursor-crosshair"/>
      </div>
      <div className="flex gap-2">
        <button onClick={clear} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-[#717182] hover:bg-gray-50 transition-colors">
          <RotateCcw className="h-3.5 w-3.5"/>Limpiar
        </button>
        <button onClick={confirm} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition-colors">
          <PenLine className="h-3.5 w-3.5"/>Confirmar firma
        </button>
      </div>
    </div>
  );
}

function SealAnimation({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full animate-[spin_3s_linear_infinite]">
          <circle cx="60" cy="60" r="55" fill="none" stroke="#FFD100" strokeWidth="2" strokeDasharray="8 4"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#004B87] border-4 border-[#FFD100] flex flex-col items-center justify-center shadow-xl">
            <Stamp className="h-6 w-6 text-[#FFD100] mb-0.5"/>
            <p className="text-[8px] font-black text-white tracking-widest">VOAE</p>
            <p className="text-[6px] text-white/70 tracking-widest">UNAH</p>
          </div>
        </div>
      </div>
      <p className="text-sm font-black text-[#003366] mt-4">¡Constancias firmadas!</p>
      <p className="text-xs text-[#717182]">Listas para descargar</p>
    </div>
  );
}

export function ValidacionEvento() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [signatureUrl, setSignatureUrl] = useState<string|null>(null);
  const [sealed, setSealed] = useState(false);
  const [showSigning, setShowSigning] = useState(false);

  const toggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => s.id !== id ? s : {
      ...s,
      status: s.status === "pendiente" ? "aprobado" : s.status === "aprobado" ? "rechazado" : "pendiente"
    }));
  };

  const approvedCount = students.filter(s=>s.status==="aprobado").length;
  const rejectedCount = students.filter(s=>s.status==="rechazado").length;
  const pendingCount  = students.filter(s=>s.status==="pendiente").length;

  const handleSign = (dataUrl: string) => {
    setSignatureUrl(dataUrl);
    setShowSigning(false);
    toast.success("Firma guardada — ya puedes emitir las constancias");
  };

  const emitirConstancias = () => {
    if (!signatureUrl) { toast.error("Primero debes firmar digitalmente"); return; }
    if (approvedCount === 0) { toast.error("Aprueba al menos un estudiante"); return; }
    if (pendingCount > 0) { toast.error(`Quedan ${pendingCount} estudiantes sin revisar`); return; }
    setSealed(true);
    toast.success(`${approvedCount} constancias emitidas y firmadas`);
  };

  const downloadMock = (nombre: string) => {
    toast.success(`Descargando constancia de ${nombre}...`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-[#003366]">Validación de Evento</h1>
        <p className="text-sm text-[#717182]">Aprueba o rechaza asistencias y emite constancias con firma digital</p>
      </div>

      {/* Info del evento */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-[#004B87] text-[#FFD100] rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
            {MOCK_EVENT.categoria[0]}
          </div>
          <div>
            <h2 className="font-black text-[#003366]">{MOCK_EVENT.titulo}</h2>
            <p className="text-xs text-[#717182]">{MOCK_EVENT.tutor} · {MOCK_EVENT.fecha} · {MOCK_EVENT.lugar}</p>
          </div>
          <span className="ml-auto text-xs bg-[#FFD100]/20 border border-[#FFD100]/40 text-[#003366] font-bold px-2.5 py-1 rounded-lg">
            {MOCK_EVENT.horas}h VOAE
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{ label:"Pendientes", val:pendingCount, c:"text-amber-600" },{ label:"Aprobados", val:approvedCount, c:"text-emerald-600" },{ label:"Rechazados", val:rejectedCount, c:"text-red-500" }].map(s=>(
            <div key={s.label} className="text-center bg-gray-50 border border-gray-100 rounded-xl py-2">
              <p className={`text-xl font-black ${s.c}`}>{s.val}</p>
              <p className="text-[10px] text-[#717182] font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de estudiantes */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-[#003366]">Lista de asistencia ({students.length} estudiantes)</h3>
          <div className="flex gap-1.5">
            <button onClick={()=>setStudents(p=>p.map(s=>({...s,status:"aprobado"})))}
              className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors">
              Aprobar todos
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {students.map(s=>(
            <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                {s.nombre.split(" ").map(p=>p[0]).slice(0,2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#003366] truncate">{s.nombre}</p>
                <p className="text-[10px] text-[#717182]">{s.cuenta}</p>
              </div>
              <div className="flex items-center gap-2">
                {sealed && s.status==="aprobado" && (
                  <button onClick={()=>downloadMock(s.nombre)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg text-[10px] font-bold hover:bg-purple-100 transition-colors">
                    <Download className="h-3 w-3"/>Constancia
                  </button>
                )}
                <button onClick={()=>!sealed && toggleStatus(s.id)}
                  disabled={sealed}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${sealed?"cursor-default":""} ${
                    s.status==="aprobado" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : s.status==="rechazado" ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  }`}>
                  {s.status==="aprobado" && <CheckCircle2 className="h-3.5 w-3.5"/>}
                  {s.status==="rechazado" && <XCircle className="h-3.5 w-3.5"/>}
                  {s.status==="aprobado" ? "Aprobado" : s.status==="rechazado" ? "Rechazado" : "Pendiente"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!sealed && (
        <>
          {/* Firma digital */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#003366] flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-[#004B87]"/>Firma digital del coordinador VOAE
                </h3>
                <p className="text-xs text-[#717182]">Requerida para emitir las constancias</p>
              </div>
              {signatureUrl && <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Firmado ✓</span>}
            </div>

            {signatureUrl ? (
              <div className="space-y-2">
                <div className="border border-dashed border-[#004B87]/20 rounded-xl p-3 bg-gray-50">
                  <img src={signatureUrl} alt="Firma" className="h-20 w-auto mx-auto opacity-80"/>
                </div>
                <button onClick={()=>{setSignatureUrl(null);setShowSigning(true);}}
                  className="text-xs text-[#717182] underline hover:text-[#003366] transition-colors">
                  Volver a firmar
                </button>
              </div>
            ) : showSigning ? (
              <DigitalCanvas onSigned={handleSign}/>
            ) : (
              <button onClick={()=>setShowSigning(true)}
                className="w-full py-8 border-2 border-dashed border-[#004B87]/30 rounded-xl hover:border-[#004B87] hover:bg-blue-50/30 transition-all group">
                <PenLine className="h-8 w-8 text-gray-300 group-hover:text-[#004B87] mx-auto mb-2 transition-colors"/>
                <p className="text-sm font-semibold text-[#717182] group-hover:text-[#003366]">Haz clic para firmar</p>
                <p className="text-xs text-gray-400">Traza tu firma con el mouse o dedo</p>
              </button>
            )}
          </div>

          {/* Emitir */}
          <button onClick={emitirConstancias}
            disabled={!signatureUrl || approvedCount===0}
            className="w-full py-3.5 bg-[#004B87] hover:bg-[#003366] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
            <Stamp className="h-5 w-5"/>
            Emitir {approvedCount} constancia{approvedCount!==1?"s":""} certificada{approvedCount!==1?"s":""}
          </button>
        </>
      )}

      <SealAnimation visible={sealed}/>

      {sealed && (
        <div className="flex justify-center">
          <button onClick={()=>toast.success("Descargando todas las constancias...")}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-colors">
            <Download className="h-5 w-5"/>Descargar todas las constancias
          </button>
        </div>
      )}
    </div>
  );
}
