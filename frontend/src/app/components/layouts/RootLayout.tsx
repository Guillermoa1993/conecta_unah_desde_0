import { Outlet, useLocation } from "react-router";
import { useState, useEffect } from "react";
import { AppSidebar } from "../navigation/AppSidebar";
import { AppNavbar } from "../navigation/AppNavbar";
import { BottomNav } from "./BottomNav";
import { SidebarProvider } from "../ui/sidebar";
import { Toaster } from "../ui/sonner";
import { PermissionsWelcomeModal } from "../permissions/PermissionsWelcomeModal";

export function RootLayout() {
  const location = useLocation();
  const [showPermModal, setShowPermModal] = useState(false);

  useEffect(() => {
    const isActive = sessionStorage.getItem("unah_session_active") === "true";
    const alreadyAsked = sessionStorage.getItem("unah_perms_asked") === "true";
    if (isActive && !alreadyAsked) {
      setShowPermModal(true);
      sessionStorage.setItem("unah_perms_asked", "true");
    }
  }, [location.pathname]);

  const bypassLayout =
    location.pathname === "/" ||
    location.pathname === "/roles" ||
    location.pathname.startsWith("/registro");

  if (bypassLayout) {
    return (
      <>
        <Outlet />
        <Toaster />
      </>
    );
  }

  return (
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
  );
}
