import { Outlet, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { AppSidebar } from "../navigation/AppSidebar";
import { AppNavbar } from "../navigation/AppNavbar";
import { BottomNav } from "./BottomNav";
import { SidebarProvider } from "../ui/sidebar";
import { Toaster } from "../ui/sonner";
import { PermissionsWelcomeModal } from "../permissions/PermissionsWelcomeModal";
import { RoleProvider } from "../../../lib/role-context";
import { Mantenimiento } from "../../pages/Mantenimiento";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
const ROLES_EXENTOS = ["admin", "dev"];

export function RootLayout() {
  const location = useLocation();
  const [showPermModal, setShowPermModal] = useState(false);
  const [mantenimiento, setMantenimiento] = useState(false);

  useEffect(() => {
    const isActive = sessionStorage.getItem("unah_session_active") === "true";
    const alreadyAsked = localStorage.getItem("unah_perms_asked") === "true";
    if (isActive && !alreadyAsked) {
      setShowPermModal(true);
      localStorage.setItem("unah_perms_asked", "true");
    }
  }, [location.pathname]);

  useEffect(() => {
    fetch(`${API_URL}/parametros/status`)
      .then(r => r.json())
      .then(d => setMantenimiento(d.mantenimiento ?? false))
      .catch(() => setMantenimiento(false));
  }, [location.pathname]);

  const role = sessionStorage.getItem("unah_role") ?? "";
  if (mantenimiento && !ROLES_EXENTOS.includes(role)) {
    return <Mantenimiento />;
  }

  const bypassLayout =
    location.pathname === "/" ||
    location.pathname === "/roles" ||
    location.pathname.startsWith("/registro");

  if (bypassLayout) {
    return (
      <RoleProvider>
        <Outlet />
        <Toaster />
      </RoleProvider>
    );
  }

  return (
    <RoleProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <AppNavbar />
            <main className="flex-1 overflow-y-auto bg-[#F4F6F8] p-6 pb-20 md:pb-6">
              <Outlet />
            </main>
          </div>
        </div>
        <BottomNav />
        <Toaster />
        <PermissionsWelcomeModal
          open={showPermModal}
          onDone={() => setShowPermModal(false)}
        />
      </SidebarProvider>
    </RoleProvider>
  );
}
