import { Navigate, useLocation } from "react-router";

/**
 * Prefijos permitidos por rol.
 * Todos incluyen /muro, /perfil, /mensajes y /eventos para que la
 * experiencia de "red social" sea igual para cualquier rol autenticado.
 */
const COMMON_SOCIAL = ["/muro", "/perfil", "/mensajes", "/eventos", "/conexiones", "/employees"];

const ROLE_PREFIXES: Record<string, string[]> = {
  student: [...COMMON_SOCIAL, "/student"],
  tutor:   [...COMMON_SOCIAL, "/tutor"],
  admin:   [...COMMON_SOCIAL, "/admin", "/student", "/tutor", "/voae"],
  voae:    [...COMMON_SOCIAL, "/voae", "/tutor"],
  dev:     ["/"], // acceso total
};

/**
 * Home unificado: TODOS los roles aterrizan en el muro tras login.
 * La administración vive dentro de una pestaña colapsada en la sidebar.
 */
const ROLE_HOME: Record<string, string> = {
  student: "/muro",
  tutor:   "/muro",
  admin:   "/muro",
  voae:    "/muro",
  dev:     "/muro",
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
    return <Navigate to={ROLE_HOME[role] ?? "/muro"} replace />;
  }

  return <>{children}</>;
}

export { ROLE_HOME };
