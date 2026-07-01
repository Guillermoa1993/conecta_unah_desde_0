import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle2, RefreshCw, StopCircle, QrCode, Wifi } from "lucide-react";

const MOCK_STUDENTS = [
  { id:"2021001", name:"Miguel Torres",   time:"16:14" },
  { id:"2021002", name:"Valeria Rojas",   time:"16:17" },
  { id:"2021003", name:"Carlos Mendoza",  time:"16:20" },
  { id:"2021004", name:"Laura Paz",       time:"16:23" },
  { id:"2021005", name:"Ángela Reyes",    time:"16:25" },
  { id:"2021006", name:"José Martínez",   time:"16:28" },
  { id:"2021007", name:"Diana Fuentes",   time:"16:30" },
  { id:"2021008", name:"Roberto Sosa",    time:"16:33" },
  { id:"2021009", name:"Karla Núñez",     time:"—"     },
  { id:"2021010", name:"Fernando López",  time:"—"     },
  { id:"2021011", name:"Patricia Mejía",  time:"—"     },
  { id:"2021012", name:"Andrés Castillo", time:"—"     },
];

function FakeQR({ seed }: { seed: number }) {
  const cells = Array.from({ length: 25 * 25 }, (_, i) => ((i * 7919 + seed) % 7) < 3);
  return (
    <div className="w-full h-full grid gap-px" style={{ gridTemplateColumns: "repeat(25,1fr)" }}>
      {cells.map((b, i) => (
        <div key={i} className={`rounded-[1px] ${b ? "bg-[#003366]" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: React.ElementType; label: string; value: string|number; hint?: string; color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-6 w-6 text-white"/>
      </div>
      <div>
        <p className="text-2xl font-black text-[#003366]">{value}</p>
        <p className="text-xs font-semibold text-[#717182]">{label}</p>
        {hint && <p className="text-[10px] text-[#1A6FBF]">{hint}</p>}
      </div>
    </div>
  );
}

export function LiveEvent() {
  const [seconds, setSeconds] = useState(30);
  const [qrSeed, setQrSeed] = useState(31);
  const [attended, setAttended] = useState(8);

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s <= 1 ? 30 : s - 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setAttended(a => Math.min(a + 1, MOCK_STUDENTS.length));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const regenerate = () => { setQrSeed(s => s + 100); setSeconds(30); };

  const pct = Math.round((attended / MOCK_STUDENTS.length) * 100);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#003366]">Festival Cultural UNAH 2026</h1>
          <p className="text-sm text-[#717182]">Plaza Central · 16:00 – 20:00</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>EN VIVO
          </span>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
            <StopCircle className="h-4 w-4"/>Finalizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users}        label="Inscritos"     value={MOCK_STUDENTS.length} color="bg-[#004B87]"/>
        <StatCard icon={CheckCircle2} label="Asistencia"    value={attended} hint={`${pct}% del total`} color="bg-emerald-500"/>
        <StatCard icon={Clock}        label="Tiempo activo" value="1h 23m" color="bg-[#FFD100] !text-[#003366]"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* QR dinámico */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-[#003366] flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4 text-[#004B87]"/>Código QR dinámico
              </p>
              <p className="text-[10px] text-[#717182]">Se renueva automáticamente cada 30 s</p>
            </div>
            <button onClick={regenerate} className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-[#717182] hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-3.5 w-3.5"/>Regenerar
            </button>
          </div>
          <div className="p-5">
            <div className="aspect-square w-full max-w-[220px] mx-auto bg-white border-2 border-dashed border-[#004B87]/20 rounded-xl p-4">
              <FakeQR seed={qrSeed}/>
            </div>
            <div className="mt-4 text-center">
              <p className="text-[10px] text-[#717182] mb-1">Expira en</p>
              <p className="text-3xl font-black text-[#004B87] tabular-nums">
                00:{String(seconds).padStart(2,"0")}
              </p>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#FFD100] transition-all duration-1000 rounded-full"
                  style={{ width:`${(seconds/30)*100}%` }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de asistencia */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <p className="font-bold text-[#003366] text-sm">Asistencia en tiempo real</p>
              <p className="text-[10px] text-[#717182]">{attended} de {MOCK_STUDENTS.length} estudiantes presentes</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
              <Wifi className="h-3.5 w-3.5 animate-pulse"/>EN VIVO
            </span>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex justify-between text-[10px] text-[#717182] mb-1">
              <span>Progreso de asistencia</span><span>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#004B87] rounded-full transition-all duration-700"
                style={{ width:`${pct}%` }}/>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {MOCK_STUDENTS.map((s, i) => {
              const present = i < attended;
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                    {s.name.split(" ").map(p=>p[0]).slice(0,2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#003366] truncate">{s.name}</p>
                    <p className="text-[10px] text-[#717182]">{s.id}</p>
                  </div>
                  {present ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5"/>{s.time}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#717182]">Pendiente</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
