import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/student/")({
  component: StudentIndex,
});

function StudentIndex() {
  return <Navigate to="/student/muro" replace />;
}
