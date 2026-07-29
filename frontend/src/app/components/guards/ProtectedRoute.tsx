import { Navigate, useLocation } from "react-router";

const NORM_ROLE: Record<string, string> = {
  student: "student",
  estudiante: "student",
  tutor: "tutor",
  empleado: "tutor",
  docente: "tutor",
  admin: "admin",
  voae: "voae",
  voae_direccion: "voae",
  voae_departamento: "voae_depto",
  voae_depto: "voae_depto",
  coordinacion: "voae_depto",
  departamento: "voae_depto",
  dev: "dev",
};

const ROLE_PREFIXES: Record<string, string[]> = {
  student:    ["/student", "/tutor", "/employees"],
  tutor:      ["/tutor",   "/employees"],
  admin:      ["/admin",   "/employees", "/student", "/tutor", "/voae", "/voae-depto"],
  voae:       ["/voae",    "/tutor", "/employees"],
  voae_depto: ["/voae-depto", "/voae", "/tutor", "/employees"],
  dev:        ["/"],   // acceso total
};

const ROLE_HOME: Record<string, string> = {
  student:    "/student/feed",
  tutor:      "/tutor",
  admin:      "/admin",
  voae:       "/voae",
  voae_depto: "/voae-depto",
  dev:        "/student/feed",
};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isActive = sessionStorage.getItem("unah_session_active") === "true";
  const rawRole  = sessionStorage.getItem("unah_role") ?? "student";
  const role     = NORM_ROLE[rawRole.toLowerCase()] ?? rawRole.toLowerCase();

  if (!isActive) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // rol dev: bypass total
  if (role === "dev") return <>{children}</>;

  const allowed = ROLE_PREFIXES[role] ?? ROLE_PREFIXES.student;
  const canAccess = allowed.some(prefix => location.pathname.startsWith(prefix));

  if (!canAccess) {
    return <Navigate to={ROLE_HOME[role] ?? "/student/feed"} replace />;
  }

  return <>{children}</>;
}
