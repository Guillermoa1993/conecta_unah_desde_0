import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/empleado/")({
  component: EmpleadoIndex,
});

function EmpleadoIndex() {
  return <Navigate to="/empleado/muro" replace />;
}
