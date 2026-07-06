import { useState } from "react";
import { Link } from "react-router";
import {
  Search, ArrowRight, LayoutGrid,
  User, Rss, Home, Calendar, QrCode, History, SendHorizonal,
  Plus, Wifi, BarChart3, Bell,
  Shield, Users, KeyRound, Settings, MessageSquare,
  FileText, ClipboardList, MapPin, ShieldCheck,
  GraduationCap, FileSpreadsheet, Database, RefreshCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

/* ======================================================================= */
/*  Catálogo de aplicativos por rol                                        */
/*  Los "path" reutilizan EXACTAMENTE las rutas ya registradas en          */
/*  routes.tsx (mismas que usa AppSidebar) para evitar enlaces rotos.      */
/* ======================================================================= */

type AppTile = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
};

type ThemeOption = {
  id: string;
  label: string;
  gradient: string;
};

const INSTITUTIONAL_THEME = "from-[#004B87] to-[#002b5c]";
const THEME_OPTIONS: ThemeOption[] = [
  { id: "institutional", label: "Institucional", gradient: INSTITUTIONAL_THEME },
  { id: "ocean", label: "Azul", gradient: "from-blue-500 to-indigo-600" },
  { id: "emerald", label: "Verde", gradient: "from-emerald-500 to-teal-600" },
  { id: "amber", label: "Ámbar", gradient: "from-amber-500 to-orange-600" },
  { id: "rose", label: "Rosa", gradient: "from-rose-500 to-pink-600" },
];

const GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-purple-500 to-violet-600",
  "from-cyan-500 to-sky-600",
  "from-fuchsia-500 to-pink-600",
  "from-lime-500 to-green-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-emerald-600",
];

function withColor(items: Omit<AppTile, "color">[]): AppTile[] {
  return items.map((item, i) => ({ ...item, color: GRADIENTS[i % GRADIENTS.length] }));
}

const STUDENT_APPS = withColor([
  { title: "Mi Perfil", description: "Consulta y actualiza tus datos personales y académicos.", path: "/student/ficha", icon: User },
  { title: "Muro", description: "Publicaciones, avisos y novedades de la comunidad universitaria.", path: "/student/feed", icon: Rss },
  { title: "Dashboard", description: "Resumen de tus horas acumuladas y avance del Artículo 140.", path: "/student", icon: Home },
  { title: "Eventos Disponibles", description: "Explora e inscríbete a actividades académicas vigentes.", path: "/student/events", icon: Calendar },
  { title: "Escanear QR", description: "Registra tu asistencia a un evento escaneando su código QR.", path: "/student/scan", icon: QrCode },
  { title: "Mi Historial", description: "Revisa el historial completo de tu participación en eventos.", path: "/student/history", icon: History },
  { title: "Solicitar Evento", description: "Propón la creación de una nueva actividad o evento.", path: "/student/solicitar", icon: SendHorizonal },
]);

const TUTOR_APPS = withColor([
  { title: "Dashboard", description: "Panorama general de tus eventos y actividad reciente.", path: "/tutor", icon: Home },
  { title: "Mis Eventos", description: "Administra las actividades académicas que facilitas.", path: "/tutor/eventos", icon: Calendar },
  { title: "Crear Evento", description: "Publica una nueva actividad para que los estudiantes se inscriban.", path: "/tutor/create-event", icon: Plus },
  { title: "Evento en Vivo", description: "Controla el registro de asistencia en tiempo real.", path: "/tutor/live", icon: Wifi },
  { title: "Notificaciones", description: "Consulta avisos y alertas del sistema.", path: "/employees/notifications", icon: Bell },
  { title: "Bitácora", description: "Historial de acciones registradas en el sistema.", path: "/employees/logs", icon: History },
]);

const ADMIN_APPS = withColor([
  { title: "Administración", description: "Panel centralizado de operaciones y auditoría del sistema.", path: "/admin/administracion", icon: Shield },
  { title: "Gestión de Eventos", description: "Crea, edita y monitorea eventos académicos institucionales.", path: "/admin/events", icon: Calendar },
  { title: "Usuarios", description: "Administra cuentas de estudiantes, tutores y personal.", path: "/admin/users", icon: Users },
  { title: "Roles", description: "Define los roles disponibles dentro del sistema.", path: "/admin/roles", icon: KeyRound },
  { title: "Permisos", description: "Configura la matriz de acceso por rol y módulo.", path: "/admin/permissions", icon: Settings },
  { title: "Configuración", description: "Parámetros globales, seguridad y respaldos del sistema.", path: "/admin/settings", icon: Settings },
  { title: "Notificaciones", description: "Consulta avisos y alertas del sistema.", path: "/employees/notifications", icon: Bell },
  { title: "Bitácora", description: "Historial de acciones registradas en el sistema.", path: "/employees/logs", icon: History },
]);

const VOAE_APPS = withColor([
  { title: "Dashboard", description: "Panorama general de la actividad institucional.", path: "/voae", icon: Home },
  { title: "Registros", description: "Consulta el registro histórico de participación estudiantil.", path: "/voae/records", icon: ClipboardList },
  { title: "Centros Regionales", description: "Administra las sedes de la UNAH a nivel nacional.", path: "/voae/centros", icon: MapPin },
  { title: "Moderadores", description: "Gestiona al personal moderador de eventos y contenido.", path: "/voae/moderadores", icon: ShieldCheck },
  { title: "Notificaciones", description: "Consulta avisos y alertas del sistema.", path: "/employees/notifications", icon: Bell },
  { title: "Bitácora", description: "Historial de acciones registradas en el sistema.", path: "/employees/logs", icon: History },
]);

