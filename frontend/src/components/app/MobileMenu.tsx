import { useEffect, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { X, ChevronDown } from "lucide-react";
import { useRole, ROLE_META, type Role } from "@/lib/role-context";
import { NAV } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role, setRole, user } = useRole();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV[role];
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setShowRoles(false);
    onClose();
    navigate({ to: ROLE_META[r].basePath });
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 max-w-[85vw] bg-[#003366] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-conecta-pumas.jpg"
              alt="Conecta Pumas"
              className="size-8 shrink-0 rounded object-cover"
            />
            <span className="font-semibold tracking-tight">Conecta Pumas</span>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-lg hover:bg-white/10 grid place-items-center touch-manipulation"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* User info & role selector */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-9 rounded-full bg-white/20 grid place-items-center text-xs font-semibold shrink-0">
              {user.name
                .split(" ")
                .map((p: string) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="text-sm leading-tight">
              <div className="font-medium">{user.name}</div>
              <div className="text-[11px] text-white/60">{user.email}</div>
            </div>
          </div>
          <button
            onClick={() => setShowRoles(!showRoles)}
            className="flex items-center gap-2 w-full text-xs rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 transition"
          >
            <span className="size-1.5 rounded-full bg-success" />
            {ROLE_META[role].label}
            <ChevronDown
              className={cn("size-3 ml-auto transition-transform", showRoles && "rotate-180")}
            />
          </button>
          {showRoles && (
            <div className="mt-1 space-y-1">
              {(Object.keys(ROLE_META) as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={cn(
                    "w-full text-left text-xs rounded-lg px-4 py-2 transition",
                    r === role ? "bg-white/20 font-medium" : "hover:bg-white/10",
                  )}
                >
                  <div className="font-medium">{ROLE_META[r].label}</div>
                  <div className="text-[10px] text-white/60">{ROLE_META[r].description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all min-h-[44px]",
                "hover:bg-white/10 active:bg-white/20",
              )}
            >
              <it.icon className="size-4 shrink-0" />
              <span>{it.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
