import { useState, useEffect } from "react";
import { Clock, Users, CheckCircle2, RefreshCw, StopCircle, QrCode } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const MOCK_STUDENTS = [
  { id: "2021001", name: "Miguel Torres", time: "16:14" },
  { id: "2021002", name: "Valeria Rojas", time: "16:17" },
  { id: "2021003", name: "Carlos Mendoza", time: "16:20" },
  { id: "2021004", name: "Laura Paz", time: "16:23" },
  { id: "2021005", name: "Ángela Reyes", time: "16:25" },
  { id: "2021006", name: "José Martínez", time: "16:28" },
  { id: "2021007", name: "Diana Fuentes", time: "16:30" },
  { id: "2021008", name: "Roberto Sosa", time: "16:33" },
  { id: "2021009", name: "Karla Núñez", time: "—" },
  { id: "2021010", name: "Fernando López", time: "—" },
  { id: "2021011", name: "Patricia Mejía", time: "—" },
  { id: "2021012", name: "Andrés Castillo", time: "—" },
];

function FakeQR({ seed }: { seed: number }) {
  const cells = Array.from({ length: 25 * 25 }, (_, i) => ((i * 7919 + seed) % 7) < 3);
  return (
    <div className="w-full h-full grid" style={{ gridTemplateColumns: "repeat(25,1fr)", gap: 2 }}>
      {cells.map((b, i) => (
        <div key={i} className={`rounded-[1px] ${b ? "bg-[#003366]" : "bg-transparent"}`} />
      ))}
    </div>
  );
}

export function LiveEvent() {
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(30);
  const [qrSeed, setQrSeed] = useState(31);
  const [attended, setAttended] = useState(8);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s <= 1 ? 30 : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setAttended((a) => Math.min(a + 1, MOCK_STUDENTS.length));
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const regenerate = () => {
    setQrSeed((s) => s + 100);
    setSeconds(30);
    toast.success("Código QR regenerado");
  };

  const handleEndEvent = () => {
    toast.success("Evento finalizado correctamente");
    navigate("/tutor/eventos");
  };

  const pct = Math.round((attended / MOCK_STUDENTS.length) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#003366]">Festival Cultural UNAH 2026</h1>
          <p className="text-sm text-[#717182]">Sesión en vivo · Plaza Central · 16:00 – 20:00</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />EN VIVO
          </span>
          <Button variant="destructive" onClick={handleEndEvent} className="gap-1.5">
            <StopCircle className="h-4 w-4" /> Finalizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#004B87]">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#003366]">{MOCK_STUDENTS.length}</p>
            <p className="text-xs font-semibold text-[#717182]">Inscritos</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-500">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#003366]">{attended}</p>
            <p className="text-xs font-semibold text-[#717182]">Asistencia</p>
            <p className="text-[10px] text-[#1A6FBF]">{pct}% del total</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-yellow-500">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-[#003366]">1h 23m</p>
            <p className="text-xs font-semibold text-[#717182]">Tiempo activo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <p className="font-bold text-[#003366] flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4 text-[#004B87]" />Código QR dinámico
              </p>
              <p className="text-[10px] text-[#717182]">Se renueva automáticamente cada 30 segundos</p>
            </div>
            <Button onClick={regenerate} size="sm" variant="outline" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />Regenerar
            </Button>
          </div>
          <div className="p-6">
            <div className="aspect-square w-full max-w-[320px] mx-auto bg-white border-2 border-dashed border-[#004B87]/20 rounded-xl p-5 grid place-items-center">
              <FakeQR seed={qrSeed} />
            </div>
            <div className="mt-5 text-center">
              <p className="text-[10px] text-[#717182] mb-1">Expira en</p>
              <p className="text-3xl font-black text-[#004B87] tabular-nums">
                00:{String(seconds).padStart(2, "0")}
              </p>
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${(seconds / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-[#003366] text-sm">Asistencia en tiempo real</p>
              <p className="text-[10px] text-[#717182]">{attended} de {MOCK_STUDENTS.length} estudiantes presentes</p>
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100 flex-1">
            {MOCK_STUDENTS.map((s, i) => {
              const present = i < attended;
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 bg-[#004B87] text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#003366] truncate">{s.name}</p>
                    <p className="text-[10px] text-[#717182] font-mono">{s.id}</p>
                  </div>
                  {present ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />{s.time}
                    </span>
                  ) : (
                    <span className="text-xs text-[#717182]">Pendiente</span>
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
