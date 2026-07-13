import { useState } from "react";
import { ShieldCheck, UserPlus, Pencil, UserX, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Moderador {
  id: string; nombre: string; email: string;
  permisos: string[]; activo: boolean;
  motivo_desactivacion?: string; created_at: string;
}

const PERMISOS_LABELS: Record<string,string> = {
  APROBAR_EVENTOS:     "Aprobar eventos",
  VALIDAR_ASISTENCIAS: "Validar asistencias",
  GESTIONAR_FEED:      "Gestionar feed",
  REVISAR_CONSTANCIAS: "Revisar constancias",
};
const TODOS_PERMISOS = Object.keys(PERMISOS_LABELS);

const MOCK_MODERADORES: Moderador[] = [
  { id:"m1", nombre:"Dr. Carlos Paz",      email:"cpaz@unah.edu.hn",    permisos:["APROBAR_EVENTOS","VALIDAR_ASISTENCIAS"], activo:true,  created_at:"2026-01-15" },
  { id:"m2", nombre:"Lic. Ana Reyes",      email:"areyes@unah.edu.hn",  permisos:["GESTIONAR_FEED","REVISAR_CONSTANCIAS"],  activo:true,  created_at:"2026-02-01" },
  { id:"m3", nombre:"Ing. Roberto Sosa",   email:"rsosa@unah.edu.hn",   permisos:["APROBAR_EVENTOS"],                       activo:false, motivo_desactivacion:"Cambio de funciones en marzo 2026.", created_at:"2025-09-10" },
  { id:"m4", nombre:"MSc. Diana Fuentes",  email:"dfuentes@unah.edu.hn",permisos:["APROBAR_EVENTOS","VALIDAR_ASISTENCIAS","GESTIONAR_FEED","REVISAR_CONSTANCIAS"], activo:true, created_at:"2026-03-05" },
];

function PermisoBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[#004B87] font-semibold">
      {label}
    </span>
  );
}

