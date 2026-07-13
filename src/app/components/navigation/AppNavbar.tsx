import { Bell, User, Home } from "lucide-react";
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

const notifications = [
  { id: 1, text: "Nuevo evento disponible: Taller de React", time: "Hace 5 min" },
  { id: 2, text: "Confirmación de asistencia exitosa", time: "Hace 1 hora" },
  { id: 3, text: "Recuerda completar tu encuesta de satisfacción", time: "Hace 2 horas" },
];

export function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleName = () => {
    const userType = sessionStorage.getItem("unah_user_type");
    if (userType === "empleado") return "Empleado";
    return "Estudiante";
  };

  const isRegistrationPage = location.pathname.includes("/registro") || location.pathname.includes("/estudiante") || location.pathname.includes("/empleado");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-lg font-semibold text-[#004B87]">Conecta Pumas</h1>
          <p className="text-xs text-muted-foreground">{getRoleName()}</p>
        </div>
      </div>

      {!isRegistrationPage && (
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-[#004B87]" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-[#FFD100] text-[#003366] hover:bg-[#FFD100]">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notif) => (
                <DropdownMenuItem key={notif.id} className="flex flex-col items-start py-3">
                  <p className="text-sm">{notif.text}</p>
                  <p className="text-xs text-muted-foreground">{notif.time}</p>
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
