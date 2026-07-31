import { useState, useEffect } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
const INSTITUTIONAL_THEME = "from-[#004B87] to-[#002b5c]";

type ThemeOption = { id: string; label: string; description: string; gradient: string; colors: string[] };

const THEME_OPTIONS: ThemeOption[] = [
  { id: "institutional", label: "Institucional UNAH", description: "Paleta oficial azul y oro", gradient: INSTITUTIONAL_THEME, colors: ["#004B87", "#002b5c", "#FFD100"] },
  { id: "ocean",        label: "Océano",              description: "Azul intenso e índigo",     gradient: "from-blue-500 to-indigo-600",    colors: ["#3b82f6", "#4f46e5", "#e0e7ff"] },
  { id: "emerald",      label: "Esmeralda",           description: "Verde y turquesa",           gradient: "from-emerald-500 to-teal-600",   colors: ["#10b981", "#0d9488", "#d1fae5"] },
  { id: "amber",        label: "Ámbar",               description: "Naranja cálido",             gradient: "from-amber-500 to-orange-600",   colors: ["#f59e0b", "#ea580c", "#fef3c7"] },
  { id: "rose",         label: "Rosa",                description: "Magenta y rosa",             gradient: "from-rose-500 to-pink-600",      colors: ["#f43f5e", "#ec4899", "#ffe4e6"] },
  { id: "violet",       label: "Violeta",             description: "Púrpura elegante",           gradient: "from-purple-500 to-violet-600",  colors: ["#a855f7", "#7c3aed", "#ede9fe"] },
  { id: "graphite",     label: "Grafito",             description: "Gris sobrio de alto contraste", gradient: "from-gray-700 to-gray-900",  colors: ["#374151", "#111827", "#f3f4f6"] },
];

export function AparenciasEstudiante() {
  const [selectedTheme, setSelectedTheme] = useState<string>(() =>
    window.localStorage.getItem("unah_aplicativos_theme") ?? INSTITUTIONAL_THEME
  );

  useEffect(() => {
    const token = sessionStorage.getItem("unah_jwt_token");
    if (!token) return;
    fetch(`${API_URL}/parametros/preferencia-color`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.tema) setSelectedTheme(d.tema); })
      .catch(() => {});
  }, []);

  const applyTheme = (gradient: string) => {
    setSelectedTheme(gradient);
    window.localStorage.setItem("unah_aplicativos_theme", gradient);
    window.dispatchEvent(new CustomEvent("theme-change", { detail: { gradient } }));

    const token = sessionStorage.getItem("unah_jwt_token");
    if (!token) return;
    fetch(`${API_URL}/parametros/preferencia-color`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tema: gradient }),
    }).catch(() => {});

    toast.success("Tema aplicado correctamente");
  };

  const restoreInstitutional = () => applyTheme(INSTITUTIONAL_THEME);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#003366]">Apariencia y colores del sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige una paleta; el cambio se aplica de inmediato en todas las pantallas (menú lateral, encabezados, botones y tarjetas) para tu usuario.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={restoreInstitutional}
          className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#003366] text-[#003366] text-sm hover:bg-[#003366]/10 transition-colors"
        >
          Restaurar colores institucionales
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {THEME_OPTIONS.map((theme) => {
          const isActive = selectedTheme === theme.gradient;
          return (
            <button
              key={theme.id}
              onClick={() => applyTheme(theme.gradient)}
              className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
                isActive ? "border-[#003366] shadow-lg scale-[1.02]" : "border-transparent hover:border-gray-300"
              }`}
            >
              <div className={`h-24 w-full bg-gradient-to-br ${theme.gradient} relative`}>
                {isActive && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                    <svg className="h-4 w-4 text-[#003366]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <p className="text-sm font-semibold text-gray-800">{theme.label}</p>
                <p className="text-xs text-gray-500">{theme.description}</p>
                <div className="flex gap-1 mt-2">
                  {theme.colors.map((c) => (
                    <span key={c} className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                  ))}
                </div>
                {isActive && (
                  <span className="mt-2 inline-block text-xs text-[#003366] font-medium">Activo</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
