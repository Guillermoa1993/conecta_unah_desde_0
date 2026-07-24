import { Wrench, Clock } from "lucide-react";

export function Mantenimiento() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#003366] to-[#004B87] px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 rounded-full bg-[#004B87]/10 flex items-center justify-center">
            <Wrench className="h-10 w-10 text-[#004B87]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[#003366] mb-2">
          En mantenimiento
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Disculpa las molestias. Estamos realizando mejoras en la plataforma
          <strong className="text-[#003366]"> Conecta Pumas UNAH</strong>.
          En breve estaremos de regreso.
        </p>

        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#FFD100]/20 border border-[#FFD100]/40 px-4 py-3">
          <Clock className="h-4 w-4 text-[#003366]" />
          <span className="text-sm font-semibold text-[#003366]">
            Regresamos pronto — gracias por tu paciencia
          </span>
        </div>

        <div className="mt-8 flex justify-center">
          <img src="/puma_final.png" alt="Conecta Pumas" className="h-16 opacity-60" />
        </div>

        <p className="mt-4 text-xs text-slate-400">
          © {new Date().getFullYear()} UNAH — Conecta Pumas
        </p>
      </div>
    </div>
  );
}
