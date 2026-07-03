import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/gestion")({
  component: GestionLayout,
});

function GestionLayout() {
  return <Outlet />;
}
