import { useNavigate } from "react-router";
import { GraduationCap, Users, Shield, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const roles = [
  {
    id: "student",
    title: "Estudiante",
    description: "Accede a eventos, escanea QR y consulta tu progreso académico",
    icon: GraduationCap,
    path: "/student",
    color: "from-[#004B87] to-[#003366]",
  },
  {
    id: "tutor",
    title: "Tutor / Facilitador",
    description: "Crea y gestiona eventos, valida asistencia y genera reportes",
    icon: BookOpen,
    path: "/tutor",
    color: "from-[#003366] to-[#004B87]",
  },
  {
    id: "admin",
    title: "Administrador",
    description: "Gestiona usuarios, eventos y configuración del sistema",
    icon: Users,
    path: "/admin",
    color: "from-[#004B87] to-[#003366]",
  },
  {
    id: "voae",
    title: "Personal VOAE",
    description: "Auditoría, validación de certificados y reportes oficiales",
    icon: Shield,
    path: "/voae",
    color: "from-[#003366] to-[#004B87]",
  },
];

export function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004B87] via-[#003366] to-[#004B87] flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#FFD100] mb-6">
            <GraduationCap className="h-12 w-12 text-[#003366]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Conecta Pumas</h1>
          <p className="text-xl text-white/90">Sistema de Gestión de Eventos - Artículo 140</p>
          <p className="text-white/70 mt-2">Selecciona tu rol para continuar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="overflow-hidden transition-all hover:scale-105 hover:shadow-2xl cursor-pointer border-2 border-transparent hover:border-[#FFD100]"
              onClick={() => navigate(role.path)}
            >
              <CardHeader className={`bg-gradient-to-r ${role.color} text-white p-6`}>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                    <role.icon className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-2xl">{role.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardDescription className="text-base text-gray-700">
                  {role.description}
                </CardDescription>
                <Button className="w-full mt-4 bg-[#004B87] hover:bg-[#003366]">
                  Acceder como {role.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-white/70 text-sm">
          <p>Universidad Nacional Autónoma de México</p>
          <p className="mt-1">© 2026 Conecta Pumas - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
}
