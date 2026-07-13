import { useState } from "react";
import { MapPin, TrendingUp, Users, CalendarCheck } from "lucide-react";

interface Centro {
  id: string; nombre: string; ciudad: string; eventos: number;
  estudiantes: number; horas: number; pct: number;
}

const CENTROS: Centro[] = [
  { id:"cu",  nombre:"Ciudad Universitaria",  ciudad:"Tegucigalpa", eventos:38, estudiantes:4820, horas:11640, pct:92 },
  { id:"cu2", nombre:"CURLA",                 ciudad:"La Ceiba",    eventos:22, estudiantes:2100, horas:5040,  pct:78 },
  { id:"cu3", nombre:"CURC",                  ciudad:"Choluteca",   eventos:14, estudiantes:980,  horas:2352,  pct:65 },
  { id:"cu4", nombre:"CURH",                  ciudad:"Siguatepeque", eventos:11, estudiantes:740,  horas:1776,  pct:61 },
  { id:"cu5", nombre:"CURN",                  ciudad:"San Pedro Sula", eventos:27, estudiantes:3100, horas:7440, pct:84 },
  { id:"cu6", nombre:"CURO",                  ciudad:"Danlí",        eventos:9,  estudiantes:510,  horas:1224,  pct:55 },
];

const METRICS = [
  { key:"eventos",     label:"Eventos totales",     icon:CalendarCheck, color:"bg-[#004B87]" },
  { key:"estudiantes", label:"Estudiantes activos",  icon:Users,         color:"bg-[#1A6FBF]" },
  { key:"horas",       label:"Horas acreditadas",    icon:TrendingUp,    color:"bg-emerald-500" },
];

export function CentrosRegionales() {
  const [sort, setSort] = useState<keyof Centro>("pct");
  const sorted = [...CENTROS].sort((a,b)=> (b[sort] as number)-(a[sort] as number));
  const totals = { eventos: CENTROS.reduce((s,c)=>s+c.eventos,0), estudiantes: CENTROS.reduce((s,c)=>s+c.estudiantes,0), horas: CENTROS.reduce((s,c)=>s+c.horas,0) };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-[#003366] flex items-center gap-2">
          <MapPin className="h-6 w-6 text-[#004B87]"/>Centros Regionales
        </h1>
        <p className="text-sm text-[#717182]">Comparativa de participación VOAE por centro universitario</p>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-3 gap-4">
        {METRICS.map(m=>{
          const val = totals[m.key as keyof typeof totals];
          return (
            <div key={m.key} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                <m.icon className="h-5 w-5 text-white"/>
              </div>
              <div>
                <p className="text-xl font-black text-[#003366]">{val.toLocaleString()}</p>
                <p className="text-[10px] text-[#717182] font-semibold">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sort control */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-[#717182] font-semibold">Ordenar por:</span>
        {[{k:"pct",l:"Participación"},{k:"eventos",l:"Eventos"},{k:"estudiantes",l:"Estudiantes"},{k:"horas",l:"Horas"}].map(s=>(
          <button key={s.k} onClick={()=>setSort(s.k as keyof Centro)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${sort===s.k?"bg-[#004B87] text-white":"bg-gray-100 text-[#717182] hover:bg-gray-200"}`}>
            {s.l}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((c,i)=>(
          <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {i===0 && <span className="text-[10px] bg-[#FFD100] text-[#003366] font-black px-1.5 py-0.5 rounded">TOP</span>}
                  <h3 className="text-sm font-black text-[#003366]">{c.nombre}</h3>
                </div>
                <p className="text-xs text-[#717182] flex items-center gap-1"><MapPin className="h-3 w-3"/>{c.ciudad}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#004B87]">{c.pct}%</p>
                <p className="text-[10px] text-[#717182]">participación</p>
              </div>
            </div>

            {/* Bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-[#004B87] to-[#1A6FBF] transition-all duration-700"
                style={{ width:`${c.pct}%` }}/>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label:"Eventos",     val:c.eventos     },
                { label:"Estudiantes", val:c.estudiantes.toLocaleString() },
                { label:"Horas",       val:c.horas.toLocaleString() },
              ].map(s=>(
                <div key={s.label} className="bg-gray-50 border border-gray-100 rounded-xl py-2">
                  <p className="text-sm font-black text-[#003366]">{s.val}</p>
                  <p className="text-[9px] text-[#717182] font-semibold uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Table summary */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-black text-[#003366]">Resumen comparativo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Centro","Ciudad","Eventos","Estudiantes","Horas","Participación"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-[#717182] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c,i)=>(
                <tr key={c.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
                  <td className="px-4 py-3 font-semibold text-[#003366]">{c.nombre}</td>
                  <td className="px-4 py-3 text-xs text-[#717182]">{c.ciudad}</td>
                  <td className="px-4 py-3 font-bold text-[#004B87]">{c.eventos}</td>
                  <td className="px-4 py-3 text-xs text-[#717182]">{c.estudiantes.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-[#717182]">{c.horas.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#004B87] rounded-full" style={{width:`${c.pct}%`}}/>
                      </div>
                      <span className="text-xs font-black text-[#003366] w-9 text-right">{c.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
