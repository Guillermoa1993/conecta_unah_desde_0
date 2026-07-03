import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Shield, ChevronDown } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { useSidebarCtx } from "@/lib/sidebar-context";
import { NAV_GROUPS } from "@/lib/nav-config";
import { MODERADORES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { role, user } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const groups = NAV_GROUPS[role];
  const isModerator =
    role === "empleado" && MODERADORES.some((m) => m.activo && m.usuario_id === user.id);
  const { expanded, toggle } = useSidebarCtx();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/logo-conecta-pumas.jpg"
            alt="Conecta Pumas"
            className="size-10 shrink-0 rounded object-cover"
          />
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">Conecta Pumas</div>
            <div className="text-[11px] text-sidebar-foreground/60">Módulo de Eventos</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {groups.map((group) => {
          const isOpen = expanded[group.label] !== false;
          return (
            <div key={group.label}>
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center w-full gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition"
              >
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform",
                    isOpen ? "rotate-0" : "-rotate-90",
                  )}
                />
                {group.label}
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {group.items.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                        "hover:bg-sidebar-accent",
                      )}
                    >
                      <it.icon className="size-4 shrink-0" />
                      <span>{it.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {isModerator && (
          <div>
            <button
              onClick={() => toggle("__moderator")}
              className="flex items-center w-full gap-2 px-3 py-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80 transition"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  expanded["__moderator"] ? "rotate-0" : "-rotate-90",
                )}
              />
              Moderación
            </button>
            {expanded["__moderator"] && (
              <Link
                to="/empleado/moderador/eventos"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                  "hover:bg-sidebar-accent",
                )}
              >
                <Shield className="size-4 shrink-0" />
                <span>Eventos donde soy moderador</span>
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/60 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-sidebar-primary">
            <BarChart3 className="size-3.5" /> Artículo 140
          </div>
          <p className="text-[11px] text-sidebar-foreground/70 mt-1 leading-snug">
            Plataforma oficial de validación de horas académicas.
          </p>
        </div>
      </div>
    </aside>
  );
}
