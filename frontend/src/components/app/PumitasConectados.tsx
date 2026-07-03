import { useState } from "react";
import { Link } from "@tanstack/react-router";

interface Pumita {
  nombre: string;
  carrera: string;
  avatar: string;
  activo: boolean;
}

const pumitas: Pumita[] = [
  { nombre: "Andrea Mejía", carrera: "Ingeniería en Sistemas", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200", activo: true },
  { nombre: "Carlos Rivera", carrera: "Tutor de Contabilidad", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", activo: false },
  { nombre: "Gabriela Santos", carrera: "Psicología", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200", activo: true },
  { nombre: "Diego Alvarado", carrera: "Economía", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", activo: true },
  { nombre: "Lucía Pineda", carrera: "Administración", avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200", activo: true },
  { nombre: "Marco Zelaya", carrera: "Mercadotecnia", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200", activo: false },
];

export function PumitasConectados() {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const visibles = mostrarTodos ? pumitas : pumitas.filter(p => p.activo);

  return (
    <aside className="w-72 shrink-0 hidden xl:block">
      <div className="sticky top-24 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#003366]">Pumitas Conectados</h3>
            <span className="text-xs font-bold text-[#717182] bg-[#F4F6F8] px-2 py-0.5 rounded-full">
              {pumitas.length}
            </span>
          </div>
          <div className="space-y-3">
            {visibles.map((p) => (
              <div key={p.nombre} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img src={p.avatar} alt={p.nombre} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                  {p.activo && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[#003366] truncate">{p.nombre}</p>
                  <p className="text-xs text-[#717182] truncate">{p.carrera}</p>
                </div>
              </div>
            ))}
          </div>
          {pumitas.length > 3 && (
            <button
              onClick={() => setMostrarTodos(!mostrarTodos)}
              className="mt-4 w-full text-xs font-bold text-[#004B87] bg-[#F4F6F8] rounded-lg py-2 hover:bg-[#FFD100]/20 transition-colors"
            >
              {mostrarTodos ? "Mostrar activos" : `Ver todos (${pumitas.length})`}
            </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#004B87] to-[#003366] rounded-xl p-5 text-white">
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Artículo 140</p>
          <p className="text-sm font-semibold mt-1 leading-relaxed">
            Horas acumuladas: <span className="text-[#FFD100]">42</span>
          </p>
          <div className="mt-3 w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="bg-[#FFD100] h-full rounded-full" style={{ width: "42%" }} />
          </div>
          <Link to="/student/mis-eventos" className="mt-3 inline-block text-xs font-bold text-[#FFD100] hover:underline">
            Ver eventos →
          </Link>
        </div>
      </div>
    </aside>
  );
}