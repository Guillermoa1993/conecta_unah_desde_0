import React from "react";
import {
  GraduationCap,
  BookOpen,
  Palette,
  Music,
  Trophy,
  Activity,
  Users,
  HeartHandshake,
  Sparkles,
  PartyPopper,
  Building2,
  Medal
} from "lucide-react";

interface EventCoverBannerProps {
  event: any;
  heightClass?: string;
  showDetailsOverlay?: boolean;
}

const CATEGORY_META: Record<
  string,
  {
    label: string;
    primaryColor: string;
    gradientFrom: string;
    gradientTo: string;
    badgeBg: string;
    badgeText: string;
    mainIcon: React.ElementType;
    subIcon: React.ElementType;
    illustrationText: string;
  }
> = {
  ACADEMICO: {
    label: "Académico",
    primaryColor: "#003366",
    gradientFrom: "from-[#002244]",
    gradientTo: "to-[#005599]",
    badgeBg: "bg-blue-900/80 border-blue-400/30 text-blue-100",
    badgeText: "text-blue-200",
    mainIcon: GraduationCap,
    subIcon: BookOpen,
    illustrationText: "📚 Conferencias, Talleres & Aprendizaje",
  },
  CULTURAL: {
    label: "Cultural",
    primaryColor: "#d97706",
    gradientFrom: "from-[#78350f]",
    gradientTo: "to-[#d97706]",
    badgeBg: "bg-amber-900/80 border-amber-400/30 text-amber-100",
    badgeText: "text-amber-200",
    mainIcon: Palette,
    subIcon: Music,
    illustrationText: "🎭 Arte, Expresión & Talento Universitario",
  },
  DEPORTIVO: {
    label: "Deportivo",
    primaryColor: "#059669",
    gradientFrom: "from-[#064e3b]",
    gradientTo: "to-[#10b981]",
    badgeBg: "bg-emerald-900/80 border-emerald-400/30 text-emerald-100",
    badgeText: "text-emerald-200",
    mainIcon: Trophy,
    subIcon: Activity,
    illustrationText: "⚽ Torneos, Salud & Alto Rendimiento",
  },
  SOCIAL: {
    label: "Social",
    primaryColor: "#7c3aed",
    gradientFrom: "from-[#4c1d95]",
    gradientTo: "to-[#8b5cf6]",
    badgeBg: "bg-purple-900/80 border-purple-400/30 text-purple-100",
    badgeText: "text-purple-200",
    mainIcon: Users,
    subIcon: HeartHandshake,
    illustrationText: "🤝 Vinculación, Comunidad & Voluntariado",
  },
  RECREACION: {
    label: "Recreativo",
    primaryColor: "#8b5cf6",
    gradientFrom: "from-[#581c87]",
    gradientTo: "to-[#ec4899]",
    badgeBg: "bg-pink-900/80 border-pink-400/30 text-pink-100",
    badgeText: "text-pink-200",
    mainIcon: PartyPopper,
    subIcon: Sparkles,
    illustrationText: "🎪 Convivencia, Juegos & Festivales Pumas",
  },
};

