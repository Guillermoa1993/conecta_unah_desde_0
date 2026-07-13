import { useState } from "react";
import { FileText, Download, ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock } from "lucide-react";

type EventStatus = "Completado"|"Aprobado"|"Rechazado"|"Certificado";
interface EventRecord {
  id: string; titulo: string; tutor: string; fecha: string;
  acreditados: number; rechazados: number; horas: number; status: EventStatus;
  estudiantes: { nombre: string; cuenta: string; status:"aprobado"|"rechazado"|"pendiente"; horas: number }[];
}

const MOCK_RECORDS: EventRecord[] = [
  { id:"e1", titulo:"Noche de Talentos UNAH 2026", tutor:"Dr. Carlos Paz", fecha:"2026-05-15",
    acreditados:42, rechazados:3, horas:2, status:"Certificado",
    estudiantes:[
      { nombre:"Miguel Torres",   cuenta:"2021001", status:"aprobado",   horas:2 },
      { nombre:"Valeria Rojas",   cuenta:"2021002", status:"aprobado",   horas:2 },
      { nombre:"Carlos Mendoza",  cuenta:"2021003", status:"rechazado",  horas:0 },
      { nombre:"Laura Paz",       cuenta:"2021004", status:"aprobado",   horas:2 },
    ]},
  { id:"e2", titulo:"Torneo de Fútbol Sala Interclases", tutor:"Lic. Ana Reyes", fecha:"2026-04-20",
    acreditados:28, rechazados:0, horas:3, status:"Completado",
    estudiantes:[
      { nombre:"José Martínez",   cuenta:"2021006", status:"aprobado",   horas:3 },
      { nombre:"Diana Fuentes",   cuenta:"2021007", status:"aprobado",   horas:3 },
      { nombre:"Roberto Sosa",    cuenta:"2021008", status:"pendiente",  horas:0 },
    ]},
  { id:"e3", titulo:"Taller de Liderazgo Estudiantil", tutor:"Msc. Roberto Sosa", fecha:"2026-03-10",
    acreditados:0, rechazados:15, horas:4, status:"Rechazado",
    estudiantes:[
      { nombre:"Karla Núñez",     cuenta:"2021009", status:"rechazado",  horas:0 },
      { nombre:"Fernando López",  cuenta:"2021010", status:"rechazado",  horas:0 },
    ]},
];

const TABS: { key: EventStatus|"Todos"; label: string }[] = [
  { key:"Todos",      label:"Todos" },
  { key:"Certificado",label:"Certificados Firmados" },
  { key:"Completado", label:"Completados" },
  { key:"Aprobado",   label:"Aprobados" },
  { key:"Rechazado",  label:"Rechazados" },
];

const STATUS_STYLES: Record<EventStatus, string> = {
  Certificado: "bg-purple-50 border-purple-200 text-purple-700",
  Completado:  "bg-emerald-50 border-emerald-200 text-emerald-700",
  Aprobado:    "bg-blue-50 border-blue-200 text-[#004B87]",
  Rechazado:   "bg-red-50 border-red-200 text-red-700",
};

