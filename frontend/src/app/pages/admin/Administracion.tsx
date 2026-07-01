import { Shield, Calendar, Users, Settings, MessageSquare, ArrowRight, Clock, Activity, FileSpreadsheet, Lock } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const adminActions = [
  {
    title: "Gestión de Eventos",
    description: "Crear, editar, suspender y monitorear la asistencia de eventos académicos.",
    path: "/admin/events",
    icon: Calendar,
    color: "from-blue-500 to-indigo-600",
    shadow: "shadow-blue-500/10",
  },
  {
    title: "Gestión de Usuarios",
    description: "Administrar cuentas de estudiantes, tutores y personal administrativo.",
    path: "/admin/users",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    shadow: "shadow-emerald-500/10",
  },
  {
    title: "Configuración del Sistema",
    description: "Configurar parámetros del correo, bases de datos y seguridad.",
    path: "/admin/settings",
    icon: Settings,
    color: "from-amber-500 to-orange-600",
    shadow: "shadow-amber-500/10",
  },
  {
    title: "Revisión de Comentarios",
    description: "Moderar encuestas y comentarios sobre eventos realizados.",
    path: "/admin/comments",
    icon: MessageSquare,
    color: "from-rose-500 to-pink-600",
    shadow: "shadow-rose-500/10",
  },
];

const auditLogs = [
  { id: 1, action: "Modificación de Carrera", details: "Carrera 'Ingeniería Civil' editada por Admin", time: "Hace 10 min", user: "admin_puma" },
  { id: 2, action: "Aprobación de Enrolamiento", details: "Forma 03 aprobada para Estudiante: 20211002345", time: "Hace 25 min", user: "sistema_ocr" },
  { id: 3, action: "Cambio de Rol de Usuario", details: "Usuario 'maria.lopez@unah.hn' promovido a Tutor", time: "Hace 1 hora", user: "admin_puma" },
  { id: 4, action: "Configuración de Sistema", details: "Envío de correos SMTP reactivado", time: "Hace 3 horas", user: "admin_puma" },
  { id: 5, action: "Suspensión de Evento", details: "Charla de Inducción suspendida por falta de quórum", time: "Hace 5 horas", user: "admin_puma" },
];

export function Administracion() {
  return (
    <div className="space-y-8 font-sans">
      {/* Header section with gradient line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-gradient-to-br from-[#004B87] to-[#002b5c] text-white rounded-lg flex items-center justify-center shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold text-[#003366] tracking-tight">Módulo de Administración</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 ml-11">
            Panel centralizado para control de operaciones, configuraciones del sistema y auditoría.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Servidores Activos
          </Badge>
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            HTTPS Conectado
          </Badge>
        </div>
      </div>

      {/* Grid of Action Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Card 
              key={i} 
              className={`border border-slate-150 hover:border-slate-300 transition-all duration-300 shadow-sm hover:shadow-md ${action.shadow} group overflow-hidden relative`}
            >
              {/* Background gradient blur decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-5 rounded-full blur-xl -translate-y-6 translate-x-6 transition-transform duration-500 group-hover:scale-150" />
              
              <CardHeader className="flex flex-row items-start gap-4 p-6 pb-2">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${action.color} text-white flex items-center justify-center shadow-lg`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg font-bold text-[#003366] group-hover:text-[#004B87] transition-colors">
                    {action.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-2 flex justify-end">
                <Link 
                  to={action.path}
                  className="inline-flex items-center gap-2 text-xs font-extrabold text-[#004B87] group-hover:text-[#003366] transition-colors"
                >
                  Acceder al Módulo
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Audit Logs and Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Logs Column */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#004B87]" />
                <CardTitle className="text-sm font-bold text-[#003366]">Historial de Auditoría del Sistema</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 bg-white">
                Tiempo Real
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-slate-400 mt-1">
              Últimas 5 acciones de seguridad y cambios de datos registrados.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#003366]">{log.action}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold font-mono">
                        {log.user}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Shortcuts Column */}
        <Card className="border border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="border-b border-slate-100/80 bg-slate-50/50 p-5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#004B87]" />
              <CardTitle className="text-sm font-bold text-[#003366]">Mantenimiento de Catálogos</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-slate-400 mt-1">
              Acceso rápido a bases de datos maestras del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {[
              { label: "Carreras Académicas", path: "/admin/maintenance/careers", desc: "Listas de carreras activas UNAH" },
              { label: "Centros Regionales", path: "/admin/maintenance/regional-centers", desc: "Sedes a nivel nacional" },
              { label: "Tipos de Usuario", path: "/admin/maintenance/user-types", desc: "Permisos y accesos de roles" },
              { label: "Estados de Usuario", path: "/admin/maintenance/user-states", desc: "Activo, inactivo, bloqueado" },
            ].map((cat, idx) => (
              <Link 
                key={idx}
                to={cat.path}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-150 hover:bg-slate-50 hover:border-slate-300 transition-all text-left group"
              >
                <div>
                  <span className="text-xs font-bold text-[#003366] block">{cat.label}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{cat.desc}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[#004B87] group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
