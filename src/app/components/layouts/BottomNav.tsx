import { Link, useLocation } from "react-router";
import { Home, Calendar, QrCode, User, Rss } from "lucide-react";

export function BottomNav() {
  const location = useLocation();

  const userRole = sessionStorage.getItem("unah_session_role") ?? "/student";
  const userType = sessionStorage.getItem("unah_user_type");
  const isEmpleado = userType === "empleado";

  const studentLinks = [
    { icon: Rss,      label: "Muro",     path: "/student/feed" },
    { icon: Calendar, label: "Eventos",  path: "/student/events" },
    { icon: QrCode,   label: "QR",       path: "/student/scan" },
    { icon: Home,     label: "Inicio",   path: "/student" },
    { icon: User,     label: "Perfil",   path: "/student/ficha" },
  ];

  const empleadoLinks = [
    { icon: Home,     label: "Inicio",   path: userRole },
    { icon: Calendar, label: "Eventos",  path: "/tutor/create-event" },
    { icon: QrCode,   label: "QR",       path: "/student/scan" },
    { icon: User,     label: "Perfil",   path: "/tutor/ficha" },
  ];

  const links = isEmpleado ? empleadoLinks : studentLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#004B87] border-t border-[#003366] flex items-stretch">
      {links.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== "/student" && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
              isActive
                ? "text-[#FFD100]"
                : "text-white/70 hover:text-white"
            }`}
          >
            <item.icon className={`h-5 w-5 ${isActive ? "stroke-[#FFD100]" : ""}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
