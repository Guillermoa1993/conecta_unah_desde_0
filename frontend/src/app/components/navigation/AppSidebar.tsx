import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router";
import {
  Home, Calendar, QrCode, History, Plus, BarChart3, Users, Settings,
  Shield, FileText, MessageSquare, ChevronDown, ChevronUp,
  MapPin, Bell, LogOut, Rss, KeyRound, User,
  Wifi, ShieldCheck, ClipboardList, SendHorizonal, Database, SlidersHorizontal, Mail,
  Info, Palette,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "../ui/sidebar";
import { useModulosPermitidos } from "../../../hooks/useModulosPermitidos";

/* ─── TIPOS ─── */
type MenuItem = { icon: React.ElementType; label: string; path: string };

/* ─── RED SOCIAL: mismos ítems para TODOS los roles autenticados ─── */
const SOCIAL_ITEMS: MenuItem[] = [
  { icon: Rss,      label: "Muro",           path: "/muro" },
  { icon: User,     label: "Perfil",         path: "/student/ficha" },
  { icon: Calendar, label: "Mis Eventos",    path: "/student/events" },
  { icon: Bell,     label: "Notificaciones", path: "/employees/notifications" },
  { icon: Home,     label: "Dashboard",      path: "/student" },
];

/* ─── ADMINISTRACIÓN: sección colapsada por rol ─── */
const ADMIN_ITEMS_BY_ROLE: Record<string, MenuItem[]> = {
  student: [
    { icon: Calendar,      label: "Mis eventos",     path: "/student/events"   },
    { icon: SendHorizonal, label: "Solicitar evento", path: "/student/solicitar" },
    { icon: History,       label: "Historial",        path: "/student/history"  },
  ],
  tutor: [
    { icon: Plus,      label: "Crear evento",       path: "/tutor/create-event" },
    { icon: Calendar,  label: "Mis eventos",        path: "/tutor/eventos"      },
    { icon: History,   label: "Historial tutorías", path: "/tutor/history"      },
    { icon: BarChart3, label: "Reportes",           path: "/tutor/reports"      },
    { icon: Wifi,      label: "Evento en vivo",     path: "/tutor/live"         },
  ],
  admin: [
    { icon: Shield,            label: "Panel admin",        path: "/admin/administracion" },
    { icon: Users,             label: "Usuarios",           path: "/admin/users"          },
    { icon: KeyRound,          label: "Roles",              path: "/admin/roles"          },
    { icon: Settings,          label: "Permisos",           path: "/admin/permissions"    },
    { icon: Calendar,          label: "Gestión de eventos", path: "/admin/events"         },
    { icon: MessageSquare,     label: "Comentarios",        path: "/admin/comments"       },
    { icon: Database,          label: "Respaldo",           path: "/admin/backup"         },
    { icon: SlidersHorizontal, label: "Parámetros",         path: "/admin/parametros"     },
    { icon: BarChart3,         label: "Reportes",           path: "/tutor/reports"        },
    { icon: History,           label: "Bitácora",           path: "/employees/logs"       },
  ],
  voae: [
    { icon: Home,          label: "Panel VOAE",        path: "/voae"             },
    { icon: FileText,      label: "Reportes oficiales",path: "/voae/reports"     },
    { icon: ClipboardList, label: "Histórico eventos", path: "/voae/records"     },
    { icon: MapPin,        label: "Centros regionales",path: "/voae/centros"     },
    { icon: ShieldCheck,   label: "Moderadores",       path: "/voae/moderadores" },
    { icon: History,       label: "Bitácora",          path: "/employees/logs"   },
  ],
  voae_depto: [
    { icon: Home,          label: "Panel Coordinación", path: "/voae-depto"          },
    { icon: FileText,      label: "Reportes",           path: "/voae/reports"        },
    { icon: ClipboardList, label: "Histórico eventos",  path: "/voae/records"        },
    { icon: History,       label: "Bitácora",           path: "/employees/logs"      },
  ],
  dev: [
    { icon: Home,          label: "Panel VOAE",         path: "/voae"                 },
    { icon: FileText,      label: "Reportes VOAE",      path: "/voae/reports"         },
    { icon: Plus,          label: "Crear evento",       path: "/tutor/create-event"   },
    { icon: BarChart3,     label: "Reportes tutor",     path: "/tutor/reports"        },
    { icon: QrCode,        label: "QR Scanner",         path: "/student/scan"         },
    { icon: SendHorizonal, label: "Solicitar evento",   path: "/student/solicitar"    },
    { icon: History,       label: "Bitácora",           path: "/employees/logs"       },
  ],
};

/* ─── CATÁLOGO ADMIN filtrado por permisos de Seguridad ─── */
type CatalogItem = MenuItem & { modulo: string | null };

const ADMIN_MODULE_CATALOG: CatalogItem[] = [
  { icon: Shield,            label: "Panel admin",        path: "/admin/administracion", modulo: null          },
  { icon: Users,             label: "Usuarios",           path: "/admin/users",          modulo: "usuarios"    },
  { icon: KeyRound,          label: "Roles",              path: "/admin/roles",          modulo: "seguridad"   },
  { icon: Settings,          label: "Permisos",           path: "/admin/permissions",    modulo: "seguridad"   },
  { icon: Calendar,          label: "Gestión de eventos", path: "/admin/events",         modulo: "eventos"     },
  { icon: MessageSquare,     label: "Comentarios",        path: "/admin/comments",       modulo: "comentarios" },
  { icon: Database,          label: "Respaldo",           path: "/admin/backup",         modulo: "respaldos"   },
  { icon: SlidersHorizontal, label: "Parámetros",         path: "/admin/parametros",     modulo: "parametros"  },
  { icon: BarChart3,         label: "Reportes",           path: "/tutor/reports",        modulo: "reportes"    },
  { icon: History,           label: "Bitácora",           path: "/employees/logs",       modulo: "bitacora"    },
];

const ROLE_LABELS: Record<string, string> = {
  student:    "Estudiante",
  tutor:      "Empleado",
  admin:      "Administrador",
  voae:       "VOAE Dirección",
  voae_depto: "VOAE Departamento",
  dev:        "⚡ Dev / Preview",
};

const ROLES_ADMIN_LIKE = ["admin", "dev"];

const ADMIN_SECTION_LABELS: Record<string, string> = {
  admin:      "Administración",
  dev:        "Administración",
  student:    "Mi Gestión de Eventos",
  tutor:      "Mis herramientas",
  voae:       "Panel VOAE",
  voae_depto: "Panel Coordinación",
};

const NORM_ROLE: Record<string, string> = {
  tutor: "tutor", empleado: "tutor", docente: "tutor",
  voae: "voae", voae_direccion: "voae",
  voae_departamento: "voae_depto", voae_depto: "voae_depto",
  coordinacion: "voae_depto", departamento: "voae_depto",
  admin: "admin", student: "student", estudiante: "student", dev: "dev",
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export function AppSidebar() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const [adminOpen, setAdminOpen] = useState(false);
  const [soporte, setSoporte] = useState({ correo: "", whatsapp: "" });

  useEffect(() => {
    fetch(`${API_URL}/parametros/soporte`)
      .then(r => r.json())
      .then(d => setSoporte(d))
      .catch(() => {});
  }, []);

  const rawRole = (sessionStorage.getItem("unah_role") ?? "").toLowerCase();
  const role = NORM_ROLE[rawRole] ?? (
    location.pathname.startsWith("/voae-depto") ? "voae_depto" :
    location.pathname.startsWith("/voae")  ? "voae" :
    location.pathname.startsWith("/tutor") ? "tutor" :
    location.pathname.startsWith("/admin") ? "admin" :
    "student"
  );

  const roleLabel = ROLE_LABELS[role] ?? "Estudiante";

  const { modulos: modulosPermitidos, configurado: permisosConfigurados } = useModulosPermitidos();

  const isAdminLikeRole = ROLES_ADMIN_LIKE.includes(role);
  const adminSectionLabel = ADMIN_SECTION_LABELS[role] ?? "Herramientas";

  const adminItems =
    isAdminLikeRole && permisosConfigurados
      ? ADMIN_MODULE_CATALOG.filter(
          (item) => item.modulo === null || modulosPermitidos.has(item.modulo),
        )
      : (ADMIN_ITEMS_BY_ROLE[role] ?? []);

  const hasAdminSection = adminItems.length > 0;

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon" className="border-r border-[#003366]">
      <SidebarHeader className="border-b border-[#003366] p-4">
        <Link to="/muro" className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center p-1">
            <img src="/puma_final.png" alt="Mascota UNAH" className="h-full w-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-semibold text-white">Conecta Pumas</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/50">{roleLabel}</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin scrollbar-thumb-[#003366] scrollbar-track-transparent">
        {/* ─── RED SOCIAL (común a todos los roles) ─── */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[#FFD100]">Red Social</SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {SOCIAL_ITEMS.map((item) => {
                const active = isPathActive(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild isActive={active} tooltip={item.label}
                      className={active
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ─── ADMINISTRACIÓN (colapsada, solo para roles con permisos) ─── */}
        {hasAdminSection && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <button
                    onClick={() => !isCollapsed && setAdminOpen(v => !v)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-[#003366] transition-colors focus:outline-none"
                    title={isCollapsed ? adminSectionLabel : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5" />
                      {!isCollapsed && <span>{adminSectionLabel}</span>}
                    </div>
                    {!isCollapsed && (
                      adminOpen
                        ? <ChevronUp   className="h-4 w-4 text-[#FFD100]" />
                        : <ChevronDown className="h-4 w-4 text-[#FFD100]" />
                    )}
                  </button>

                  {adminOpen && !isCollapsed && (
                    <div className="pl-6 mt-1 space-y-1 border-l border-white/20 ml-5">
                      {adminItems.map((item) => {
                        const active = isPathActive(item.path);
                        return (
                          <SidebarMenuButton
                            key={item.path} asChild isActive={active} tooltip={item.label}
                            className={active
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

                      {isAdminLikeRole && (
                        <SidebarMenuButton
                          asChild isActive={isPathActive("/employees/aplicativos")} tooltip="Colores de Aplicativos"
                          className={isPathActive("/employees/aplicativos")
                            ? "bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] hover:text-[#003366] h-8 mt-1"
                            : "text-white/80 hover:bg-[#003366] hover:text-white h-8 mt-1"}
                        >
                          <Link to="/employees/aplicativos" className="flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            <span className="text-xs">Colores de Aplicativos</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </div>
                  )}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ─── SOPORTE + LOGOUT + ACERCA DE ─── */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {(soporte.correo || soporte.whatsapp) && (
                <SidebarMenuItem className="mt-2 border-t border-white/10 pt-2">
                  {!isCollapsed && (
                    <p className="px-3 py-1 text-[10px] uppercase tracking-widest text-white/40">Soporte</p>
                  )}
                  {soporte.whatsapp && (
                    <SidebarMenuButton asChild tooltip="WhatsApp Soporte" className="text-white/80 hover:bg-[#003366] hover:text-white">
                      <a href={`https://wa.me/${soporte.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-[#25D366] flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {!isCollapsed && <span>WhatsApp Soporte</span>}
                      </a>
                    </SidebarMenuButton>
                  )}
                  {soporte.correo && (
                    <SidebarMenuButton asChild tooltip={`Correo: ${soporte.correo}`} className="text-white/80 hover:bg-[#003366] hover:text-white">
                      <a href={`mailto:${soporte.correo}`} className="flex items-center gap-2">
                        <Mail className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">{soporte.correo}</span>}
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              )}

              <SidebarMenuItem className="mt-4 border-t border-white/10 pt-2">
                <SidebarMenuButton
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                  onClick={handleLogout} tooltip="Cerrar Sesión"
                >
                  <LogOut className="h-5 w-5" />
                  {!isCollapsed && <span>Cerrar Sesión</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild isActive={isPathActive("/employees/acerca-de")} tooltip="Acerca de"
                  className={isPathActive("/employees/acerca-de")
                    ? "bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] hover:text-[#003366]"
                    : "text-white/60 hover:bg-[#003366] hover:text-white"}
                >
                  <Link to="/employees/acerca-de" className="flex items-center gap-3">
                    <Info className="h-5 w-5" />
                    {!isCollapsed && <span>Acerca de</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
