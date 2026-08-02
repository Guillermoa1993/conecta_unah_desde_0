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
  Medal,
  Award,
  Flame,
  Globe,
  Smile,
  Compass,
  Star,
  Gamepad2,
  Brush,
  Tv,
  Zap,
  CheckCircle2
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
    bgPatternIcons: React.ElementType[];
    accentColorClass: string;
    illustrationText: string;
  }
> = {
  ACADEMICO: {
    label: "Académico",
    primaryColor: "#003366",
    gradientFrom: "from-[#001D3D] via-[#003366]",
    gradientTo: "to-[#004B87]",
    badgeBg: "bg-blue-950/90 border-blue-400/50 text-blue-100",
    badgeText: "text-blue-200",
    mainIcon: GraduationCap,
    subIcon: BookOpen,
    bgPatternIcons: [GraduationCap, BookOpen, Award, Globe, Compass],
    accentColorClass: "text-cyan-300/40",
    illustrationText: "📚 Conferencias, Talleres & Aprendizaje",
  },
  CULTURAL: {
    label: "Cultural",
    primaryColor: "#d97706",
    gradientFrom: "from-[#451a03] via-[#78350f]",
    gradientTo: "to-[#b45309]",
    badgeBg: "bg-amber-950/90 border-amber-400/50 text-amber-100",
    badgeText: "text-amber-200",
    mainIcon: Palette,
    subIcon: Music,
    bgPatternIcons: [Palette, Music, Brush, Tv, Sparkles],
    accentColorClass: "text-amber-300/45",
    illustrationText: "🎭 Arte, Expresión & Talento Universitario",
  },
  DEPORTIVO: {
    label: "Deportivo",
    primaryColor: "#059669",
    gradientFrom: "from-[#022c22] via-[#064e3b]",
    gradientTo: "to-[#047857]",
    badgeBg: "bg-emerald-950/90 border-emerald-400/50 text-emerald-100",
    badgeText: "text-emerald-200",
    mainIcon: Trophy,
    subIcon: Activity,
    bgPatternIcons: [Trophy, Activity, Medal, Flame, Zap],
    accentColorClass: "text-emerald-300/45",
    illustrationText: "⚽ Torneos, Salud & Alto Rendimiento",
  },
  SOCIAL: {
    label: "Social",
    primaryColor: "#7c3aed",
    gradientFrom: "from-[#2e1065] via-[#4c1d95]",
    gradientTo: "to-[#6d28d9]",
    badgeBg: "bg-purple-950/90 border-purple-400/50 text-purple-100",
    badgeText: "text-purple-200",
    mainIcon: Users,
    subIcon: HeartHandshake,
    bgPatternIcons: [Users, HeartHandshake, Smile, Globe, Award],
    accentColorClass: "text-purple-300/45",
    illustrationText: "🤝 Vinculación, Comunidad & Voluntariado",
  },
  RECREACION: {
    label: "Recreativo",
    primaryColor: "#8b5cf6",
    gradientFrom: "from-[#4a044e] via-[#701a75]",
    gradientTo: "to-[#be185d]",
    badgeBg: "bg-pink-950/90 border-pink-400/50 text-pink-100",
    badgeText: "text-pink-200",
    mainIcon: PartyPopper,
    subIcon: Sparkles,
    bgPatternIcons: [PartyPopper, Sparkles, Gamepad2, Star, Flame],
    accentColorClass: "text-pink-300/45",
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

  // Si NO hay foto subida, generamos la Portada Ilustrada Dinámica por Ámbito (Fondo con Arte Integrado de Alto Contraste)
  const secondaryCatKey = categories[1];
  const tertiaryCatKey = categories[2];

  const secondaryMeta = secondaryCatKey ? CATEGORY_META[secondaryCatKey] : null;
  const tertiaryMeta = tertiaryCatKey ? CATEGORY_META[tertiaryCatKey] : null;

  // Construcción del gradiente dinámico multinivel
  let gradientClass = `${primaryMeta.gradientFrom} ${primaryMeta.gradientTo}`;
  if (secondaryMeta && tertiaryMeta) {
    gradientClass = `from-[#0f172a] via-[#4c1d95] to-[#78350f]`;
  } else if (secondaryMeta) {
    gradientClass = `${primaryMeta.gradientFrom} ${secondaryMeta.gradientTo}`;
  }

  const MainIcon = primaryMeta.mainIcon;
  const SubIcon = primaryMeta.subIcon;

  // Recopilación de íconos temáticos para la ilustración de marca de agua en el fondo
  const allBgIcons: React.ElementType[] = [...primaryMeta.bgPatternIcons];
  if (secondaryMeta) allBgIcons.push(...secondaryMeta.bgPatternIcons);
  if (tertiaryMeta) allBgIcons.push(...tertiaryMeta.bgPatternIcons);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-700/60 bg-gradient-to-br ${gradientClass} shadow-md ${heightClass} w-full flex flex-col justify-between p-4 sm:p-5 text-white group select-none`}>
      
      {/* 🎨 FONDO CON ARTE TEMÁTICO ILUSTRADO DE ALTO CONTRASTE (INTEGRADO DIRECTAMENTE AL FONDO DE LA PORTADA) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Ícono Principal Gigante Ilustrado en Fondo (Derecha) */}
        <div className={`absolute -top-6 -right-6 size-48 sm:size-56 ${primaryMeta.accentColorClass} transform rotate-12 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}>
          <MainIcon className="w-full h-full stroke-[2]" />
        </div>

        {/* Segundo ícono temático ilustrado (Centro-Derecha) */}
        {allBgIcons[1] && (
          <div className={`absolute top-1/3 right-14 sm:right-24 size-28 sm:size-36 ${primaryMeta.accentColorClass} transform -rotate-12`}>
            {React.createElement(allBgIcons[1], { className: "w-full h-full stroke-[2]" })}
          </div>
        )}

        {/* Tercer ícono temático ilustrado (Abajo-Derecha) */}
        {allBgIcons[2] && (
          <div className={`absolute -bottom-4 right-4 size-32 sm:size-40 ${primaryMeta.accentColorClass} transform rotate-45`}>
            {React.createElement(allBgIcons[2], { className: "w-full h-full stroke-[2]" })}
          </div>
        )}

        {/* Cuarto ícono temático ilustrado (Arriba-Centro) */}
        {allBgIcons[3] && (
          <div className={`absolute top-2 left-1/3 size-20 sm:size-24 ${primaryMeta.accentColorClass} transform rotate-12`}>
            {React.createElement(allBgIcons[3], { className: "w-full h-full stroke-[1.8]" })}
          </div>
        )}

        {/* Quinto ícono temático ilustrado (Abajo-Izquierda) */}
        {allBgIcons[4] && (
          <div className={`absolute -bottom-4 -left-4 size-28 sm:size-32 ${primaryMeta.accentColorClass} transform -rotate-12`}>
            {React.createElement(allBgIcons[4], { className: "w-full h-full stroke-[1.8]" })}
          </div>
        )}

        {/* Resplandores Neón de Fondo por Ámbito */}
        <div className="absolute -top-10 -left-10 size-44 rounded-full bg-white/15 blur-xl" />
        <div className="absolute -bottom-10 right-1/4 size-52 rounded-full bg-amber-400/20 blur-2xl" />
      </div>

      {/* Capa de contraste suave para asegurar legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 z-[1] pointer-events-none" />

      {/* ── Encabezado: Badges de Categoría ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((catKey) => {
            const meta = CATEGORY_META[catKey] || CATEGORY_META.ACADEMICO;
            const Icon = meta.mainIcon;
            return (
              <span
                key={catKey}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md backdrop-blur-md ${meta.badgeBg}`}
              >
                <Icon className="size-4 text-[#FFD100]" />
                {meta.label}
              </span>
            );
          })}

          {categories.length > 1 && (
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#FFD100] text-slate-950 uppercase tracking-widest shadow-2xs">
              {categories.length === 2 ? "Doble Ámbito VOAE" : "Triple Ámbito VOAE"}
            </span>
          )}
        </div>

        <div className="size-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs">
          <MainIcon className="size-4" />
        </div>
      </div>

      {/* ── Título e Información Temática Central ── */}
      <div className="relative z-10 my-auto py-1 space-y-1">
        <div className="flex items-center gap-1.5 text-[#FFD100] text-xs font-black uppercase tracking-wider drop-shadow-md">
          <SubIcon className="size-4 shrink-0 text-[#FFD100]" />
          <span className="truncate">
            {categories.length > 1
              ? `Ámbitos Combinados: ${categories.map((c) => CATEGORY_META[c]?.label || c).join(" + ")}`
              : primaryMeta.illustrationText}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl lg:text-2xl font-black uppercase tracking-tight leading-snug drop-shadow-xl line-clamp-2 text-white">
          {event?.titulo || "Evento Universitario UNAH"}
        </h3>
      </div>

      {/* ── Pie de la Portada Ilustrada ── */}
      {showDetailsOverlay && (
        <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/20 text-[11px] text-slate-200 font-semibold">
          <span className="flex items-center gap-1.5 truncate">
            <Building2 className="size-3.5 text-[#FFD100] shrink-0" />
            <span className="truncate">
              {event?.facultad || "UNAH"} • {event?.carrera || event?.departamento || "Conecta Pumas"}
            </span>
          </span>

          <span className="hidden sm:inline-block font-mono text-[10px] text-white/90 uppercase shrink-0">
            CONECTA PUMAS 2026
          </span>
        </div>
      )}
    </div>
  );
};