export const EventCoverBanner: React.FC<EventCoverBannerProps> = ({
  event,
  heightClass = "h-64 md:h-72",
  showDetailsOverlay = true,
}) => {
  const imageUrl = event?.portada_url || event?.imagen_url;

  // Extraer ámbitos / categorías del evento
  const categories: string[] = [];

  if (event?.tipo_evento === "RECREACION") {
    categories.push("RECREACION");
  }

  if (Array.isArray(event?.distribucion_horas) && event.distribucion_horas.length > 0) {
    event.distribucion_horas.forEach((dh: any) => {
      const cat = String(dh.categoria || "").toUpperCase();
      if (cat && !categories.includes(cat)) {
        categories.push(cat);
      }
    });
  }

  if (categories.length === 0 && event?.categoria) {
    const mainCat = String(event.categoria).toUpperCase();
    categories.push(mainCat);
  }

  if (categories.length === 0) {
    categories.push("ACADEMICO");
  }

  const primaryCatKey = categories[0] || "ACADEMICO";
  const primaryMeta = CATEGORY_META[primaryCatKey] || CATEGORY_META.ACADEMICO;

  // Si el usuario subió una imagen personalizada, mostramos la foto con badges superpuestos
  if (imageUrl) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm ${heightClass} w-full group`}>
        <img src={imageUrl} alt={event?.titulo || "Portada"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Insignias de Ámbitos en la esquina superior */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
          {categories.map((catKey) => {
            const meta = CATEGORY_META[catKey] || CATEGORY_META.ACADEMICO;
            const Icon = meta.mainIcon;
            return (
              <span
                key={catKey}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${meta.badgeBg}`}
              >
                <Icon className="size-3.5" />
                {meta.label}
              </span>
            );
          })}
        </div>

        {showDetailsOverlay && (
          <div className="absolute bottom-3 left-4 right-4 z-10 text-white">
            <h3 className="text-xl md:text-2xl font-black drop-shadow-md line-clamp-1">{event?.titulo}</h3>
            <p className="text-[11px] text-slate-200 font-medium flex items-center gap-1.5 mt-0.5 opacity-90">
              <Building2 className="size-3 text-[#FFD100]" />
              {event?.facultad || "UNAH"} • {event?.carrera || event?.departamento || "Conecta Pumas"}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Si NO hay foto subida, generamos la Portada Ilustrada Dinámica por Ámbito (Simple, Doble o Triple)
  const secondaryCatKey = categories[1];
  const tertiaryCatKey = categories[2];

  const secondaryMeta = secondaryCatKey ? CATEGORY_META[secondaryCatKey] : null;
  const tertiaryMeta = tertiaryCatKey ? CATEGORY_META[tertiaryCatKey] : null;

  // Construcción del gradiente dinámico multinivel
  let gradientClass = `${primaryMeta.gradientFrom} ${primaryMeta.gradientTo}`;
  if (secondaryMeta && tertiaryMeta) {
    gradientClass = `from-[#001f3f] via-[#4c1d95] to-[#78350f]`;
  } else if (secondaryMeta) {
    gradientClass = `${primaryMeta.gradientFrom} ${secondaryMeta.gradientTo}`;
  }

  const MainIcon = primaryMeta.mainIcon;
  const SubIcon = primaryMeta.subIcon;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-700/50 bg-gradient-to-br ${gradientClass} shadow-md ${heightClass} w-full flex flex-col justify-between p-5 md:p-6 text-white group`}>
      {/* Fondo con Patrón de Micro-Iconos Flotantes Ilustrados */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-6 -left-6 size-32 rounded-full border-4 border-white/20 animate-pulse" />
        <div className="absolute top-1/4 right-8 size-24 rounded-full border-2 border-white/30" />
        <div className="absolute -bottom-8 right-12 size-40 rounded-full border-4 border-white/10" />
      </div>

      {/* Íconos Decorativos Principales Flotantes en la Portada */}
      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-25 group-hover:opacity-40 transition-opacity">
        <MainIcon className="size-20 md:size-24 transform rotate-12" />
        {secondaryMeta && React.createElement(secondaryMeta.mainIcon, { className: "size-16 md:size-20 -ml-6 -rotate-12" })}
        {tertiaryMeta && React.createElement(tertiaryMeta.mainIcon, { className: "size-12 md:size-16 -ml-4 rotate-6" })}
      </div>

      {/* Encabezado: Insignias de Ámbitos (Soporte Multi-Ámbito) */}
      <div className="relative z-10 flex flex-wrap items-center gap-2">
        {categories.map((catKey, idx) => {
          const meta = CATEGORY_META[catKey] || CATEGORY_META.ACADEMICO;
          const Icon = meta.mainIcon;
          return (
            <span
              key={catKey}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm backdrop-blur-md ${meta.badgeBg}`}
            >
              <Icon className="size-3.5 animate-bounce" style={{ animationDelay: `${idx * 150}ms` }} />
              {meta.label}
            </span>
          );
        })}

        {categories.length > 1 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-widest shadow-2xs">
            {categories.length === 2 ? "Doble Ámbito VOAE" : "Triple Ámbito VOAE"}
          </span>
        )}
      </div>

      {/* Título e Ilustración Central / Inferior */}
      <div className="relative z-10 my-auto py-2">
        <div className="flex items-center gap-2 text-[#FFD100] text-xs font-bold uppercase tracking-widest mb-1.5">
          <SubIcon className="size-4" />
          <span>
            {categories.length > 1
              ? `Combinado: ${categories.map((c) => CATEGORY_META[c]?.label || c).join(" + ")}`
              : primaryMeta.illustrationText}
          </span>
        </div>

        <h3 className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight leading-snug drop-shadow-md max-w-xl">
          {event?.titulo || "Evento Universitario UNAH"}
        </h3>
      </div>

      {/* Footer de la Portada Ilustrada */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-[11px] text-slate-200 font-semibold">
        <span className="flex items-center gap-1.5">
          <Building2 className="size-3.5 text-[#FFD100]" />
          {event?.facultad || "UNAH"} • {event?.carrera || event?.departamento || "Conecta Pumas"}
        </span>

        <span className="hidden sm:inline-block font-mono text-[10px] text-white/70 uppercase">
          VOAE • Conecta Pumas 2026
        </span>
      </div>
    </div>
  );
};
