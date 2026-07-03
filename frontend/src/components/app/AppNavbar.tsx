import { useState } from "react";
import {
  Bell,
  ChevronDown,
  CheckCircle2,
  XCircle,
  QrCode,
  AlertCircle,
  Info,
  Menu,
} from "lucide-react";
import { useRole, ROLE_META, type Role } from "@/lib/role-context";
import { MobileMenu } from "./MobileMenu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useNavigate, Link } from "@tanstack/react-router";
import { NOTIFICACIONES, type Notificacion } from "@/lib/mock-data";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function notifIcon(tipo: Notificacion["tipo"], titulo: string) {
  if (titulo.toLowerCase().includes("rechazada"))
    return <XCircle className="size-4 text-destructive shrink-0" />;
  if (titulo.toLowerCase().includes("aprobada") || titulo.toLowerCase().includes("acreditar"))
    return <CheckCircle2 className="size-4 text-success shrink-0" />;
  if (titulo.toLowerCase().includes("inscribiste") || titulo.toLowerCase().includes("disponible"))
    return <QrCode className="size-4 text-primary shrink-0" />;
  if (titulo.toLowerCase().includes("mañana") || titulo.toLowerCase().includes("comienza"))
    return <AlertCircle className="size-4 text-gold shrink-0" />;
  return <Info className="size-4 text-muted-foreground shrink-0" />;
}

export function AppNavbar() {
  const { role, setRole, user } = useRole();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState(NOTIFICACIONES);
  const [open, setOpen] = useState(false);

  const unread = notifs.filter((n) => !n.leido).length;

  const handleRoleChange = (r: Role) => {
    setRole(r);
    navigate({ to: ROLE_META[r].basePath });
  };

  const markRead = (n: Notificacion) => {
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, leido: true } : x)));
  };

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile fixed header — visible only on small screens */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#003366] text-white md:hidden flex items-center px-3 gap-2">
        <button
          onClick={() => setMobileOpen(true)}
          className="size-9 grid place-items-center hover:bg-white/10 rounded-lg shrink-0"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo-conecta-pumas.jpg" alt="" className="size-7 rounded object-cover" />
        </Link>
        <span className="font-semibold text-sm flex-1 text-center">Conecta Pumas</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="relative size-9 grid place-items-center hover:bg-white/10 rounded-lg shrink-0">
            <Bell className="size-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FFD100]" />
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Notificaciones</div>
              {unread > 0 && (
                <Badge variant="secondary" className="bg-gold/20 text-foreground border-gold/40">
                  {unread} nuevas
                </Badge>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No tienes notificaciones nuevas.
                </div>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markRead(n);
                      setOpen(false);
                    }}
                    className="p-4 border-b last:border-0 hover:bg-secondary/60 transition cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {!n.leido && (
                        <div className="size-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      )}
                      <div className="flex gap-2.5 flex-1 min-w-0">
                        {notifIcon(n.tipo, n.titulo)}
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${!n.leido ? "font-semibold" : "font-medium"}`}>
                            {n.titulo}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{n.mensaje}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {timeAgo(n.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
        <div className="size-8 rounded-full bg-white/20 grid place-items-center text-xs font-semibold shrink-0">
          {user.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")}
        </div>
      </header>

      {/* Desktop navbar — hidden on mobile */}
      <header className="hidden md:flex h-16 shrink-0 border-b bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="h-full px-4 md:px-6 flex items-center justify-between w-full">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo-conecta-pumas.jpg" alt="" className="size-7 rounded object-cover" />
            <span className="font-semibold text-foreground">Conecta Pumas</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger className="relative h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary transition">
                <Bell className="size-5 text-foreground" />
                {unread > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-gold ring-2 ring-card" />
                )}
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="font-semibold">Notificaciones</div>
                  {unread > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-gold/20 text-foreground border-gold/40"
                    >
                      {unread} nuevas
                    </Badge>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No tienes notificaciones nuevas.
                    </div>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markRead(n);
                          setOpen(false);
                        }}
                        className="p-4 border-b last:border-0 hover:bg-secondary/60 transition cursor-pointer"
                      >
                        <div className="flex gap-3">
                          {!n.leido && (
                            <div className="size-2 mt-1.5 rounded-full bg-primary shrink-0" />
                          )}
                          <div className="flex gap-2.5 flex-1 min-w-0">
                            {notifIcon(n.tipo, n.titulo)}
                            <div className="flex-1 min-w-0">
                              <div
                                className={`text-sm ${!n.leido ? "font-semibold" : "font-medium"}`}
                              >
                                {n.titulo}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {n.mensaje}
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-1">
                                {timeAgo(n.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Role selector badge */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-secondary hover:bg-accent text-xs font-medium transition shrink-0">
                <span className="size-1.5 rounded-full bg-success" />
                {ROLE_META[role].label}
                <ChevronDown className="size-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Cambiar rol (demo)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(Object.keys(ROLE_META) as Role[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onSelect={() => handleRoleChange(r)}
                    className="flex-col items-start gap-0.5"
                  >
                    <span className="font-medium">{ROLE_META[r].label}</span>
                    <span className="text-xs text-muted-foreground">
                      {ROLE_META[r].description}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar + name (static — no dropdown) */}
            <div className="flex items-center gap-2.5 h-10 pl-1 pr-3 shrink-0">
              <div
                className="size-8 rounded-full"
                style={{ backgroundColor: "var(--puma-blue)" }}
              >
                <div className="w-full h-full grid place-items-center text-primary-foreground text-xs font-semibold">
                  {user.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-[11px] text-muted-foreground">{ROLE_META[role].label}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
