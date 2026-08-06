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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { SidebarTrigger } from "../ui/sidebar";
import { useNavigate, useLocation } from "react-router";
import { useState, useRef } from "react";
import { PermissionsPanel } from "../permissions/PermissionsPanel";
import { usePermissions } from "../../../hooks/usePermissions";
import { StoriesBar } from "./StoriesBar";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/auth.service";
import type { Notificacion } from "../../../types";

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
  const { usuario } = useAuth();
  const usuarioGuardado = authService.getUsuarioGuardado();
  const usuarioActivo = usuario || usuarioGuardado;

  const activeRole = (
    sessionStorage.getItem("unah_role") ||
    (location.pathname.startsWith("/voae-depto") ? "VOAE_DEPARTAMENTO" :
     location.pathname.startsWith("/voae") ? "VOAE_DIRECCION" :
     location.pathname.startsWith("/tutor") ? "EMPLEADO" :
     location.pathname.startsWith("/admin") ? "ADMIN" :
     usuarioActivo?.rol || "ESTUDIANTE")
  ).toString().toUpperCase();

  const getNombreUsuario = () => {
    if (usuarioActivo?.nombre) return usuarioActivo.nombre;

    if (activeRole.includes("DEPTO") || activeRole.includes("COORDINAC")) {
      return "Coordinador de Departamento (Prueba)";
    }
    if (activeRole.includes("VOAE")) {
      return "Dirección VOAE (Prueba)";
    }
    if (activeRole.includes("TUTOR") || activeRole.includes("EMPLEADO")) {
      return "Empleado / Tutor (Prueba)";
    }
    return "Estudiante (Prueba)";
  };

  const nombreUsuario = getNombreUsuario();
  const fotoUsuario = usuarioActivo?.foto_url || localStorage.getItem("unah_foto_perfil");

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getInicioRoute = () => {
    if (activeRole.includes("DEPTO") || activeRole.includes("COORDINAC")) return "/voae-depto";
    if (activeRole.includes("VOAE")) return "/voae";
    if (activeRole.includes("TUTOR") || activeRole.includes("EMPLEADO")) return "/tutor/feed";
    if (activeRole.includes("ADMIN")) return "/admin/administracion";
    return "/student/feed";
  };

  const getPerfilRoute = () => {
    if (activeRole.includes("TUTOR") || activeRole.includes("EMPLEADO") || activeRole.includes("DOCENTE")) return "/tutor/ficha";
    return "/student/ficha";
  };

  const permDeniedOrPending = Object.values(permissions).some(
    (s) => s === "denied" || s === "prompt"
  );

  const getRoleName = () => {
    switch (activeRole) {
      case 'ESTUDIANTE':
      case 'STUDENT':
        return 'Estudiante';
      case 'TUTOR':
      case 'EMPLEADO':
      case 'DOCENTE':
        return 'Empleado / Tutor';
      case 'ADMIN':
        return 'Administrador';
      case 'VOAE':
      case 'VOAE_DIRECCION':
        return 'VOAE Dirección';
      case 'VOAE_DEPTO':
      case 'VOAE_DEPARTAMENTO':
      case 'COORDINACION':
      case 'DEPARTAMENTO':
        return 'VOAE Departamento (Coordinación)';
      default:
        if (location.pathname.startsWith("/voae-depto")) return 'VOAE Departamento (Coordinación)';
        if (location.pathname.startsWith("/voae")) return 'VOAE Dirección';
        if (location.pathname.startsWith("/tutor")) return 'Empleado / Tutor';
        if (location.pathname.startsWith("/admin")) return 'Administrador';
        return 'Estudiante';
    }
  };

  const getModuleName = () => {
    const path = location.pathname;

    // Módulos de Administración
    if (path.includes("/admin/parametros")) return "Parámetros del Sistema";
    if (path.includes("/admin/administracion")) return "Administración";
    if (path.includes("/admin/usuarios")) return "Usuarios";
    if (path.includes("/admin/roles")) return "Roles";
    if (path.includes("/admin/permisos")) return "Permisos";
    if (path.includes("/admin/eventos")) return "Gestión de Eventos";
    if (path.includes("/admin/comentarios")) return "Comentarios";
    if (path.includes("/admin/backup")) return "Respaldo y Restauración";
    if (path.includes("/admin/reportes")) return "Reportes del Sistema";
    if (path.includes("/admin/notificaciones")) return "Notificaciones";
    if (path.includes("/admin/bitacora")) return "Bitácora de Auditoría";
    if (path.includes("/admin/catalogos")) return "Catálogos del Sistema";

    // Módulos de Tutor / Empleado
    if (path.includes("/tutor/dashboard")) return "Panel de Gestión";
    if (path.includes("/tutor/eventos")) return "Histórico de Eventos";
    if (path.includes("/tutor/mis-eventos")) return "Mis Eventos";
    if (path.includes("/tutor/crear-evento")) return "Crear Evento";
    if (path.includes("/tutor/reportes")) return "Reportes de Tutor";
    if (path.includes("/tutor/ficha")) return "Ficha de Empleado";

    // Módulos de VOAE
    if (path.includes("/voae/dashboard")) return "Panel VOAE";
    if (path.includes("/voae/validacion")) return "Validación de Eventos";
    if (path.includes("/voae/auditoria")) return "Auditoría de Eventos";
    if (path.includes("/voae/registros")) return "Histórico de Registros";
    if (path.includes("/voae/reportes")) return "Reportes Oficiales";
    if (path.includes("/voae/centros")) return "Centros Regionales";
    if (path.includes("/voae/moderadores")) return "Moderadores";

    // Módulos de Estudiante
    if (path.includes("/student/feed")) return "Muro Social";
    if (path.includes("/student/events")) return "Eventos Disponibles";
    if (path.includes("/student/academic")) return "Historial Académico";
    if (path.includes("/student/profile")) return "Perfil Estudiantil";
    if (path.includes("/student/ficha")) return "Ficha Estudiantil";
    if (path.includes("/student/qr-scanner")) return "Escanear QR";

    // Varios
    if (path.includes("/acerca-de")) return "Acerca de UNAH Conecta";
    if (path.includes("/aplicativos")) return "Aplicativos";
    if (path.includes("/logs")) return "Bitácora de Logs";

    return getRoleName();
  };

  const isRegistrationPage = location.pathname.includes("/registro") || location.pathname.includes("/estudiante") || location.pathname.includes("/empleado");
  const isFeedScreen = location.pathname.startsWith("/student/feed");

  // Antes esta lógica vivía solo en el panel de notificaciones de Mi Perfil
  // (manejarClickNotificacion en StudentProfile.tsx). Al mover las notificaciones
  // solo a este dropdown del navbar, esa navegación se quedó desconectada — aquí
  // la reconectamos para que el clic sí lleve a algún lado según el tipo.
  const manejarClickNotificacion = (notif: Notificacion) => {
    if (!notif.leida) marcarLeida(notif.id);

    const esEmpleado = sessionStorage.getItem("unah_user_type") === "empleado";

    switch (notif.tipo) {
      case "REACCION_PUMITA":
      case "SOLICITUD_PUMITA":
        // Perfil de quien envió la reacción/solicitud + el detalle de lo enviado
        // se muestran dentro de Mi Perfil (modal de Pumitas), así que navegamos
        // ahí pasando los datos para que se abra automáticamente.
        navigate("/student/ficha", {
          state: {
            abrirNotificacionPumita: {
              tipo: notif.tipo,
              referenciaId: notif.referencia_id,
              emisorNombre: notif.emisor_nombre,
              mensaje: notif.mensaje,
            },
          },
        });
        break;
      case "EVENTO_DISPONIBLE":
        navigate("/student/events");
        break;
      case "EVENTO_APROBADO":
      case "EVENTO_RECHAZADO":
        navigate(esEmpleado ? "/tutor/eventos" : "/student/events");
        break;
      default:
        // SISTEMA, ANUNCIO_*, RECORDATORIO, CONSTANCIA_EMITIDA, NUEVA_INSCRIPCION:
        // todavía no tienen un destino específico definido.
        break;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-white px-3 sm:px-6 gap-2 sm:gap-4 w-full">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
        <SidebarTrigger />
        <div className="min-w-0 truncate">
          <h1 className="text-base sm:text-lg font-bold text-[#004B87] truncate">Conecta Pumas</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{getRoleName()}</p>
        </div>
      </div>

      {isFeedScreen && (
        <div className="hidden md:flex flex-1 min-w-0 h-16 items-center">
          <StoriesBar />
        </div>
      )}

      {!isRegistrationPage && (
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
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
                  className={`flex flex-col items-start py-3 cursor-pointer ${notif.leida ? "" : "bg-[#FFD100]/10"}`}
                  onClick={() => manejarClickNotificacion(notif)}
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
                  {fotoUsuario && (
                    <AvatarImage src={fotoUsuario} alt={nombreUsuario} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-[#004B87] text-white text-xs font-semibold">
                    {getInitials(nombreUsuario)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-[#004B87] hidden lg:inline truncate max-w-[160px]">{nombreUsuario}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(getPerfilRoute())}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/employees/notifications")}>
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(getInicioRoute())}>
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