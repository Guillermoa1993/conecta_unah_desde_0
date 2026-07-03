import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { RoleProvider, useRole } from "@/lib/role-context";
import { SurveyProvider, useSurvey } from "@/lib/survey-context";
import { SidebarProvider } from "@/lib/sidebar-context";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AppNavbar } from "@/components/app/AppNavbar";
import { SurveyModal } from "@/components/app/SurveyModal";
import { HelpButton } from "@/components/app/HelpButton";
import { BackToTop } from "@/components/app/BackToTop";
import { PumitasConectados } from "@/components/app/PumitasConectados";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function PwaRegister() {
  const onNeedRefresh = useCallback(() => {
    toast("Nueva versión disponible", {
      description: "Actualiza la app para ver los cambios más recientes.",
      action: { label: "Actualizar", onClick: () => window.location.reload() },
      duration: Infinity,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
    navigator.serviceWorker.register("/sw.js").catch(() => {});
    const interval = setInterval(() => {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        if (reg.waiting) onNeedRefresh();
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [onNeedRefresh]);

  return null;
}

function AppShell() {
  return (
    <RoleProvider>
      <SurveyProvider>
        <SidebarProvider>
          <InnerShell />
        </SidebarProvider>
      </SurveyProvider>
    </RoleProvider>
  );
}

function InnerShell() {
  const { role } = useRole();

  return (
    <div
      className="min-h-screen flex bg-background pt-14 md:pt-0"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <PwaRegister />
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppNavbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden overscroll-behavior-contain">
          <Outlet />
        </main>
      </div>
      {role === "student" && <PumitasConectados />}
      <Toaster position="top-right" />
      <GlobalSurvey />
      <BackToTop />
      <HelpButton />
    </div>
  );
}

function GlobalSurvey() {
  const { pending, dismissSurvey } = useSurvey();
  return (
    <SurveyModal open={!!pending} eventTitle={pending?.eventTitle ?? ""} onClose={dismissSurvey} />
  );
}