function dedupeByPath(items: AppTile[]): AppTile[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.path) ? false : (seen.add(i.path), true)));
}

const CATALOG: Record<string, AppTile[]> = {
  student: STUDENT_APPS,
  tutor: TUTOR_APPS,
  admin: ADMIN_APPS,
  voae: VOAE_APPS,
  dev: dedupeByPath([...STUDENT_APPS, ...TUTOR_APPS, ...ADMIN_APPS, ...VOAE_APPS]),
};

/* ─── Catálogos / Mantenimiento (mismo set que AppSidebar) ─── */
const MAINTENANCE_ITEMS = [
  { label: "Carreras", subPath: "/maintenance/careers", icon: GraduationCap },
  { label: "Centros regionales", subPath: "/maintenance/regional-centers", icon: MapPin },
  { label: "Tipos de usuario", subPath: "/maintenance/user-types", icon: Users },
  { label: "Estados de usuario", subPath: "/maintenance/user-states", icon: FileText },
  { label: "Tipos de notificación", subPath: "/maintenance/notification-types", icon: Bell },
  { label: "Backup", subPath: "/maintenance/backup", icon: Database },
  { label: "Reset", subPath: "/maintenance/reset", icon: RefreshCcw },
];
const ROLES_WITH_MAINTENANCE = ["admin", "voae", "tutor", "dev"];

const ROLE_LABELS: Record<string, string> = {
  student: "Estudiante",
  tutor: "Empleado / Tutor",
  admin: "Administrador",
  voae: "VOAE",
  dev: "Todos los módulos (Dev)",
};

export function Aplicativos() {
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    return window.localStorage.getItem("unah_aplicativos_theme") ?? INSTITUTIONAL_THEME;
  });

  const role = sessionStorage.getItem("unah_role") ?? "student";
  const apps = CATALOG[role] ?? CATALOG.student;
  const roleLabel = ROLE_LABELS[role] ?? "Estudiante";

  const updateTheme = (gradient: string) => {
    setSelectedTheme(gradient);
    window.localStorage.setItem("unah_aplicativos_theme", gradient);
  };

  const resetTheme = () => {
    setSelectedTheme(INSTITUTIONAL_THEME);
    window.localStorage.removeItem("unah_aplicativos_theme");
  };

  // El prefijo de mantenimiento depende del rol activo, no de la URL actual
  // (esta página vive en /employees/aplicativos, fuera de los prefijos de rol).
  const maintenancePrefix =
    role === "admin" ? "/admin" : role === "voae" ? "/voae" : role === "tutor" ? "/tutor" : role === "dev" ? "/admin" : "/student";

  const filteredApps = apps.filter((app) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return app.title.toLowerCase().includes(term) || app.description.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 bg-gradient-to-br ${selectedTheme} text-white rounded-lg flex items-center justify-center shadow-md`}>
              <LayoutGrid className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold text-[#004B87]">Aplicativos</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-11 text-sm">
            Accede rápidamente a todos los módulos disponibles para tu rol —{" "}
            <span className="font-semibold text-[#003366]">{roleLabel}</span>
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aplicativo..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-xl bg-slate-50/80">
        <CardHeader className="p-5">
          <CardTitle className="text-base font-bold text-[#003366]">Preferencias de color</CardTitle>
          <CardDescription>
            Cambia la paleta de colores de los aplicativos y vuelve al color institucional cuando lo necesites.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-3">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateTheme(theme.gradient)}
                className={`flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
                  selectedTheme === theme.gradient
                    ? "ring-2 ring-[#003366]"
                    : "opacity-80 hover:opacity-100"
                } bg-gradient-to-r ${theme.gradient}`}
              >
                {theme.label}
              </button>
            ))}
            <button
              type="button"
              onClick={resetTheme}
              className="rounded-xl border border-[#003366] bg-white px-4 py-2 text-sm font-semibold text-[#003366] shadow-sm hover:bg-[#eef4fb]"
            >
              Restaurar color institucional
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Grid principal de aplicativos */}
      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron aplicativos que coincidan con "{search}".
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            return (
              <Link key={app.path + app.title} to={app.path} className="group block">
                <Card className="h-full border border-slate-150 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-xl -translate-y-6 translate-x-6 transition-transform duration-500 group-hover:scale-150" />
                  <CardHeader className="flex flex-row items-start gap-4 p-6 pb-2">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${selectedTheme} text-white flex items-center justify-center shadow-lg shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base font-bold text-[#003366] group-hover:text-[#004B87] transition-colors">
                        {app.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 leading-relaxed">
                        {app.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 pb-5 pt-2 flex justify-end">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#004B87] group-hover:text-[#003366] transition-colors">
                      Abrir
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Catálogos y mantenimiento — mismo criterio de visibilidad que el sidebar */}
      {ROLES_WITH_MAINTENANCE.includes(role) && (
        <Card className="border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 p-5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#004B87]" />
              <CardTitle className="text-sm font-bold text-[#003366]">Catálogos y Mantenimiento</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-slate-400 mt-1">
              Bases de datos maestras del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MAINTENANCE_ITEMS.map((item) => {
              const Icon = item.icon;
              const fullPath = `${maintenancePrefix}${item.subPath}`;
              return (
                <Link
                  key={fullPath}
                  to={fullPath}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                  <div className="h-8 w-8 rounded-md bg-[#F4F6F8] text-[#004B87] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-[#003366] flex-1">{item.label}</span>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#004B87] group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Badge variant="outline" className="text-[10px] text-slate-400 font-medium">
          {filteredApps.length} de {apps.length} aplicativo{apps.length === 1 ? "" : "s"} disponible{apps.length === 1 ? "" : "s"}
        </Badge>
      </div>
    </div>
  );
}
