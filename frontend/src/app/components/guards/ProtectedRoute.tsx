import { Navigate, useLocation } from "react-router";

const ROLE_PREFIXES: Record<string, string[]> = {
  student: ["/student", "/employees"],
  tutor:   ["/tutor",   "/employees"],
  admin:   ["/admin",   "/employees", "/student", "/tutor", "/voae"],
  voae:    ["/voae",    "/employees"],
  dev:     ["/"],   // acceso total
};

const ROLE_HOME: Record<string, string> = {
  student: "/student/feed",
  tutor:   "/tutor",
  admin:   "/admin",
  voae:    "/voae",
  dev:     "/student/feed",
};

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isActive = sessionStorage.getItem("unah_session_active") === "true";
  const role     = sessionStorage.getItem("unah_role") ?? "student";

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
