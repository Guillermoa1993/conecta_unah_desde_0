import { Bell, User, Home, Shield } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { useNavigate, useLocation } from "react-router";
import { useState, useRef } from "react";
import { PermissionsPanel } from "../permissions/PermissionsPanel";
import { usePermissions } from "../../../hooks/usePermissions";
import { StoriesBar } from "./StoriesBar";
import { useNotificaciones } from "../../../hooks/useNotificaciones";

function tiempoRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso).getTime();
  const diffMs = Date.now() - fecha;
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "Justo ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
}

export function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [permOpen, setPermOpen] = useState(false);
  const shieldRef = useRef<HTMLButtonElement>(null);
  const { permissions } = usePermissions();
  const { notificaciones, noLeidas, marcarLeida } = useNotificaciones();
  const permDeniedOrPending = Object.values(permissions).some(
    (s) => s === "denied" || s === "prompt"
  );

  const getRoleName = () => {
    const userType = sessionStorage.getItem("unah_user_type");
    if (userType === "empleado") return "Empleado";
    return "Estudiante";
  };

  const isRegistrationPage = location.pathname.includes("/registro") || location.pathname.includes("/estudiante") || location.pathname.includes("/empleado");
  const isFeedScreen = location.pathname.startsWith("/student/feed");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-white px-6 gap-4">
      <div className="flex items-center gap-4 shrink-0">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold text-[#004B87]">Conecta Pumas</h1>
          <p className="text-xs text-muted-foreground">{getRoleName()}</p>
        </div>
      </div>

      {isFeedScreen && (
        <div className="hidden md:flex flex-1 min-w-0 h-16 items-center">
          <StoriesBar />
        </div>
      )}

      {!isRegistrationPage && (
        <div className="flex items-center gap-4 shrink-0">
          {/* Permissions button */}
          <div className="relative">
            <Button
              ref={shieldRef}
              variant="ghost"
              size="icon"
              onClick={() => setPermOpen((o) => !o)}
              className="relative"
              title="Permisos de la app"
            >
              <Shield className={`h-5 w-5 ${permDeniedOrPending ? "text-amber-500" : "text-emerald-500"}`} />
              {permDeniedOrPending && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 border-2 border-white" />
              )}
            </Button>
            <PermissionsPanel
              open={permOpen}
              onClose={() => setPermOpen(false)}
              anchorRef={shieldRef}
            />
          </div>
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-[#004B87]" />
                {noLeidas > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-[#FFD100] text-[#003366] hover:bg-[#FFD100]">
                    {noLeidas > 9 ? "9+" : noLeidas}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificaciones.length === 0 && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No tienes notificaciones
                </div>
              )}
              {notificaciones.slice(0, 8).map((notif) => (
                <DropdownMenuItem
                  key={notif.id}
                  className={`flex flex-col items-start py-3 ${notif.leida ? "" : "bg-[#FFD100]/10"}`}
                  onClick={() => {
                    if (!notif.leida) marcarLeida(notif.id);
                  }}
                >
                  <p className="text-sm font-medium">{notif.titulo}</p>
                  <p className="text-sm text-muted-foreground">{notif.mensaje}</p>
                  <p className="text-xs text-muted-foreground">{tiempoRelativo(notif.created_at)}</p>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#004B87] text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#004B87]">Usuario Puma</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const userType = sessionStorage.getItem("unah_user_type");
                navigate(userType === "empleado" ? "/tutor/ficha" : "/student/ficha");
              }}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/employees/notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const userType = sessionStorage.getItem("unah_user_type");
                navigate(userType === "empleado" ? "/tutor" : "/student");
              }}>
                <Home className="mr-2 h-4 w-4" />
                Inicio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}