export function VOAERecords() {
  const [tab, setTab] = useState<EventStatus|"Todos">("Todos");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [detailEvent, setDetailEvent] = useState<EventRecord|null>(null);

  const filtered = tab === "Todos" ? MOCK_RECORDS : MOCK_RECORDS.filter(r=>r.status===tab);
  const totalHoras = MOCK_RECORDS.reduce((s,r)=>s+r.acreditados*r.horas,0);
  const totalEstudiantes = new Set(MOCK_RECORDS.flatMap(r=>r.estudiantes.map(e=>e.cuenta))).size;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-[#003366]">Registros Históricos</h1>
        <p className="text-sm text-[#717182]">Historial de eventos validados, certificados y rechazados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label:"Eventos validados",   value:MOCK_RECORDS.length, color:"border-blue-100" },
          { label:"Horas acreditadas",   value:totalHoras,          color:"border-yellow-100" },
          { label:"Estudiantes impactados", value:totalEstudiantes, color:"border-green-100" },
        ].map(s=>(
          <div key={s.label} className={`bg-white border rounded-2xl p-4 shadow-sm ${s.color}`}>
            <p className="text-2xl font-black text-[#003366]">{s.value}</p>
            <p className="text-xs text-[#717182] font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${tab===t.key?"bg-white text-[#003366] shadow-sm":"text-[#717182]"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Evento","Tutor","Fecha","Acreditados","Rechazados","Horas","Estado",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-[#717182] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>(
                <>
                  <tr key={r.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i%2===0?"bg-white":"bg-gray-50/50"}`}>
                    <td className="px-4 py-3 font-semibold text-[#003366]">{r.titulo}</td>
                    <td className="px-4 py-3 text-xs text-[#717182]">{r.tutor}</td>
                    <td className="px-4 py-3 text-xs text-[#717182]">{r.fecha}</td>
                    <td className="px-4 py-3"><span className="text-emerald-600 font-bold">{r.acreditados}</span></td>
                    <td className="px-4 py-3"><span className="text-red-500 font-bold">{r.rechazados}</span></td>
                    <td className="px-4 py-3 text-[#717182] text-xs">{r.horas}h</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={()=>setDetailEvent(r)}
                          className="px-2.5 py-1.5 border border-[#1A6FBF] text-[#1A6FBF] hover:bg-blue-50 rounded-lg text-[10px] font-bold transition-colors">
                          Ver detalle
                        </button>
                        <button onClick={()=>setExpanded(expanded===r.id?null:r.id)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          {expanded===r.id ? <ChevronUp className="h-3.5 w-3.5 text-[#717182]"/> : <ChevronDown className="h-3.5 w-3.5 text-[#717182]"/>}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded===r.id && (
                    <tr key={`${r.id}-exp`}>
                      <td colSpan={8} className="px-6 py-3 bg-blue-50/40 border-b border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {r.status==="Certificado" && r.estudiantes.filter(e=>e.status==="aprobado").map(e=>(
                            <div key={e.cuenta} className="flex items-center gap-2 bg-white border border-purple-200 rounded-lg px-3 py-1.5 text-xs">
                              <FileText className="h-3.5 w-3.5 text-purple-500"/>
                              <span className="font-semibold text-[#003366]">{e.nombre}</span>
                              <span className="text-[#717182]">— Constancia firmada</span>
                              <button className="ml-1 text-purple-500 hover:text-purple-700"><Download className="h-3 w-3"/></button>
                            </div>
                          ))}
                          {r.status!=="Certificado" && (
                            <p className="text-xs text-[#717182] italic">Sin constancias firmadas aún para este evento.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailEvent && (
        <div className="fixed inset-0 bg-[#003366]/40 z-[200] flex items-center justify-center backdrop-blur-sm" onClick={()=>setDetailEvent(null)}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-[#003366]">{detailEvent.titulo}</h2>
              <button onClick={()=>setDetailEvent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex gap-3 text-xs text-[#717182] mb-4">
              <span>👤 {detailEvent.tutor}</span>
              <span>📅 {detailEvent.fecha}</span>
              <span>⏱️ {detailEvent.horas}h</span>
            </div>
            <div className="space-y-2">
              {detailEvent.estudiantes.map(e=>(
                <div key={e.cuenta} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
                  <div className="w-8 h-8 bg-[#004B87] text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {e.nombre.split(" ").map(p=>p[0]).slice(0,2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#003366] truncate">{e.nombre}</p>
                    <p className="text-[10px] text-[#717182]">{e.cuenta}</p>
                  </div>
                  {e.status==="aprobado"  && <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold"><CheckCircle2 className="h-3.5 w-3.5"/>{e.horas}h acreditadas</span>}
                  {e.status==="rechazado" && <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold"><XCircle className="h-3.5 w-3.5"/>Rechazado</span>}
                  {e.status==="pendiente" && <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold"><Clock className="h-3.5 w-3.5"/>Pendiente</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
