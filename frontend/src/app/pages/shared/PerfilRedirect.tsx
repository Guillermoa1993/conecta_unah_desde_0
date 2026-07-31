import { Navigate } from "react-router";

const DESTINO_PERFIL: Record<string, string> = {
  student: "/student/ficha",
  tutor: "/tutor/ficha",
  admin: "/admin/perfil",
  voae: "/voae/perfil",
  voae_depto: "/voae-depto/perfil",
};

const NORM_ROLE: Record<string, string> = {
  student: "student", estudiante: "student",
  tutor: "tutor", empleado: "tutor", docente: "tutor",
  admin: "admin",
  voae: "voae", voae_direccion: "voae",
  voae_departamento: "voae_depto", voae_depto: "voae_depto",
  dev: "student",
};

export function PerfilRedirect() {
  const rawRole = (sessionStorage.getItem("unah_role") ?? "student").toLowerCase();
  const role = NORM_ROLE[rawRole] ?? "student";
  return <Navigate to={DESTINO_PERFIL[role]} replace />;
}