function Modal({ open, onClose, children }: { open:boolean; onClose:()=>void; children:React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#003366]/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Moderadores() {
  const [mods, setMods]   = useState<Moderador[]>(MOCK_MODERADORES);
  const [addOpen, setAddOpen] = useState(false);
  const [editMod, setEditMod] = useState<Moderador|null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [deactivateMod, setDeactivateMod] = useState<Moderador|null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPerms, setNewPerms] = useState<string[]>([]);

  const openEdit = (m: Moderador) => { setEditMod(m); setEditPerms([...m.permisos]); };
  const togglePerm = (p:string, set:React.Dispatch<React.SetStateAction<string[]>>) =>
    set(prev => prev.includes(p) ? prev.filter(x=>x!==p) : [...prev, p]);

  const saveEdit = () => {
    if (!editMod) return;
    setMods(prev => prev.map(m => m.id===editMod.id ? {...m, permisos:editPerms} : m));
    toast.success("Permisos actualizados");
    setEditMod(null);
  };

  const confirmDeactivate = () => {
    if (!deactivateMod || deactivateReason.trim().length < 10) return;
    setMods(prev => prev.map(m => m.id===deactivateMod.id ? {...m, activo:false, motivo_desactivacion:deactivateReason} : m));
    toast.success(`${deactivateMod.nombre} desactivado`);
    setDeactivateMod(null); setDeactivateReason("");
  };

  const addModerador = () => {
    if (!newName.trim() || !newEmail.trim()) { toast.error("Nombre y correo son requeridos"); return; }
    const nuevo: Moderador = { id:`m${Date.now()}`, nombre:newName.trim(), email:newEmail.trim(),
      permisos:newPerms, activo:true, created_at:new Date().toISOString().slice(0,10) };
    setMods(prev => [...prev, nuevo]);
    toast.success("Moderador agregado"); setAddOpen(false); setNewName(""); setNewEmail(""); setNewPerms([]);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#003366] flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-[#004B87]"/>Gestión de Moderadores
          </h1>
          <p className="text-sm text-[#717182]">Asigna y gestiona permisos del equipo VOAE</p>
        </div>
        <button onClick={()=>setAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">
          <UserPlus className="h-4 w-4"/>Agregar moderador
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Moderador","Correo","Permisos","Estado","Desde","Acciones"].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-black text-[#717182] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mods.map((m,i)=>(
                <tr key={m.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-[#004B87] text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {m.nombre.split(" ").map(p=>p[0]).slice(0,2).join("")}
                      </div>
                      <span className="font-semibold text-[#003366]">{m.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#717182] text-xs">{m.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {m.permisos.map(p=><PermisoBadge key={p} label={PERMISOS_LABELS[p]??p}/>)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.activo ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">Activo</span>
                    ) : (
                      <span title={m.motivo_desactivacion} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold cursor-help">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#717182]">{m.created_at}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={()=>openEdit(m)}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-[#1A6FBF] text-[#1A6FBF] hover:bg-blue-50 rounded-lg text-[10px] font-bold transition-colors">
                        <Pencil className="h-3 w-3"/>Editar
                      </button>
                      {m.activo && (
                        <button onClick={()=>{setDeactivateMod(m);setDeactivateReason("");}}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-red-300 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-bold transition-colors">
                          <UserX className="h-3 w-3"/>Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Permisos */}
      <Modal open={!!editMod} onClose={()=>setEditMod(null)}>
        <h2 className="text-base font-black text-[#003366] flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-[#004B87]"/>Editar permisos
        </h2>
        <p className="text-xs text-[#717182] mb-4">Modifica los permisos de <strong>{editMod?.nombre}</strong></p>
        <div className="space-y-3 mb-5">
          {TODOS_PERMISOS.map(p=>(
            <label key={p} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-[#004B87]"
                checked={editPerms.includes(p)} onChange={()=>togglePerm(p,setEditPerms)}/>
              <span className="text-sm text-[#003366]">{PERMISOS_LABELS[p]}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setEditMod(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#717182] hover:bg-gray-50">Cancelar</button>
          <button onClick={saveEdit} className="flex-1 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">Guardar</button>
        </div>
      </Modal>

      {/* Modal Desactivar */}
      <Modal open={!!deactivateMod} onClose={()=>setDeactivateMod(null)}>
        <h2 className="text-base font-black text-red-700 flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5"/>Desactivar moderador
        </h2>
        <p className="text-sm text-[#717182] mb-4">¿Desactivar a <strong className="text-[#003366]">{deactivateMod?.nombre}</strong>? Esta acción puede revertirse.</p>
        <label className="block text-xs font-bold text-[#717182] uppercase tracking-wider mb-1.5">Motivo (mínimo 10 caracteres)</label>
        <textarea rows={3} value={deactivateReason} onChange={e=>setDeactivateReason(e.target.value)}
          placeholder="Ej: Cambio de funciones, fin de período..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] resize-none focus:outline-none focus:border-red-400 mb-4"/>
        <div className="flex gap-2">
          <button onClick={()=>setDeactivateMod(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#717182] hover:bg-gray-50">Cancelar</button>
          <button onClick={confirmDeactivate} disabled={deactivateReason.trim().length < 10}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-colors">
            Confirmar
          </button>
        </div>
      </Modal>

      {/* Modal Agregar */}
      <Modal open={addOpen} onClose={()=>setAddOpen(false)}>
        <h2 className="text-base font-black text-[#003366] flex items-center gap-2 mb-4">
          <UserPlus className="h-5 w-5 text-[#004B87]"/>Agregar moderador
        </h2>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">Nombre completo</label>
            <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Ej. Lic. Ana Reyes"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] focus:outline-none focus:border-[#004B87]"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-1">Correo institucional</label>
            <input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="correo@unah.edu.hn"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#003366] focus:outline-none focus:border-[#004B87]"/>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#717182] uppercase tracking-wider mb-2">Permisos</label>
            <div className="space-y-2">
              {TODOS_PERMISOS.map(p=>(
                <label key={p} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[#004B87]"
                    checked={newPerms.includes(p)} onChange={()=>togglePerm(p,setNewPerms)}/>
                  <span className="text-sm text-[#003366]">{PERMISOS_LABELS[p]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setAddOpen(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-[#717182] hover:bg-gray-50">Cancelar</button>
          <button onClick={addModerador} className="flex-1 py-2.5 bg-[#004B87] hover:bg-[#003366] text-white rounded-xl text-sm font-bold transition-colors">Agregar</button>
        </div>
      </Modal>
    </div>
  );
}
