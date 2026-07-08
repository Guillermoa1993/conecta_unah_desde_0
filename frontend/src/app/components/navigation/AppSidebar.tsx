import { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router";
import {
  Home, Calendar, QrCode, History, Plus, BarChart3, Users, Settings,
  Shield, FileText, MessageSquare, ChevronDown, ChevronUp,
  GraduationCap, MapPin, Bell, LogOut, Rss, KeyRound, User,
  Wifi, ShieldCheck, ClipboardList, SendHorizonal, Database,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "../ui/sidebar";

/* ─── MENÚS POR ROL ─── */
type MenuItem = { icon: React.ElementType; label: string; path: string };
const STUDENT_ACTIVITY_ITEMS = [
  { icon: Rss,      label: "Feed",        path: "/student/feed"   },
  { icon: User,     label: "Perfil",      path: "/student/ficha"  },
  { icon: Calendar, label: "Mis Eventos", path: "/student/events" },
];

const MENU_BY_ROLE: Record<string, MenuItem[]> = {
  student: [
   
    { icon: Home,          label: "Dashboard",       path: "/student"          },
    { icon: Bell,          label: "Notificaciones",  path: "/employees/notifications" },
  ],
  tutor: [
    { icon: Calendar,      label: "Gestión de eventos", path: "/tutor/eventos"      },
    { icon: History,       label: "Historial",         path: "/tutor/history"      },
    { icon: Rss,           label: "Muro Social",       path: "/tutor/feed"         },
    { icon: Bell,          label: "Notificaciones",    path: "/employees/notifications" },
  ],
  admin: [
    { icon: Shield,        label: "Administración",     path: "/admin/administracion" },
    { icon: Users,    label: "Usuarios", path: "/admin/users"       },
    { icon: KeyRound, label: "Roles",    path: "/admin/roles"       },
    { icon: Settings, label: "Permisos", path: "/admin/permissions" },
    { icon: Calendar,      label: "Gestión de Eventos", path: "/admin/events"         },
    { icon: MessageSquare, label: "Comentarios",        path: "/admin/comments"       },
    { icon: Database,      label: "Respaldo",           path: "/admin/backup"         },
    { icon: BarChart3,     label: "Reportes",           path: "/tutor/reports"        },
    { icon: Bell,          label: "Notificaciones",     path: "/employees/notifications" },
    { icon: History,  label: "Bitácora", path: "/employees/logs"    },
  
  ],
  voae: [
    { icon: Home,           label: "Panel de gestión",   path: "/voae"             },
    { icon: Rss,            label: "Muro Social",       path: "/voae/feed"        },
    { icon: FileText,       label: "Reportes Oficiales",path: "/voae/reports"     },
    { icon: ClipboardList,  label: "Histórico de eventos", path: "/voae/records"     },
    { icon: MapPin,         label: "Centros Regionales",path: "/voae/centros"     },
    { icon: ShieldCheck,    label: "Moderadores",       path: "/voae/moderadores" },
    { icon: Bell,           label: "Notificaciones",    path: "/employees/notifications" },
    { icon: History,        label: "Bitácora",          path: "/employees/logs"   },
  ],
  dev: [
    { icon: Home,          label: "Dashboard Estudiante",path: "/student"        },
    { icon: Rss,           label: "Muro Social",        path: "/student/feed"   },
    { icon: Calendar,      label: "Eventos",            path: "/student/events" },
    { icon: QrCode,        label: "QR Scanner",         path: "/student/scan"   },
    // Tutor
    { icon: Calendar,      label: "Mis Eventos",        path: "/tutor/eventos"      },
    { icon: Plus,          label: "Crear Evento",       path: "/tutor/create-event" },
    { icon: BarChart3,     label: "Reportes Tutor",     path: "/tutor/reports"  },
    // Admin
    { icon: Shield,        label: "Administración",     path: "/admin/administracion" },
    { icon: Users,         label: "Usuarios",           path: "/admin/users"    },
    { icon: KeyRound,      label: "Roles",              path: "/admin/roles"    },
    { icon: Settings,      label: "Permisos",           path: "/admin/permissions" },
    // VOAE
    { icon: FileText,      label: "Reportes VOAE",      path: "/voae/reports"     },
    { icon: ClipboardList, label: "Registros VOAE",     path: "/voae/records"     },
    { icon: MapPin,        label: "Centros",            path: "/voae/centros"     },
    { icon: ShieldCheck,   label: "Moderadores",        path: "/voae/moderadores" },
    // Grupo 3
    { icon: SendHorizonal, label: "Solicitar Evento",   path: "/student/solicitar"},
    { icon: Wifi,          label: "Evento en Vivo",     path: "/tutor/live"       },
    // Shared
    { icon: Bell,          label: "Notificaciones",     path: "/employees/notifications" },
    { icon: History,       label: "Bitácora",           path: "/employees/logs" },
  ],
};

const ROLE_LABELS: Record<string, string> = {
  student: "Estudiante",
  tutor:   "Empleado / Tutor",
  admin:   "Administrador",
  voae:    "VOAE",
  dev:     "⚡ Dev / Preview",
};

const MAINTENANCE_ITEMS = [
  { icon: GraduationCap, label: "Carreras",              subPath: "/maintenance/careers"            },
  { icon: MapPin,        label: "Centros regionales",    subPath: "/maintenance/regional-centers"   },
  { icon: Users,         label: "Tipos de usuario",      subPath: "/maintenance/user-types"         },
  { icon: FileText,      label: "Estados de usuario",    subPath: "/maintenance/user-states"        },
  { icon: Bell,          label: "Tipos de notificación", subPath: "/maintenance/notification-types" },
];

/* ─── ROLES CON MANTENIMIENTO ─── */
const ROLES_WITH_MAINTENANCE = ["admin", "voae", "tutor", "dev", "student"];

export function AppSidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
 
  


  const role = sessionStorage.getItem("unah_role") ?? "student";
  const menuItems = MENU_BY_ROLE[role] ?? MENU_BY_ROLE.student;
  const menuLabel = ROLE_LABELS[role] ?? "Estudiante";

  const prefix = location.pathname.startsWith("/tutor") ? "/tutor"
               : location.pathname.startsWith("/admin") ? "/admin"
               : location.pathname.startsWith("/voae")  ? "/voae"
               : "/student";

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[#003366]">
      <SidebarHeader className="border-b border-[#003366] p-4">
        <Link to={menuItems[0]?.path ?? "/"} className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center p-1">
            <img src="/puma_final.png" alt="Mascota UNAH" className="h-full w-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-white">Conecta Pumas</h2>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin scrollbar-thumb-[#003366] scrollbar-track-transparent">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[#FFD100]">{menuLabel}</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>

              {/* Mis Actividades — primero, solo para student */}
              {role === "student" && (
                <SidebarMenuItem className="mb-2">
                  <button
                    onClick={() => !isCollapsed && setActivityOpen(v => !v)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-[#003366] transition-colors focus:outline-none"
                    title={isCollapsed ? "Mis Actividades" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Rss className="h-5 w-5" />
                      {!isCollapsed && <span>Mis Actividades</span>}
                    </div>
                    {!isCollapsed && (
                      activityOpen
                        ? <ChevronUp   className="h-4 w-4 text-[#FFD100]" />
                        : <ChevronDown className="h-4 w-4 text-[#FFD100]" />
                    )}
                  </button>

                  {activityOpen && !isCollapsed && (
                    <div className="pl-6 mt-1 space-y-1 border-l border-white/20 ml-5">
                      {STUDENT_ACTIVITY_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <SidebarMenuButton
                            key={item.path} asChild isActive={isActive} tooltip={item.label}
                            className={isActive
                              ? "bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] hover:text-[#003366] h-8"
                              : "text-white/80 hover:bg-[#003366] hover:text-white h-8"}
                          >
                            <Link to={item.path} className="flex items-center gap-2">
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              )}


              {/* Ítems del rol */}
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                  || (item.path !== "/student" && item.path !== "/tutor"
                      && item.path !== "/admin"  && item.path !== "/voae"
                      && location.pathname.startsWith(item.path));
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild isActive={isActive} tooltip={item.label}
                      className={isActive
                        ? "bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] hover:text-[#003366]"
                        : "text-white hover:bg-[#003366] hover:text-white"}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Mantenimiento — solo roles permitidos */}
              {ROLES_WITH_MAINTENANCE.includes(role) && (
                <SidebarMenuItem className="mt-2">
                  <button
                    onClick={() => !isCollapsed && setMaintenanceOpen(v => !v)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-[#003366] transition-colors focus:outline-none"
                    title={isCollapsed ? "Mantenimiento" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5" />
                      {!isCollapsed && <span>Mantenimiento</span>}
                    </div>
                    {!isCollapsed && (
                      maintenanceOpen
                        ? <ChevronUp   className="h-4 w-4 text-[#FFD100]" />
                        : <ChevronDown className="h-4 w-4 text-[#FFD100]" />
                    )}
                  </button>

                  {maintenanceOpen && !isCollapsed && (
                    <div className="pl-6 mt-1 space-y-1 border-l border-white/20 ml-5">
                      {MAINTENANCE_ITEMS.map((sub) => {
                        const fullPath = `${prefix}${sub.subPath}`;
                        const isActive = location.pathname === fullPath;
                        return (
                          <SidebarMenuButton
                            key={fullPath} asChild isActive={isActive} tooltip={sub.label}
                            className={isActive
                              ? "bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] hover:text-[#003366] h-8"
                              : "text-white/80 hover:bg-[#003366] hover:text-white h-8"}
                          >
                            <Link to={fullPath} className="flex items-center gap-2">
                              <sub.icon className="h-4 w-4" />
                              <span>{sub.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              )}
              {/* Cerrar sesión */}
              <SidebarMenuItem className="mt-4 border-t border-white/10 pt-2">
                <SidebarMenuButton
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  onClick={handleLogout} tooltip="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span>Cerrar Sesión</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
