import {
  Clock, QrCode, ShieldCheck, Bell, History, Smartphone,
  KeyRound, Lock, Users, Database, ClipboardCheck, Compass,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import logoUnah from "../../../imports/logoUnah.png";
import logoIA from "../../../imports/logoIA.png";

/* ─── Información editable del sistema ─── */
const APP_INFO = {
  version: "1.0.0",
  ciclo: "II Periodo Académico 2026",
  institucion: "Universidad Nacional Autónoma de Honduras (UNAH)",
  programa: "Informática Administrativa",
};

const FEATURES = [
  { title: "Seguimiento de Horas", description: "Progreso automático del cumplimiento del Artículo 140.", icon: Clock, color: "from-blue-500 to-indigo-600" },
  { title: "Asistencia por QR", description: "Check-in rápido y verificable en cada evento.", icon: QrCode, color: "from-emerald-500 to-teal-600" },
  { title: "Roles y Permisos", description: "Control de acceso granular por módulo y acción.", icon: ShieldCheck, color: "from-amber-500 to-orange-600" },
  { title: "Notificaciones en Tiempo Real", description: "Avisos instantáneos sobre eventos y solicitudes.", icon: Bell, color: "from-rose-500 to-pink-600" },
  { title: "Bitácora de Auditoría", description: "Trazabilidad completa de las acciones del sistema.", icon: History, color: "from-purple-500 to-violet-600" },
  { title: "Progressive Web App", description: "Instalable y optimizada para móvil, tablet y escritorio.", icon: Smartphone, color: "from-cyan-500 to-sky-600" },
];

const TECH_FRONTEND = ["React", "TypeScript", "Vite", "Tailwind CSS", "shadcn/ui", "React Router", "PWA / Workbox"];
const TECH_BACKEND = ["Node.js", "Express.js", "TypeScript", "MySQL", "Docker", "Clean Architecture", "JWT"];

/* ─── Equipo — 7 roles, según la división de trabajo del proyecto ─── */
const TEAM = [
  { role: "Líder Técnico", responsibility: "Arquitectura general, diseño de base de datos y estándares del equipo.", icon: Compass, color: "from-blue-500 to-indigo-600" },
  { role: "Desarrollo de Roles", responsibility: "CRUD de roles: pantallas, modelo y API.", icon: KeyRound, color: "from-emerald-500 to-teal-600" },
  { role: "Desarrollo de Permisos", responsibility: "Matriz de acceso: asignación de permisos por módulo y rol.", icon: Lock, color: "from-amber-500 to-orange-600" },
  { role: "Desarrollo de Usuarios", responsibility: "Gestión de cuentas: alta, edición y control de acceso.", icon: Users, color: "from-rose-500 to-pink-600" },
  { role: "Desarrollo de Bitácora", responsibility: "Función universal de registro (logs) de todo el sistema.", icon: History, color: "from-purple-500 to-violet-600" },
  { role: "Desarrollo de Back Up", responsibility: "Respaldos manuales y automáticos, e histórico de restauración.", icon: Database, color: "from-cyan-500 to-sky-600" },
  { role: "QA + Integración", responsibility: "Pruebas funcionales, conexión entre módulos y documentación final.", icon: ClipboardCheck, color: "from-lime-500 to-green-600" },
];

export function AcercaDe() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-[#004B87] to-[#003366]">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-20 w-20 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
              <img src={logoUnah} alt="Escudo UNAH" className="h-full w-full object-contain" />
            </div>
            <div className="h-20 w-20 bg-white rounded-xl p-2 flex items-center justify-center shadow-lg">
              <img src={logoIA} alt="Informática Administrativa" className="h-full w-full object-contain" />
            </div>
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-white">Conecta Pumas</h1>
            <p className="text-white/80 mt-2 max-w-xl text-sm leading-relaxed">
              Plataforma institucional de la UNAH para gestionar, validar y dar seguimiento
              de forma digital a las actividades académicas relacionadas con el Artículo 140.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
              <Badge className="bg-[#FFD100] text-[#003366] hover:bg-[#FFD100] font-bold">
                v{APP_INFO.version}
              </Badge>
              <Badge variant="outline" className="border-white/30 text-white">
                {APP_INFO.ciclo}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qué es */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#003366]">¿Qué es Conecta Pumas?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600 leading-relaxed">
          <p>
            Conecta Pumas centraliza el registro de asistencia, la inscripción a eventos y el
            control de cumplimiento de horas del Artículo 140, reemplazando el seguimiento manual
            en papel por un flujo digital con check-in por código QR, paneles de progreso y
            reportes institucionales listos para auditoría.
          </p>
          <p>
            El sistema distingue cuatro roles —Estudiante, Tutor/Facilitador, Administrador y
            Personal VOAE— cada uno con su propia vista y nivel de acceso, y está construido como
            una Progressive Web App para poder instalarse y usarse igual de bien desde un
            teléfono, una tablet o una computadora.
          </p>
        </CardContent>
      </Card>

      {/* Funcionalidades destacadas */}
      <div>
        <h2 className="text-sm font-bold text-[#003366] mb-3 px-1">Funcionalidades Principales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="border border-slate-150 shadow-sm">
                <CardContent className="p-5 flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${f.color} text-white flex items-center justify-center shadow-md shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#003366]">{f.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tecnologías */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#003366]">Tecnologías Utilizadas</CardTitle>
          <CardDescription>Stack completo del proyecto, frontend y backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Frontend</p>
            <div className="flex flex-wrap gap-2">
              {TECH_FRONTEND.map((t) => (
                <Badge key={t} variant="outline" className="text-[#004B87] border-[#004B87]/30 bg-[#004B87]/5">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Backend</p>
            <div className="flex flex-wrap gap-2">
              {TECH_BACKEND.map((t) => (
                <Badge key={t} variant="outline" className="text-emerald-700 border-emerald-600/30 bg-emerald-600/5">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipo de desarrollo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#003366]">Equipo de Desarrollo</CardTitle>
          <CardDescription>
            Proyecto desarrollado por 7 integrantes de {APP_INFO.programa}, cada uno a cargo de un módulo del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((member) => {
            const Icon = member.icon;
            return (
              <div key={member.role} className="rounded-lg border border-slate-150 p-4 text-center hover:border-slate-300 hover:shadow-sm transition-all">
                <div className={`h-12 w-12 mx-auto rounded-full bg-gradient-to-br ${member.color} text-white flex items-center justify-center shadow-md mb-2`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-[#003366]">{member.role}</p>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{member.responsibility}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-1 pb-4">
        <p className="text-xs text-slate-400">
          {APP_INFO.institucion} · {APP_INFO.programa}
        </p>
        <p className="text-[11px] text-slate-300">Proyecto académico · {APP_INFO.ciclo}</p>
      </div>
    </div>
  );
}
