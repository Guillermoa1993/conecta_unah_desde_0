import { useRole, type AppUser, type Role } from "@/lib/role-context";

const WELCOME: Record<
  Role,
  {
    icon: string;
    badge: string;
    title: (name: string) => string;
    subtitle: (user: AppUser) => string;
    desc: string;
  }
> = {
  empleado: {
    icon: "📋",
    badge: "EMPLEADO",
    title: (n) => `Listo para facilitar, ${n}`,
    subtitle: () => "Empleado activo · Facultad de Ciencias",
    desc: "Crea y gestiona tus eventos, controla asistencia en tiempo real y revisa el impacto de tus sesiones académicas.",
  },
  voae: {
    icon: "🏛️",
    badge: "VOAE",
    title: (n) => `Auditoría institucional, ${n}`,
    subtitle: () => "Personal VOAE · Dirección de Vinculación",
    desc: "Valida eventos, verifica asistencias y genera reportes oficiales de cumplimiento para la institución.",
  },
};

const FALLBACK = {
  icon: "👋",
  badge: "BIENVENIDO",
  title: (n: string) => `Bienvenido, ${n}`,
  subtitle: () => "Sistema de gestión de eventos académicos",
  desc: "Utiliza el menú lateral para navegar por las diferentes secciones del sistema.",
};

export function WelcomeBanner() {
  const { role, user } = useRole();
  const cfg = WELCOME[role] || FALLBACK;

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--puma-blue) 0%, var(--puma-dark) 100%)" }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: "var(--puma-gold)" }}
      />
      <div className="py-6 px-8 flex items-center gap-5">
        <div className="size-12 rounded-xl bg-white/15 grid place-items-center shrink-0 text-2xl">
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0 text-white">
          <div className="text-lg font-semibold">{cfg.title(user.name)}</div>
          <div className="text-sm text-white/80 mt-0.5">{cfg.subtitle(user)}</div>
          <div className="text-sm text-white/70 mt-1.5 max-w-xl">{cfg.desc}</div>
        </div>
        <div
          className="shrink-0 text-xs font-bold tracking-wider px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "var(--puma-gold)", color: "var(--puma-dark)" }}
        >
          {cfg.badge}
        </div>
      </div>
    </div>
  );
}
